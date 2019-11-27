const express = require('express');
const SchedulerRouter = express.Router();
const { SubscriptionStateTriggers } = require('./utils/SubscriptionTriggers')

SchedulerRouter.route('/scheduler').post(async function (req, res) {
    SubscriptionStateTriggers.checkCycle()
})

//send notifications

module.exports = SchedulerRouter;