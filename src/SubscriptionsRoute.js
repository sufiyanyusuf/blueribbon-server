const express = require('express');
const SubscriptionsRouter = express.Router();

const Subscription = require ('../db/models/subscription')
const SubscriptionStates = require ('../db/models/subscriptionState')


const getFulfillmentStates = async (subscriptions) => {
    
    let updatedSubs = await Promise.all(subscriptions.map(async (subscription) => {
        try {
            const currentState = subscription.states.reduce(function(prev, current) {
                return (prev.id > current.id) ? prev : current
            })
            delete subscription.states
            return (Object.assign(subscription, { currentState: currentState.subscription_state, fulfillmentState: currentState.fulfillment_state}))
        } catch (e) {
            return(null)
        }
    }))

    let filteredSubs = updatedSubs.filter(sub => sub !== null)
    return filteredSubs
}

const getCurrentOrderStatuses = async (subscriptions) => {
    
    let updatedSubs = await Promise.all(subscriptions.map(async (subscription) => {
        try {
            const currentState = subscription.states.reduce(function(prev, current) {
                return (prev.id > current.id) ? prev : current
            })
            delete subscription.states
            return (Object.assign(subscription, { currentState: currentState.subscription_state, fulfillmentState: currentState.fulfillment_state}))
        } catch (e) {
            return(null)
        }
    }))

    let filteredSubs = updatedSubs.filter(sub => sub !== null)
    return filteredSubs
}

const getOrderStatusMessage = (status, brand) => {
   
    var message = ""
    
    switch (status) {
        case 'pending':
            message = brand + " is about to start working on your order. We'll keep you updated."
            return message
            
        case 'initiated':
            message = brand + " is working on your order. You should receive it soon."
            return message
            
        case 'shipped':
            message = "Your order from " + brand + " is out for delivery."
            return message
            
        case 'failure':
            message = "Your order from " + brand + " could not be delivered."
            return message
            
        case 'successful':
            message = "Your order from " + brand + " has been delivered."
            return message
    }
    return message
}

SubscriptionsRouter.route('/').get(async (req, res) => {

    const userId = req.user.sub
  
    try {
        const subscriptions = await Subscription
            .query()
            .where('user_id', userId)
            .where('is_active', true)
            .eager('currentState')
        
        res.status(200).json(subscriptions)

    } catch (e) {
        console.log(e)
        res.status(400).json(e) 
    }

})

SubscriptionsRouter.route('/orders').get(async (req, res) => {

    const userId = req.user.sub
  
    try {
        const subscriptions = await Subscription
            .query()
            .where('user_id', userId)
            .where('is_active', true)
            .eager('currentState')
        
        const statuses = subscriptions.map(subscription => {
            let fulfillmentState = subscription.currentState.fulfillment_state
            let brandName = subscription.brand_name
            let message = getOrderStatusMessage(fulfillmentState, brandName)

            const options = {month: 'short', day: 'numeric'};
            const date  = new Date(subscription.currentState.timestamp);
            const formattedDate = date.toLocaleString("en-US", options);

            return {
                id:subscription.id,
                status:fulfillmentState,
                date:formattedDate,
                message:message
            }
        })

        _statuses = statuses.sort(function(a, b) {
            return a.id-b.id;
        });
        
        res.status(200).json(_statuses)

    } catch (e) {
        console.log(e)
        res.status(400).json(e) 
    }

})

module.exports = SubscriptionsRouter

