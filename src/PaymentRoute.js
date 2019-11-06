const express = require('express');
const PaymentRouter = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../db/models/purchase');
const Listing = require('../db/models/listing');
const ProductInfo = require('../db/models/productInfo');
const Subscription = require('../db/models/subscription');
const uuid = require('uuid/v1')
const pluralize = require ('pluralize')
//cus_G2w3giq2XEGgBI

const getPurchase = async(stripePurchase,listingId,userId,orderDetails,deliveryAddress) => {

  return new Promise (async (resolve, reject) => {
    
    try {
      const purchase = {
        user_id:userId,
        listing_id:listingId,
        purchase_id:uuid(),
        payment_id:stripePurchase.id,
        amount:stripePurchase.amount/100,
        currency:stripePurchase.currency,
        payment_gateway:'stripe',
        receipt_url:stripePurchase.receipt_url,
        card_last4:stripePurchase.payment_method_details.card.last4,
        card_brand:stripePurchase.payment_method_details.card.brand,
        order_details:orderDetails,
        delivery_address:deliveryAddress,
      }
      resolve (purchase)
    }catch(e){
      reject (e)
    }
  
  })

}

const getSubscription = async(listingId,userId,quantity,period,unit) => {

  console.log(listingId);

  return new Promise (async (resolve, reject) => {
    
    try {

      const listing = await Listing.query().findById(listingId)
      const productInfo = await listing.$relatedQuery('productInfo')      
      const organization = await listing.$relatedQuery('organization')

      var _unit = quantity + ' ' + pluralize ('Coupon',quantity)
      if (listing && listing.subscription_type == 'scheduled'){
        _unit = period + ' ' + pluralize (unit,period)
      }

      const subscription = {
        user_id:userId,
        listing_id:listingId,
        subscription_id:uuid(),
        type:listing.subscription_type,
        value:_unit,
        title:productInfo.title,
        brand_name:organization.title,
        brand_logo:organization.logo,
        is_active:true,
        product_photo:productInfo.image_url
      }
      
      resolve (subscription)
    }catch(e){
      reject (e)
    }
  
  })
  
}

PaymentRouter.route('/test').get(async (req, res) => {

  const orderInfo = {
    value:'5 Bottles'
  }

  getSubscription(4,'xyz',orderInfo).then(sub => {
    console.log(sub);
  }).catch(e => {
    console.log(e);
  })
 
});

const updateUserPurchase = async (purchase,subscription) => {

  return new Promise (async (resolve, reject) => {
    
    try{
      const _purchase = await Purchase.query().insert(purchase);                              
      const productInfo = await _purchase.$relatedQuery('subscription').insert(subscription);

      resolve (productInfo)

    }catch(e){
      reject(e)
    }

  })

}

PaymentRouter.route('/new/customer').post(async (req, res) => {
  return stripe.customers.create({
      description: req.body.id,
    }).then((customer,err) => {
      if (customer){
        res.status(200).json(customer)
        //write to db
      }else{
        res.status(400).json(err)
      }
    });
});

PaymentRouter.route('/new/card').post(async (req, res) => {
  const customerId = req.body.customerId;

  return stripe.customers.createSource(
    customerId,
    {
      source: 'tok_mastercard',
    }).then((card,err) => {
      if (card){
        res.status(200).json(card)
      }else{
        res.status(400).json(err)
      }
    });
 
});


PaymentRouter.route('/customer/cards').post(async (req, res) => {
  const customerId = req.body.customerId;
  return stripe.customers.listSources(
    customerId,
    {
      limit: 3,
      object: 'card',
    }).then((cards,err) => {
      if (cards){
        res.status(200).json(cards)
      }else{
        res.status(400).json(err)
      }
    });
})

PaymentRouter.route('/new/charge').post(async (req, res) => {

  return stripe.charges
  .create({
    amount: req.body.amount, // Unit: cents
    currency: 'aed',
    customer: req.body.customerId,
    card: req.body.cardId,
    description: 'Test payment',
  })
  .then(result => {
    res.status(200).json(result);
  }).catch(e => {
    res.status(400).json(e)
  });

});

PaymentRouter.route('/new/applePay').post(async (req, res) => {

    console.log(req.body)
    return stripe.charges
    .create({
      amount: req.body.amount, // Unit: cents
      currency: 'aed',
      source: req.body.tokenId,
      description: 'Test payment',
    })
    .then(async (result) => {
      const quantity = req.body.quantity
      const period = req.body.period
      const unit = req.body.unit

      try{
  
        const purchase = await getPurchase(result,req.body.listingId,req.user.sub,req.body.orderDetails,req.body.deliveryAddress)
        const subscription = await getSubscription(req.body.listingId,req.user.sub,quantity,period,unit)

        updateUserPurchase (purchase,subscription)
        .then(_ => {
          res.status(200)
        })
        .catch(e => {
          console.log(e)
          res.status(400)
        })
        
      }catch(e){
        res.status(400)
        console.log(e)
      }

      res.status(200).json(result)
    }).catch(e => {
      res.status(400).json(e)
    })

    //update purchases

});


PaymentRouter.route('/remove/card').post(async (req, res) => {

  const customerId = req.body.customerId;
  const cardId = req.body.cardId;

  return stripe.customers
  .deleteSource(customerId,cardId)
  .then((confirmation,err) => {
    if (confirmation){
      res.status(200).json(confirmation)
    }else{
      res.status(400).json(err)
    }
  });

});

module.exports = PaymentRouter