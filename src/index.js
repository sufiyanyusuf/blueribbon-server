var express = require('express');
var port = process.env.PORT || 3000;
var app = express();
const router = express.Router()

const Organization = require('../db/models/organization')
const Listing = require('../db/models/listing')

app.get('/organizations', (req, res) => {
    Organization.query()
        .then(organizations => {
            res.json(organizations)
        })
})

app.get('/listing', (req, res) => {
    Listing.query()
        .then(listings => {
            res.json(listings)
        })
})

app.get('/organizations/:id', (req, res) => {
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