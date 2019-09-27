var express = require('express');
var port = process.env.PORT || 4000;
var cors = require('cors');
var app = express();

const router = express.Router();
const bodyParser = require('body-parser');

const Organization = require('../db/models/organization')
const Listing = require('../db/models/listing')
const productInfo = require('../db/models/productInfo')

const listingRoute = require('./Listing/listingRoute')
const modifierRoute = require('./Listing/modifierRoute')

app.use(cors({
	origin: 'https:blue-ribbon-dashboard.herokuapp.com'
  }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use ('/api/listing',listingRoute);
app.use ('/api/modifier',modifierRoute);

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

app.get('/api/organizations/listing/:id', (req, res) => {
    let id = parseInt(req.params.id)
    Organization.query()
        .where('id', id)
        .eager('listings')
        .then(org => {
            res.json(org)
        })
})


app.get('/', function (req, res) {
	console.log(req,res);
 res.send(JSON.stringify({ Hello: 'World'}));
});

app.listen(port, function () {
 console.log('Example app listening on port !',port);
});