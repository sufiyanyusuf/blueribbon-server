var express = require('express');
var port = process.env.PORT || 4000;
var cors = require('cors');
var serviceLocations = require('./assets/serviceLocations_uae');
var app = express();
var responseTime = require('response-time')

const router = express.Router();
const bodyParser = require('body-parser');

const Organization = require('../db/models/organization')
const Listing = require('../db/models/listing')
const productInfo = require('../db/models/productInfo')

const listingRoute = require('./Listing/listingRoute')
const modifierRoute = require('./Listing/modifierRoute')

var corsOptions = {
	// origin: 'https://blue-ribbon-dashboard.herokuapp.com',
	origin: 'http://localhost:4000',
	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

  app.use(responseTime(function (req, res, time) {
    console.log(time)
  }))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use ('/api/listing',cors(corsOptions),listingRoute);
app.use ('/api/modifier',cors(corsOptions),modifierRoute);

app.get('/api/productInfo/:id', cors(corsOptions), (req, res) => {
    let id = parseInt(req.params.id)
    productInfo.query()
        .where('listing_id', id)
        .then(prod => {
            res.json(prod[0])
        })
})

app.get('/api/organizations', cors(corsOptions), (req, res) => {
    Organization.query()
        .then(organizations => {
            res.json(organizations)
        })
})

app.get('/api/listing', cors(corsOptions), (req, res) => {
    Listing.query()
        .then(listings => {
            res.json(listings)
        })
})

app.get('/api/organizations/listing/:id', cors(corsOptions), (req, res) => {
    let id = parseInt(req.params.id)
    Organization.query()
        .where('id', id)
        .eager('listings')
        .then(org => {
            res.json(org)
        })
})

app.get('/api/search/serviceAreas/:query', cors(corsOptions), (req, res) => {

    let keywords = req.params.query;
    console.log(keywords);

    var filtered=serviceLocations.filter(function(item){

        // var name0 = item.properties.NAME_0; //load json for country
        var name1 = item.properties.NAME_1;
        var name3 = item.properties.NAME_3;
        if ((name3 && name3.toLowerCase().includes(keywords.toLowerCase()))
            ||(name1 && name1.toLowerCase().includes(keywords.toLowerCase()))
        ){
            return item
        }         
    });

    res.json(filtered);
})


app.get('/', function (req, res) {
	console.log(req,res);
 res.send(JSON.stringify({ Hello: 'World'}));
});

app.listen(port, function () {
 console.log('Example app listening on port !',port);
});