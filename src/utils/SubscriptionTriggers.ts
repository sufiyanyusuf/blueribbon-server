
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
    // console.log(dueFulfilledStates)
    let resetStatuses = await Promise.all(
        dueFulfilledStates.map(async (state: fulfillmentState) => {
            try { 
                let resetCycleEvent:SubscriptionEvent = {type:EventTypes.resetCycle}
                let resetStatus = await stateManager(state.subscription_id, resetCycleEvent)
                return resetStatus
            } catch (e) {
                console.log(e)
                return e
            }
        })
    ) 

    let endStatuses = await Promise.all(
        dueFulfilledStates.map(async (state: fulfillmentState) => {
            try { 
                let endCycleEvent:SubscriptionEvent = {type:EventTypes.endCycle}
                let endStatus = await stateManager(state.subscription_id, endCycleEvent)
                return endStatus
            }catch(e){
                console.log(e)
                return e
            }
        })
    )

    console.log('resets - ',resetStatuses, ' ends - ',endStatuses)

}
    



