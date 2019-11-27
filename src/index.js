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
const subscriptionRoute = require('./SubscriptionsRoute')
const schedulerRoute = require('./SchedulerRoute')
const axios = require('axios');
const SubscriptionValueResolver = require('./utils/QuantityResolver')
const FreqResolver = require('./utils/FrequencyResolver')
const subscriptionStateManager = require('./utils/SubscriptionStateManager')
const defaults = require('./utils/Defaults')
const SubscriptionTrigger = require('./utils/SubscriptionTriggers')

var jwt = require('express-jwt');
var jwks = require('jwks-rsa');

var jwtCheck = jwt({
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
        jwksUri: 'https://blue-ribbon.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://blueribbon.io/api/organization/user',
  issuer: 'https://blue-ribbon.auth0.com/',
  algorithms: ['RS256']
});


// app.use(jwtCheck);


app.use(responseTime(function (req, res, time) {
console.log(time)
}))

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use ('/api/listing',listingRoute);
app.use ('/api/serviceLocations',serviceLocationRoute);
app.use ('/api/payment',jwtCheck,paymentRoute);
app.use ('/api/modifier',modifierRoute);
app.use ('/api/upload',uploadRoute);
app.use ('/api/subscriptions',jwtCheck,subscriptionRoute)
app.use ('/orderManagement',orderRoute)
app.use ('/api/user', jwtCheck, userRoute);
app.use ('/scheduler',schedulerRoute)

app.get('/api/productInfo/:id', (req, res) => {
    let id = parseInt(req.params.id)
    productInfo.query()
        .where('listing_id', id)
        .then(prod => {
            res.json(prod[0])
        })
})

app.get('/api/organizations', (req, res) => {
    Organization.query()
        .then(organizations => {
            res.json(organizations)
        })
})

app.get('/api/listing', (req, res) => {
    Listing.query()
        .then(listings => {
            res.json(listings)
        })
})

app.get('/api/organizations/listing/:id', async (req, res) => {
    let id = parseInt(req.params.id)
    Organization.query()
        .where('id', id)
        .eager('listings')
        .then(org => {
            res.json(org)
        })
})

app.get('/api/search/serviceAreas/:query', async (req, res) => {

    let keywords = req.params.query;
  
    var areas= serviceLocations.filter(function(item){

        // var name0 = item.properties.NAME_0; //load json for country
        var name1 = item.properties.NAME_1; //city
        var name3 = item.properties.NAME_3; //area
        if ((name3 && name3.toLowerCase().includes(keywords.toLowerCase()))
            ||(name1 && name1.toLowerCase().includes(keywords.toLowerCase()))
        ){
            return item
        }         
    });

    const polygons = areas.map((area)=>{
        return area.geometry.coordinates[0][0]
    })

    var gPolygonArray = polygons.map (coordinateSet => {
        return coordinateSet.map(coordinate => {
            return {lat:coordinate[1],lng:coordinate[0]}
        })
    })

    const formattedArray = areas.map((area,index) => {
        var label = ''
       
        if (area.properties.NAME_3){
            label = area.properties.NAME_3
        }else if (area.properties.NAME_2){
            label = area.properties.NAME_2
        }else{
            label = area.properties.NAME_1
        }

        return {
            label:label,
            value:area.id,
            key:area.id,
            data_id:area.id,
            polygon:gPolygonArray[index],    
        }
    })
    res.json ({areas:formattedArray});
    // res.json(areas);
})

app.get('/api/test',async (req, res) => {
  
    try{
      const purchases = await Purchase
      .query()
      .eager('[subscription]')
    
      res.status(200).json(purchases)

    }catch(e){
      res.status(404)
    }
  });

app.get('/api/pubsub/local',async (req, res) => {
    //add auth middleware to this later on
    console.log('subscription check req received on localhost');
    SubscriptionTrigger.checkCycle()
    //move this trigger to proper api and update pubsub
    res.status(200).json('ok')
});

app.post('/api/pubsub',async (req, res) => {
    //add auth middleware to this later on
console.log('subscription check req received');
axios.get('https://3458a3ef.ngrok.io/api/pubsub/local')
res.status(204).json('done');

});

app.listen(port, function () {
    console.log('Example app listening on port !', port);
    // SubscriptionValueResolver.resolve()
    // FreqResolver.resolveOffset({ unit: defaults.Units.frequency.perWeek,value:1 })
    // subscriptionStateManager();
    // updateSubscriptionCycles.check()
});