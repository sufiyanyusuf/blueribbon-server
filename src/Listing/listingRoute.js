const express = require('express');
const ListingRouter = express.Router();

const Listing = require('../../db/models/listing');
const Organization = require('../../db/models/organization');
const ProductInfo = require('../../db/models/productInfo');

ListingRouter.route('/updateInfo').put(async function (req, res) {
  const newProdInfo = {title:req.body.title,
    description:req.body.description,
    type:req.body.type,
    base_price:req.body.base_price,
    currency:req.body.currency
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

ListingRouter.route('/create').post(async function (req, res) {

  const newListing = {title:req.body.title,
                      organization_id:req.body.org_id};

  const newProdInfo = {title:req.body.title,
    description:req.body.description,
    type:req.body.type,
    base_price:req.body.base_price,
    currency:req.body.currency
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

});

module.exports = ListingRouter;