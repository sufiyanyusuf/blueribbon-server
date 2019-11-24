const express = require('express');
const OrderManagementRouter = express.Router();
const StateManager = require('./utils/SubscriptionStateManager')
const SubscriptionState = require('../db/models/subscriptionState')
const Subscription = require('../db/models/subscription')


const getCurrentStateforSubscription = (subscriptionStates) => {
    // console.log(subscriptionStates)
    var currentState;
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

const getSubscriptionStatesForId = (subscription, id) => {
    const states = subscription.filter((state) => {
        if (state.subscription_id == id) {
            return state
        }
    })
    return states
}

const getSubscriptionIdList = (states) => {
    var idList=[];
    states.map((state)=>{
        if (!(idList.includes(state.subscription_id))){
            idList.push(state.subscription_id)
        }
    })
    return idList;
}


OrderManagementRouter.route('/getActiveOrders').get(async function (req, res) {
})

OrderManagementRouter.route('/getOrders/:orderState').get(async function (req, res) {
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

            const orders = await Promise.all(matchingOrderStates.map(async orderState => {
    
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
    const subscriptionId = req.body.subscriptionId;
    const action = req.body.action;

    StateManager(subscriptionId,action);
})

//send notifications

module.exports = OrderManagementRouter;