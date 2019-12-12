import express from 'express';
import { stateManager, EventTypes, SubscriptionEvent } from './utils/SubscriptionStateManager'
const OrderManagementRouter = express.Router();
const SubscriptionState = require('../db/models/subscriptionState')
const Subscription = require('../db/models/subscription')
const Purchase = require('../db/models/purchase')
const Listing = require('../db/models/listing')

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
        
        //for testing
        case EventTypes.resetCycle:
            return { type: EventTypes.resetCycle }
            break
        case EventTypes.endCycle:
            return { type: EventTypes.endCycle }
            break
        default:
            return null
    }

}


OrderManagementRouter.route('/getActiveOrders').get(async function (req:express.Request, res:express.Response) {
})

OrderManagementRouter.route('/getOrders').get(async function (req:any, res:express.Response) {
    try{

        const orderState = req.params.orderState
        const orgId = req.user.orgId

        
        let listings = await Listing
            .query()
            .where('organization_id', orgId)
            .eager('[subscription.[currentState,purchase]]')
        
        let _listings = listings.filter((listing: any) => Object.keys(listing).length !== 0)
        
        let subscriptions = _listings.map((listing: any) => { return listing.subscription })
        let _subscriptions = subscriptions.filter((subscription: any) => Object.keys(subscription).length !== 0)[0]

        let subscriptionStates:Array<subscriptionState> = _subscriptions.map((subscription: any) => { return subscription.currentState })
        
        let purchases = _subscriptions.map((subscription: any) => { return subscription.purchase })//order by timestamp
        let _purchases = purchases.filter((purchase: any) => Object.keys(purchase).length !== 0)

        let orders = subscriptionStates.map((subscriptionState: any, index: any) => {
            let subscription = _subscriptions[index]
            let purchase = _purchases[index]
            let _purchase = purchase[purchase.length - 1]
            let order = {
                ...subscriptionState,
                'title':subscription.title,
                'customer':subscription.user_id,
                'order': _purchase.order_details,
                'address':_purchase.delivery_address
            }
            return order
        })

        res.status(200).json(orders)

    } catch (e) {
        res.status(400).json(e)
    }

})

OrderManagementRouter.route('/updateFulfillmentState').post(async function (req:express.Request, res:express.Response) {
    
    console.log(req.body.action)

    const subscriptionId:number = req.body.subscriptionId;
    const action: string = req.body.action; 
  
    let subscriptionEvent = getFulfillmentEventType(action)
    console.log(subscriptionEvent)

    if (!subscriptionEvent) {
        res.status(400).json('not allowed')
    } else {
        try { 
            const updated = await stateManager(subscriptionId, subscriptionEvent);
            res.status(200).json(updated)
        } catch (e) {
            res.status(404).json(e)
        }
    }
    
})

//send notifications

module.exports = OrderManagementRouter;