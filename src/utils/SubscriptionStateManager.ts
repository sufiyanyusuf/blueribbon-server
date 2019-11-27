import { transaction } from 'objection'
import { State, Machine, actions, send, interpret, Action, MachineConfig, matchesState } from 'xstate'
import { Transaction } from 'knex';
import { stateValuesEqual } from 'xstate/lib/State';
const SubscriptionState = require('../../db/models/subscriptionState')
const moment = require('moment')


const { assign } = actions;

export enum EventTypes{
    endCycle = 'END_CYCLE',
    resetCycle = 'RESET_CYCLE',
    activate = 'ACTIVATE',
    pause = 'PAUSE',
    resume = 'RESUME',
    expired = 'EXPIRED',
    initiated = 'INITIATED',
    shipped = 'SHIPPED',
    success = 'SUCCESS',
    failure = 'FAILURE',
    paymentSuccess = 'PAYMENT_SUCCESS',
    paymentDeclined = 'PAYMENT_DECLINED',
}

export enum States{
    ineligible='ineligible',
    pending='pending',
    initiated='initiated',
    shipped='shipped',
    failure='failure',
    successful='successful',
    inactive='inactive',
    active='active',
    paused='paused',
}

interface subscriptionStateRecord {
    id: BigInteger,
    timestamp: String,
    subscription_id: BigInteger,
    state: any,
    subscription_state: string,
    payment_state: string,
    fulfillment_state: string,
    fulfillment_options:Array<String>
}

interface context {
    remainingFulfillmentIntervals: number,
    paused: boolean,
    fulfillmentOffset:number
}

interface schema {
    states: {
        subscription: {
            states: {
                inactive:{},
                active:{},
                paused:{}
            }
        },
        payment: {
            states: {
                pending: {},
                successful: {},
                declined: {}
            }
        },
        fulfillment: {
            states: {
                ineligible: {},
                pending: {},
                initiated: {},
                shipped: {},
                successful: {},
                failure:{}
            }
        }
        
    }
}

export type SubscriptionEvent =
  | { type: EventTypes.endCycle }
  | { type: EventTypes.resetCycle  }
  | { type: EventTypes.activate  }
  | { type: EventTypes.pause  }
  | { type: EventTypes.resume  }
  | { type: EventTypes.expired  }
  | { type: EventTypes.initiated  }
  | { type: EventTypes.shipped  }
  | { type: EventTypes.success  }
  | { type: EventTypes.failure  }
  | { type: EventTypes.paymentSuccess , value:number, fulfillmentOffset:number }
  | { type: EventTypes.paymentDeclined  }

  
const subscriptionValid = (context: context, event: SubscriptionEvent) => {
    return context.remainingFulfillmentIntervals > 0 && !context.paused;
}

const subscriptionNotPaused = (context:context, event:SubscriptionEvent) => {
    return (context.paused != true );
}

const pauseSubscription = assign({
    paused: true
});

const resumeSubscription = assign({
    paused: false
});

const subscriptionInvalid = (context:context, event:SubscriptionEvent) => {
    return context.remainingFulfillmentIntervals < 1 && !context.paused;
}

const deductSubscriptionValue = actions.assign<context,SubscriptionEvent>({
    remainingFulfillmentIntervals: (context:context, event:SubscriptionEvent) => {
        return context.remainingFulfillmentIntervals - 1
    }
});

const incrementSubscriptionValue = actions.assign<context,SubscriptionEvent>({
    remainingFulfillmentIntervals: (context:context, event:SubscriptionEvent) => {
        if (event.type == 'PAYMENT_SUCCESS' && event.value) {
            return context.remainingFulfillmentIntervals + event.value   
        } else {
            return context.remainingFulfillmentIntervals
        } 
    },
    fulfillmentOffset: (context:context, event:SubscriptionEvent) => {
        if (event.type == 'PAYMENT_SUCCESS' && event.fulfillmentOffset) {
            return context.fulfillmentOffset + event.fulfillmentOffset   
        } else {
            return context.fulfillmentOffset
        } 
    },
});


const machine = Machine<context,schema,SubscriptionEvent>({

    id: 'subscription',
    type: 'parallel',
    context: {
        remainingFulfillmentIntervals: 0,
        paused: false,
        fulfillmentOffset:0
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
                        END_CYCLE: { target: 'pending', cond: subscriptionInvalid },
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
                        INITIATED: { target: 'initiated', cond:subscriptionNotPaused}
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
                        RESET_CYCLE: {
                            target: 'pending',
                            cond: subscriptionValid
                        },
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
    }
})

export const stateManager = async (subscriptionId:number, event:SubscriptionEvent , params:any = {}) => {
    console.log(subscriptionId,event,params)
    const storedState:[subscriptionStateRecord] = await SubscriptionState.query().where('subscription_id',subscriptionId)
    
    var lastState:subscriptionStateRecord
    storedState.map((state:subscriptionStateRecord) => {
        if (!lastState){
            lastState = state
        }else{
            if (lastState.id < state.id) {
                lastState = state
            }
        }
    })

    if (lastState){

        const stateDefinition:State<context,SubscriptionEvent> = lastState.state

        // Use State.create() to restore state from a plain object
        const previousState = State.create(stateDefinition);

        // Use machine.resolveState() to resolve the state definition to a new State instance relative to the machine
        const resolvedState = machine.resolveState(previousState);

        // Start the service
        var service = interpret(machine).start(resolvedState);
        
    }else {
        service = interpret(machine).start();
    }

    //any -> schema

    service.onTransition(async (_state: any) => {
        
        _state.matches(EventTypes.success)
     
        console.log(_state.changed)
        if (_state.changed){
            
            
            const knex = SubscriptionState.knex();
            
            
            try {
                
                var options:Array<string>
                if (_state.matches({ fulfillment:States.ineligible})) {
                    options = (machine.states.fulfillment.states.ineligible.events)
                }else if (_state.matches({ fulfillment: States.pending})){
                    options = (machine.states.fulfillment.states.pending.events)
                }else if (_state.matches({ fulfillment:States.initiated})){
                    options = (machine.states.fulfillment.states.initiated.events)
                }else if (_state.matches({ fulfillment:States.shipped})){
                    options = (machine.states.fulfillment.states.shipped.events)
                }else if (_state.matches({ fulfillment:States.successful})){
                    options = (machine.states.fulfillment.states.successful.events) //change this
                }else if (_state.matches({ fulfillment:States.failure})){
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
                    
                    //add successful state table, validate it with ts and defaults later on
                    
                    if (_state.matches({ fulfillment:States.successful})) {
                    
                        if (_state.context) {
                            var fulfillmentCycleOffset = moment(Date.now()).add(_state.context.fulfillmentOffset, 'days').format();
                            // console.log('offset', params.fulfillmentCycleOffset)
                            
                            const fulfilledState = await newState
                            .$relatedQuery('fulfilledState',trx)
                            .insert({
                                'subscription_id': subscriptionId, 
                                'next_cycle':fulfillmentCycleOffset
                            });
                            return fulfilledState;
                        }
                    }
                    return newState;
                });

                
            } catch (err) {
                console.log(err, 'Something went wrong. State not inserted');
            }
        }
    });

    // Send events
    let _subscriptionEvent = event.type
    console.log(_subscriptionEvent)
    service.send(_subscriptionEvent,params);

    // Stop the service when you are no longer using it.
    service.stop();

}
