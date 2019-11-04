const express = require('express');
const ListingRouter = express.Router();
const axios = require ('axios');
const Listing = require('../../db/models/listing');
const Organization = require('../../db/models/organization');
const ProductInfo = require('../../db/models/productInfo');


ListingRouter.route('/updateInfo').put(async function (req, res) {
  const newProdInfo = {
    title:req.body.title,
    description:req.body.description,
    type:req.body.type,
    base_price:req.body.base_price,
    currency:req.body.currency,
    image_url:req.body.image_url
  };
  try{    
    const updatedProductInfo = await ProductInfo.query()
    .patch(newProdInfo)
    .where('listing_id',req.body.listing_id)

    const updatedListingTitle = await Listing.query()
    .findById(req.body.listing_id)
    .patch({title:newProdInfo.title})

    res.sendStatus(200);

  }catch(e){
    console.error(e);
  }  
})

ListingRouter.route('/updateStatus').post(async function (req, res) {
  console.log(req.body)
  if (req.body.listing_id && req.body.status){
    try{
      const listing = await Listing.query()
                                   .findById(req.body.listing_id)
                                   .patch({
                                     status:req.body.status
                                   })
      res.sendStatus(200)
    }catch(e){
      res.status(400)
    }
  }
})

ListingRouter.route('/:listing_id/status').get(async function (req, res) {
  if (req.params.listing_id){
    try{
      const listing = await Listing.query().findById(req.params.listing_id)
      const status = listing.status
      res.json(status)
    }catch(e){
      res.status(400)
    }
  }
})

ListingRouter.route('/:listing_id/deepLink').get(async function (req, res) {
  const listingId = req.params.listing_id

  if (listingId){

    try{
      const firebaseKey = process.env.FIREBASE_KEY
      const endpoint = 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key='+firebaseKey

      axios.post(endpoint,{
        "dynamicLinkInfo": {
          "domainUriPrefix": "https://links.blueribbon.io",
          "link": "https://links.blueribbon.io/listing/"+listingId,
          "androidInfo": {
            "androidPackageName": "com.blueribbon.wallet"
          },
          "iosInfo": {
            "iosBundleId": "com.blueribbon.wallet"
          }
        }
      }).then(response => {
        console.log(response)
        if (response.data.shortLink){
          res.json(response.data.shortLink)
        }
      }).catch(error => {
        res.json(error)
      })

    }catch(e){
      res.status(400)
    }
    
  }
})

ListingRouter.route('/create').post(async function (req, res) {

  const newListing = {title:req.body.title,
                      organization_id:req.body.org_id};

  const newProdInfo = {title:req.body.title,
    description:req.body.description,
    type:req.body.type,
    base_price:req.body.base_price,
    currency:req.body.currency,
    image_url:req.body.image_url
  };  

  try{
    const listing = await Listing.query()
                                  .allowInsert('[title,organization_id]')
                                  .insert(newListing);
                                  
    const productInfo = await listing.$relatedQuery('productInfo')
                                      .allowInsert('[title,description,type,base_price,currency,image_url,unit_title]')
                                      .insert(newProdInfo);

    res.send({listing});

  }catch(e){
    console.error(e);
  }

})

ListingRouter.route('/:listing_id/').get(async function(req, res){
  
  try{
    if (req.params.listing_id){
      const listing = await Listing
      .query()
      .findById(req.params.listing_id)
      .eager('[organization,productInfo,modifier.[stepper,textField,multiOption,choice]]')

      res.status(200).json(listing)
    }
    
  }catch(e){
    res.status(400).json(e)
  }

})

module.exports = ListingRouter;