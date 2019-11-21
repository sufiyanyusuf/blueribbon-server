

// update state table based on events

// const { transaction } = require('objection');
// import { Machine, send, interpret } from 'xstate';



const subscriptionValid = (context, event) => {

    return context.remainingFulfillmentIntervals > 1 && !context.paused;
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
    return context.remainingFulfillmentIntervals <= 1 && !context.paused;
}


const deductSubscriptionValue = assign({
    remainingFulfillmentIntervals: (context, event) => context.remainingFulfillmentIntervals - 1
});

const incrementSubscriptionValue = assign({
    remainingFulfillmentIntervals: (context, event) => context.remainingFulfillmentIntervals + 2
});

const stateMachine = Machine({

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
                    exit:deductSubscriptionValue,
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



// const stateManager = () => {
  


// }

// module.exports = stateManager;