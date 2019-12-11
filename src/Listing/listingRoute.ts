import express = require('express');
import { error } from 'xstate/lib/actions';
const ListingRouter = express.Router();
const axios = require ('axios');
const Listing = require('../../db/models/listing');
const Organization = require('../../db/models/organization');
const ProductInfo = require('../../db/models/productInfo');

ListingRouter.route('/getProductInfo/:listing_id').get(async function (req: express.Request, res: express.Response) { 
    try { 
        let id = parseInt(req.params.listing_id)
        console.log(id)
        let productInfo = await ProductInfo.query()
            .where('listing_id', id)
        res.status(200).json(productInfo[0])
    } catch (e) {
        res.status(404).json(e)
    } 
})

ListingRouter.route('/updateInfo').put(async function (req:express.Request, res:express.Response) {
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

ListingRouter.route('/updateStatus').post(async function (req:express.Request, res:express.Response) {

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

ListingRouter.route('/:listing_id/status').get(async function (req:express.Request, res:express.Response) {
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

ListingRouter.route('/:listing_id/deepLink').get(async function (req:express.Request, res:express.Response) {
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
      }).then((_response:any) => {
          if (_response.data.shortLink) {
          res.json(_response.data.shortLink)
        }
      }).catch((e: Error) => {
        res.json(e)
      })

    }catch(e){
      res.status(400)
    }
    
  }
})

ListingRouter.route('/create').post(async function (req:any, res:express.Response) {

    const newListing = {
        title: req.body.title,
        organization_id: req.user.orgId
    };

    const newProdInfo = {
        title: req.body.title,
        description:req.body.description,
        type:req.body.type,
        base_price:req.body.base_price,
        currency:req.body.currency,
        image_url:req.body.image_url
    };  

    try {
      
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

const returnListing = async function (req: any, res: express.Response, next: express.NextFunction) {

    try {
        
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

}

const authorizeListingAccess = async function (req: any, res: express.Response, next: express.NextFunction) {

    try {

        let listingId = req.params.listing_id
        let orgId = req.user.orgId
        let listing = Listing.query().findById(listingId)

        if (listing.organization_id == orgId) {
            next()
        } else {
            res.status(400).json('unauthorized')
        }

    }catch(e){
        res.status(400).json(e)
    }

}

ListingRouter.get('/:listing_id/', authorizeListingAccess, returnListing)

// ListingRouter.route('/:listing_id/').get(async function(req:express.Request, res:express.Response){
  
//     // check if listing id belongs to user's org
    
//     try {
        
//         if (req.params.listing_id){
//             const listing = await Listing
//                 .query()
//                 .findById(req.params.listing_id)
//                 .eager('[organization,productInfo,modifier.[stepper,textField,multiOption,choice]]')
//             res.status(200).json(listing)
//         }

//     }catch(e){
//         res.status(400).json(e)
//     }

// })

ListingRouter.route('/').get(async function(req:any, res:express.Response){
    
    try {
        let orgId = req.user.orgId
        const listing = await Listing
        .query()
        .where('organization_id',orgId)
        
    //   console.log(listing)
        res.status(200).json(listing)

    } catch (e) {
        // console.log(e)
        res.status(400).json(e)
    }

})

module.exports = ListingRouter;