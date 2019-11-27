
const FulfilledStates = require('../../db/models/fulfilledStates')
const moment = require('moment')
import { stateManager, EventTypes, SubscriptionEvent } from './SubscriptionStateManager'
import {resolveOffset} from './FrequencyResolver'


    interface fulfillmentState {
        id: number,
        subscription_id: number,
        next_cycle:string
    }
    
    export const checkCycle = async () => {
        var currentTimestamp = moment(Date.now()).format();
        const dueFulfilledStates = await FulfilledStates.query().whereRaw('next_cycle < ?', [currentTimestamp]) 
       
        dueFulfilledStates.map((state: fulfillmentState) => {

            let resetCycleEvent:SubscriptionEvent = {type:EventTypes.resetCycle}
            stateManager(state.subscription_id, resetCycleEvent)

            let endCycleEvent:SubscriptionEvent = {type:EventTypes.endCycle}
            stateManager(state.subscription_id, endCycleEvent)
           
            //remove record from fulfilled state
        })

        //add handling to remove record from this table in state machine logic
    }
    



