const { transaction } = require('objection');
const { State, Machine, send, assign, interpret } = require('xstate');
const SubscriptionState = require('../../db/models/subscriptionState')

//change hardcoded values
const subscriptionValid = (context, event) => {
    return context.remainingFulfillmentIntervals > 0 && !context.paused;
}

const subscriptionPaused = (context, event) => {
    return context.paused;
}

const pauseSubscription = assign({
    paused: true
});

const resumeSubscription = assign({
    paused: false
});

const subscriptionInvalid = (context, event) => {
    return context.remainingFulfillmentIntervals < 1 && !context.paused;
}

const deductSubscriptionValue = assign({
    remainingFulfillmentIntervals: (context, event) => {
        return context.remainingFulfillmentIntervals - 1
    }
});

const incrementSubscriptionValue = assign({
    remainingFulfillmentIntervals: (context, event) => {
        if (event.value) {
            return context.remainingFulfillmentIntervals + event.value   
        } else {
            return context.remainingFulfillmentIntervals
        }
        
    }
});

const machine = Machine({

    id: 'subscription',
    type: 'parallel',
    context: {
        remainingFulfillmentIntervals: 0,
        paused:false
      },
    states: {
        subscription: {
            initial: 'inactive',
            states: {
              inactive: {
                on: {
                  ACTIVATE: 'active',
                }
              },
              active: {
                on: {
                  PAUSE: 'paused',
                  EXPIRED: {
                      target:'inactive',
                      actions:send('END_CYCLE')
                    },
                }
              },
              paused: {
                entry:pauseSubscription,
                exit:resumeSubscription,
                on: {
                    RESUME: 'active',
                  }
              }
            }
        },
        payment: {
            initial: 'pending',
            states: {
                pending: {
                    on: {
                        PAYMENT_DECLINED: 'declined',
                        PAYMENT_SUCCESS: {
                            target:'successful',
                            actions:send('ACTIVATE')
                        }
                    }
                },
                successful: {
                    entry:incrementSubscriptionValue,
                    on: {
                        END_CYCLE: 'pending',
                        '': [
                            { target: 'pending', cond: subscriptionInvalid },
                        ],
                    }
                },
                declined: {
                    on: {
                        PAYMENT_SUCCESS: {
                            target:'successful',
                            actions:send('ACTIVATE')
                        }
                    }
                }
            },
        },
        fulfillment:{
            initial: 'ineligible',
            states:{
                ineligible:{
                    on:{
                        ACTIVATE:{ target: 'pending', cond: subscriptionValid}
                    }
                },
                pending:{
                    on:{
                        INITIATED:'initiated'
                    },
                },
                initiated:{
                    on:{
                        SHIPPED:'shipped',
                        SUCCESS:'successful',
                        FAILURE:'failure'
                        
                    },
                },
                shipped:{
                    on:{
                        SUCCESS:'successful',
                        FAILURE:'failure'
                    },
                },
                successful:{
                    entry:deductSubscriptionValue,
                    on:{
                        RESET_CYCLE:{ target: 'pending', cond: subscriptionValid},
                        END_CYCLE:{ 
                            target: 'ineligible', 
                            cond: subscriptionInvalid ,
                            actions:send('EXPIRED')
                        }, //if payment is pending, deactivate subscription
                    }
                },
                failure:{
                    on:{
                        INITIATED:'initiated',
                        SHIPPED:'shipped',
                        RESET_CYCLE:{ target: 'pending', cond: subscriptionValid },
                    },
                },
            }
        }
    },
    actions: {
        deductSubscriptionValue,
        incrementSubscriptionValue
    },
    guards:{
        subscriptionValid
    }
})


const stateManager = async (subscriptionId = 49, event = "PAYMENT_SUCCESS", params = {}) => {

    const storedState = await SubscriptionState.query().where('subscription_id',subscriptionId)
    
    var lastState 
    storedState.map(state => {
        if (!lastState){
            lastState = state
        }else{
            if (lastState.id < state.id) {
                lastState = state
            }
        }
    })

    var service 

    if (lastState){

        const stateDefinition = lastState.state

        // Use State.create() to restore state from a plain object
        const previousState = State.create(stateDefinition);

        // Use machine.resolveState() to resolve the state definition to a new State instance relative to the machine
        const resolvedState = machine.resolveState(previousState);

        // Start the service
        service = interpret(machine).start(resolvedState);

    }else {
        service = interpret(machine).start();
    }

    service.onTransition(async (_state) => {

        if (_state.changed){

            const knex = SubscriptionState.knex();
            
            try {

                var options
                if (_state.value.fulfillment == 'ineligible'){
                    options = (machine.states.fulfillment.states.ineligible.events)
                }else if (_state.value.fulfillment == 'pending'){
                    options = (machine.states.fulfillment.states.pending.events)
                }else if (_state.value.fulfillment == 'initiated'){
                    options = (machine.states.fulfillment.states.initiated.events)
                }else if (_state.value.fulfillment == 'shipped'){
                    options = (machine.states.fulfillment.states.shipped.events)
                }else if (_state.value.fulfillment == 'successful'){
                    options = (machine.states.fulfillment.states.successful.events)
                }else if (_state.value.fulfillment == 'failure'){
                    options = (machine.states.fulfillment.states.failure.events)
                }
                
                const state = await transaction(knex, async (trx) => {

                    const newState = await SubscriptionState
                    .query(trx)
                    .insert({
                        'subscription_id': subscriptionId, 
                        'state': _state, 
                        'subscription_state':_state.value.subscription, 
                        'payment_state':_state.value.payment, 
                        'fulfillment_state':_state.value.fulfillment,
                        'fulfillment_options':options
                    });
                    return newState;
                });
                
            } catch (err) {
                console.log(err, 'Something went wrong. State not inserted');
            }
        }
    });

    // Send events
    service.send(event,params);

    // Stop the service when you are no longer using it.
    service.stop();

}

module.exports = stateManager;