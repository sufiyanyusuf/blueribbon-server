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


const getOrderInfoFromDb = async (orderState) => {

    return new Promise (async (resolve, reject) => {

        try {

            
            
        }
        catch(e){
            reject(e)
        }

    })
   
}




OrderManagementRouter.route('/getActiveOrders').get(async function (req, res) {

})

OrderManagementRouter.route('/getPendingOrders/:id').get(async function (req, res) {
    //get all org subscriptions
    //get current subscriptionstates
    //if pending, add
    try{

        const organizationId = parseInt(req.params.id)
        const storedStates = await SubscriptionState.query() //query by org id later
        const idList = getSubscriptionIdList(storedStates)
        const currentSubscriptionStatesById = idList.map(id => {
            const states = getSubscriptionStatesForId(storedStates,id)
            return getCurrentStateforSubscription(states)
        })
        const pendingOrderStates = currentSubscriptionStatesById.map(state => {
            if (state.fulfillment_state == 'pending'){
                const result = {
                    'timestamp':state.timestamp,
                    'fulfillment_state':state.fulfillment_state,
                    'actions':state.fulfillment_options,
                    'subscription_id':state.subscription_id
                }
                return result
            }
        })


        const pendingOrders = await Promise.all(pendingOrderStates.map(async orderState => {

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

        res.status(200).json(pendingOrders)

    }catch(e){
        res.status(500).json(e)
    }

})

OrderManagementRouter.route('/updateState').put(async function (req, res) {

})

//send notifications

module.exports = OrderManagementRouter;