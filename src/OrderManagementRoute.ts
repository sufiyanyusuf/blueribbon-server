import express from 'express';
import { stateManager, EventTypes, SubscriptionEvent } from './utils/SubscriptionStateManager'
import {$enum} from "ts-enum-util";
import { type } from 'os';
const OrderManagementRouter = express.Router();
const SubscriptionState = require('../db/models/subscriptionState')
const Subscription = require('../db/models/subscription')


interface subscriptionState {
    id:number,
    subscription_id: number, 
    state: any, 
    subscription_state:string 
    payment_state:string, 
    fulfillment_state:string,
    fulfillment_options: string,
    timestamp:string
}

const getCurrentStateforSubscription = (subscriptionStates:Array<subscriptionState>) => {
    // console.log(subscriptionStates)
    var currentState:subscriptionState;
    subscriptionStates.map(state => {
        if (!currentState){
            currentState = state
        }else{
            if (currentState.id < state.id) {
                currentState = state
            }
        }
    })
    return currentState;
}

const getSubscriptionStatesForId = (subscriptions:Array<subscriptionState>, id:number) => {
    const states = subscriptions.filter((state) => {
        if (state.subscription_id == id) {
            return state
        }
    })
    return states
}

const getSubscriptionIdList = (states:Array<subscriptionState>) => {
    var idList:Array<number>=[];
    states.map((state)=>{
        if (!(idList.includes(state.subscription_id))){
            idList.push(state.subscription_id)
        }
    })
    return idList;
}

const getFulfillmentEventType = (action: string): SubscriptionEvent => {
    
    switch (action) {
        case EventTypes.initiated:
            return { type: EventTypes.initiated }
            break
        case EventTypes.shipped:
            return { type: EventTypes.shipped }
            break
        case EventTypes.failure:
            return { type: EventTypes.failure }
            break
        case EventTypes.success:
            return { type: EventTypes.success }
            break
        default:
            return null
    }

}


OrderManagementRouter.route('/getActiveOrders').get(async function (req:express.Request, res:express.Response) {
})

OrderManagementRouter.route('/getOrders/:orderState').get(async function (req:express.Request, res:express.Response) {
    try{

        const orderState = req.params.orderState
        console.log(orderState)
        const storedStates = await SubscriptionState.query() //query by org id later

        const idList = getSubscriptionIdList(storedStates)

        const currentSubscriptionStatesById = idList.map(id => {
            const states = getSubscriptionStatesForId(storedStates,id)
            return getCurrentStateforSubscription(states)
        })
        
        const matchingOrderStates = currentSubscriptionStatesById.filter(state => {
            if (state.fulfillment_state == orderState){
                const result = {
                    'timestamp':state.timestamp,
                    'fulfillment_state':state.fulfillment_state,
                    'actions':state.fulfillment_options,
                    'subscription_id':state.subscription_id
                }
                return result
            }
        })

        if (matchingOrderStates.length>0){

            const orders = await Promise.all(matchingOrderStates.map(async (orderState:any) => {
    
                try {
    
                    const subscription = await Subscription
                    .query()
                    .findById(orderState.subscription_id)
                    .eager('purchase')
                  
                    const order = {
                        ...orderState,
                        'title':subscription.title,
                        'customer':subscription.user_id,
                        'order':subscription.purchase.order_details
                    }
    
                    return order
    
                }
                catch(e){
                    return (e)
                }
            }));
    
            res.status(200).json(orders)
        }else{
            res.status(204).json({})
        }

    }catch(e){
        res.status(500).json(e)
    }

})

OrderManagementRouter.route('/updateFulfillmentState').post(async function (req, res) {
    const subscriptionId:number = req.body.subscriptionId;
    const action: string = req.body.action; 
   
    let subscriptionEvent = getFulfillmentEventType (action)
    
    if (!subscriptionEvent) {
        res.status(400).json('not allowed')
    } else {
        stateManager(subscriptionId,subscriptionEvent);
    }
    
})

//send notifications

module.exports = OrderManagementRouter;