const express = require('express');
const SubscriptionsRouter = express.Router();

const Subscription = require ('../db/models/subscription')

SubscriptionsRouter.route('/').get(async (req, res) => {
    const userId = req.user.sub
    Subscription.query().where('user_id',userId).then(subsriptions => {
        res.status(200).json(subsriptions)
    }).catch(e=>{
        res.status(400).json(e)
    })
    
})


module.exports = SubscriptionsRouter

