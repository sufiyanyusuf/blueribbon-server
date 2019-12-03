const express = require('express');
const SubscriptionsRouter = express.Router();

const Subscription = require ('../db/models/subscription')


const getCurrentStates = async (subscriptions) => {
    
    let updatedSubs = await Promise.all(subscriptions.map(async (subscription) => {
        try {
            const currentState = subscription.states.reduce(function(prev, current) {
                return (prev.id > current.id) ? prev : current
            })
            delete subscription.states
            return (Object.assign(subscription, { currentState: currentState.subscription_state }))
        } catch (e) {
            return(null)
        }
    }))

    let filteredSubs = updatedSubs.filter(sub => sub !== null)
    return filteredSubs
}



SubscriptionsRouter.route('/').get(async (req, res) => {

    const userId = req.user.sub

    try {
        const subscriptions = await Subscription
            .query()
            .where('user_id', userId)
            .eager('states')
        
        const updatedSubscriptions = await getCurrentStates(subscriptions) 
        res.status(200).json(updatedSubscriptions)

    } catch (e) {
        res.status(400).json(e) 
    }

    // Subscription.query().where('user_id',userId).then(subsriptions => {
    //     res.status(200).json(subsriptions)
    // }).catch(e=>{
    //     res.status(400).json(e)
    // })
    
})


module.exports = SubscriptionsRouter

