var express = require('express');
var port = process.env.PORT || 4000;
var cors = require('cors');
var serviceLocations = require('./assets/serviceLocations_uae');
var app = express();
var responseTime = require('response-time')
require('dotenv').config();
const bodyParser = require('body-parser');

const Organization = require('../db/models/organization')
const Listing = require('../db/models/listing')
const productInfo = require('../db/models/productInfo')
const Purchase = require('../db/models/purchase')

const listingRoute = require('./Listing/listingRoute')
const modifierRoute = require('./Listing/modifierRoute')
const serviceLocationRoute = require('./Listing/serviceLocationRoute')
const uploadRoute = require('./Listing/uploadRoute')
const paymentRoute = require('./PaymentRoute')
const userRoute = require('./userRoute')
const orderRoute = require('./OrderManagementRoute')
const marketplaceRoute = require('./MarketplaceRoute')
const subscriptionRoute = require('./SubscriptionsRoute')
const schedulerRoute = require('./SchedulerRoute')
const businessInfoRoute = require('./BusinessInfoRoute')
const subscriptionManagementRoute = require ('./SubscriptionManagementRoute')
const axios = require('axios');
const SubscriptionValueResolver = require('./utils/QuantityResolver')
const FreqResolver = require('./utils/FrequencyResolver')
const subscriptionStateManager = require('./utils/SubscriptionStateManager')
const defaults = require('./utils/Defaults')
const SubscriptionTrigger = require('./utils/SubscriptionTriggers')
const { test } = require('./Notifications')

const { addOrgId } = require('./Middleware/AddOrgId')

var jwt = require('express-jwt');
var jwks = require('jwks-rsa');
var jwtAuthz = require('express-jwt-authz');

var consumerJwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://blue-ribbon.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://blueribbon.io/api/user',
  issuer: 'https://blue-ribbon.auth0.com/',
  algorithms: ['RS256']
});

var orgJwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://blue-ribbon-dashboard.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://api.blueribbon.io/business/',
  issuer: 'https://blue-ribbon-dashboard.auth0.com/',
  algorithms: ['RS256']
});

app.use(responseTime(function (req, res, time) {
console.log(time)
}))


app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use ('/api/payment',consumerJwtCheck,paymentRoute);
app.use ('/api/subscriptions',consumerJwtCheck,subscriptionRoute)
app.use ('/api/user', consumerJwtCheck, userRoute);
app.use ('/subscriptionManagment', consumerJwtCheck, subscriptionManagementRoute);
app.use ('/marketplace', consumerJwtCheck, marketplaceRoute);

app.use ('/business/orderManagement',orgJwtCheck,addOrgId,orderRoute)
app.use ('/scheduler',schedulerRoute)
app.use ('/business/modifier',orgJwtCheck,addOrgId,modifierRoute);
app.use ('/business/upload',orgJwtCheck,addOrgId,uploadRoute);
app.use ('/business/serviceLocations',orgJwtCheck,addOrgId,serviceLocationRoute);
app.use ('/business/listing', orgJwtCheck, addOrgId, listingRoute);
app.use ('/business/info',orgJwtCheck,addOrgId,businessInfoRoute);


app.get('/api/pubsub/local',async (req, res) => {
    //add auth middleware to this later on
    console.log('subscription check req received on localhost');
    // SubscriptionTrigger.checkCycle()
    //move this trigger to proper api and update pubsub
    res.status(200).json('ok')
});

app.post('/api/pubsub',async (req, res) => {
    //add auth middleware to this later on
console.log('subscription check req received');
axios.get('https://4f2d1a09.ngrok.io/api/pubsub/local')
res.status(204).json('done');

});

app.listen(port, function () {
    console.log('Blueribbon, to infinity & beyond !!!');
    // SubscriptionTrigger.checkCycle()
    // test()
    // sendNotification()
    // SubscriptionValueResolver.resolve()
    // FreqResolver.resolveOffset({ unit: defaults.Units.frequency.perWeek,value:1 })
    // subscriptionStateManager();
    // updateSubscriptionCycles.check()
});