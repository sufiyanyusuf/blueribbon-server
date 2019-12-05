import { transaction } from 'objection'
import { State, Machine, actions, send, interpret, Action, MachineConfig, matchesState } from 'xstate'
import { Transaction } from 'knex';
import { stateValuesEqual } from 'xstate/lib/State';
import { notifySubscriber, NotificationEvent, NotificationTypes } from './../Notifications';
const SubscriptionState = require('../../db/models/subscriptionState')
const UserSubscription = require('../../db/models/subscription')
const FulfilledStates = require('../../db/models/fulfilledStates')
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

const deductSubscriptionValue = actions.assign<context, SubscriptionEvent>({
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

export const stateManager = async (subscriptionId: number, event: SubscriptionEvent, params: any = {}):Promise<boolean> => {
    
    return new Promise<boolean>(async (resolve, reject) => { 
    
        // console.log(subscriptionId, event, params)
        
        const storedState:[subscriptionStateRecord] = await SubscriptionState.query().where('subscription_id',subscriptionId)
        const subscription = await UserSubscription.query().findById(subscriptionId)
        
        var lastState: subscriptionStateRecord
        lastState = await subscription.$relatedQuery('currentState')   
        // console.log(lastState)
        // if (!lastState) {
        //     storedState.map((state:subscriptionStateRecord) => {
        //         if (!lastState){
        //             lastState = state
        //         }else{
        //             if (lastState.id < state.id) {
        //                 lastState = state
        //             }
        //         }
        //     })
        // }

        let service = interpret(machine);

        service.onTransition(async (state) => {
  
            // console.log(state.changed)

            if (state.changed === false){
                reject('no change')
            } 

            if (state.changed === true) {
                let _state = <any> state
                const knex = SubscriptionState.knex();
                
                try {

                    // send notifications where applicable (move this elsewhere )
    
                    if (event.type == EventTypes.resetCycle){
                        clearFulfilledState(subscriptionId)
                    }
                    if (event.type == EventTypes.endCycle) {
                        clearFulfilledState(subscriptionId)
                        // avoid multiple calls
                        if (_state.matches({ subscription:States.inactive })) {
                            let notificationEvent: NotificationEvent = {
                                type:NotificationTypes.subscriptionExpired,
                                subscriptionId:subscriptionId
                            }
                            notifySubscriber(notificationEvent) 
                        }
                    }
                    if (event.type == EventTypes.shipped) {
                        //
                        let notificationEvent: NotificationEvent = {
                            type:NotificationTypes.itemShipped,
                            subscriptionId:subscriptionId
                        }
                        notifySubscriber(notificationEvent)
                    }
                    if (event.type == EventTypes.failure) {
                        //
                    }
                    if (event.type == EventTypes.success) {
                        //
                    }
                    if (event.type == EventTypes.paymentDeclined) {
                        let notificationEvent: NotificationEvent = {
                            type:NotificationTypes.paymentDeclined,
                            subscriptionId:subscriptionId
                        }
                        notifySubscriber(notificationEvent)
                    }
                    if (event.type == EventTypes.paymentSuccess) {
                        //
                    }
                    
                    // get possible fulfillment options for the state
    
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
                    
                    // write state to db        
                    const writtenState = await transaction(knex, async (trx) => {
    
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

                        var isActive = !(_state.value.subscription == States.inactive)
                        

                        const updatedUserSubscription = await UserSubscription
                            .query(trx)
                            .findById(subscriptionId)
                            .patch({
                                'current_state': newState.id,
                                'is_active':isActive
                             });

                        if (_state.matches({ fulfillment:States.successful})) {
                        
                            if (_state.context) {

                                var fulfillmentCycleOffset = moment(Date.now()).add(_state.context.fulfillmentOffset, 'days').format();
                                const fulfilledStatesRecord = await FulfilledStates.query().where('subscription_id',newState.subscription_id)
                               
                                // check if exists in fulfilled_states table
                                if (fulfilledStatesRecord) {
                                    if (fulfilledStatesRecord.length == 0) {

                                        const fulfilledState = await newState
                                        .$relatedQuery('fulfilledState', trx)
                                        .insert({
                                            'subscription_id': subscriptionId, 
                                            'next_cycle':fulfillmentCycleOffset
                                        })

                                        return fulfilledState;

                                    } 
                                }

                            }
                        }
                        return newState;
                    });

                    if (writtenState) {
                        resolve(true)
                    } else {
                        console.log('no written state ?')
                        resolve(false)
                    }
    
                    
                } catch (err) {
                    //reject promise
                    console.log(err, 'Something went wrong. State not inserted');
                    reject(err)
                }
            }
           

        })
       
        // Start the service
        if (lastState){
            // console.log(lastState)
            const stateDefinition:State<context,SubscriptionEvent> = lastState.state

            // Use State.create() to restore state from a plain object
            const previousState = State.create(stateDefinition);

            // Use machine.resolveState() to resolve the state definition to a new State instance relative to the machine
            const resolvedState = machine.resolveState(previousState);

            // Start the service
            service.start(resolvedState);
            
        } else {
            console.log('no history')
            service.start();
        }

        // Send events
        let _subscriptionEvent = event.type
        service.send(_subscriptionEvent,params);

        // Stop the service when you are no longer using it.
        service.stop();
        
    })

}


const clearFulfilledState = async (subscriptionId: number) => {
    const removedState = await FulfilledStates.query().delete().where('subscription_id',subscriptionId)
}
