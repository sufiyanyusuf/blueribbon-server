import express = require('express');
const BusinessInfoRouter = express.Router();

const Organization = require('../db/models/organization');

BusinessInfoRouter.route('/').get(async function (req:any, res:express.Response) {
    try {
        const organization = await Organization
            .query()
            .findById(req.user.orgId)
        res.status(200).json(organization) 
    } catch (e) {
        res.status(400).json(e)
    }
})

//send notifications

module.exports = BusinessInfoRouter;