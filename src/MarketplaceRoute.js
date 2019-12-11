const express = require('express');
const MarketplaceRouter = express.Router();

const Listing = require('../db/models/listing');
const Organization = require('../db/models/organization');
const ProductInfo = require('../db/models/productInfo');


MarketplaceRouter.route('/listing/:listing_id/').get(async function(req, res){
  
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

MarketplaceRouter.route('/listings').get(async function(req, res){

    try {
        const listing = await Listing
          .query()
          .where('status','LIVE')
          .eager('[organization,productInfo]')
  
        res.status(200).json(listing)
    } catch (e) {
      console.log(e)
      res.status(400).json(e)
    }

})

module.exports = MarketplaceRouter;