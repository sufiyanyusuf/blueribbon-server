const express = require('express');
const SubscriptionManagementRouter = express.Router();
const StateManager = require('./utils/SubscriptionStateManager')

SubscriptionManagementRouter.route('/pauseSubscription').put(async function (req, res) {

})

SubscriptionManagementRouter.route('/resumeSubscription').put(async function (req, res) {

})

SubscriptionManagementRouter.route('/resumeSubscription').put(async function (req, res) {

})

SubscriptionManagementRouter.route('/chargePayment').put(async function (req, res) {

})

//update states
//send notifications

module.exports = SubscriptionManagementRouter;