import express = require('express');
const SubscriptionManagementRouter = express.Router();
import { stateManager, EventTypes, SubscriptionEvent } from './utils/SubscriptionStateManager'

SubscriptionManagementRouter.route('/pauseSubscription').post(async function (req: express.Request, res: express.Response) {
    const subscriptionId = req.body.subscriptionId
    const pauseEvent: SubscriptionEvent = { type: EventTypes.pause }
    try { 
        const paused: boolean = await stateManager(subscriptionId, pauseEvent, {})
        console.log('got paused - ',paused)
        res.status(200).json(paused)
        
    } catch (e) {
        res.status(404).json('failed')
    }
})

SubscriptionManagementRouter.route('/resumeSubscription').post(async function (req:express.Request, res:express.Response) {
    const subscriptionId = req.body.subscriptionId
    const pauseEvent: SubscriptionEvent = { type: EventTypes.resume }
    try { 
        const resumed:boolean = await stateManager(subscriptionId, pauseEvent, {})
        res.status(200).json('done') // add value check for json true/false
        
    } catch (e) {
        res.status(404).json('failed')
    }
})

SubscriptionManagementRouter.route('/renewSubscription').post(async function (req:express.Request, res:express.Response) {

})

SubscriptionManagementRouter.route('/cancelSubscription').post(async function (req:express.Request, res:express.Response) {

})


module.exports = SubscriptionManagementRouter;