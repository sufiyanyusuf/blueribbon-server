import express = require('express');
import { Url } from 'url';
import { Types, Units } from './utils/Defaults';
import {$enum} from "ts-enum-util";

const PaymentRouter = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../db/models/purchase');
const Listing = require('../db/models/listing');
const ProductInfo = require('../db/models/productInfo');
const Subscription = require('../db/models/subscription');
const uuid = require('uuid/v1')
const pluralize = require('pluralize')
const { transaction } = require('objection');
const StateManager = require('./utils/SubscriptionStateManager')
const QuantityResolver = require('./utils/QuantityResolver')


//cus_G2w3giq2XEGgBI


interface StripePurchase {
  id: any,
  amount: number,
  currency: any,
  receipt_url: any,
  payment_method_details: { card: { last4: string; brand: string; } }, 
}

interface Purchase {
  user_id:string,
  listing_id:string,
  purchase_id:string,
  payment_id:StripePurchase['id'],
  amount:StripePurchase['amount'],
  currency:StripePurchase['currency'],
  payment_gateway:string,
  receipt_url:StripePurchase['receipt_url'],
  card_last4:StripePurchase['payment_method_details']['card']['last4'],
  card_brand:StripePurchase['payment_method_details']['card']['brand'],
  order_details:any,
  delivery_address:string,
}

interface Subscription {
  user_id:string,
  listing_id:string,
  subscription_id:string,
  type:string,
  value:string,
  title:string,
  brand_name:string,
  brand_logo:string,
  is_active:boolean,
  product_photo:string
}

const getPurchase = async(stripePurchase: StripePurchase ,listingId: string,userId: string,orderDetails: any,deliveryAddress: string):Promise<Purchase> => {

  return new Promise <Purchase> (async (resolve, reject) => {
    
    try {
      const purchase:Purchase = {
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

const getSubscription = async(listingId: any,userId: any,quantity: string,period: string,unit: any):Promise<Subscription> => {

  console.log(listingId);

  return new Promise <Subscription> (async (resolve, reject) => {
    
    try {

      const listing = await Listing.query().findById(listingId)
      const productInfo = await listing.$relatedQuery('productInfo')      
      const organization = await listing.$relatedQuery('organization')

      var _unit = quantity + ' ' + pluralize ('Coupon',quantity)
      if (listing && listing.subscription_type == 'scheduled'){
        _unit = period + ' ' + pluralize (unit,period)
      }

      const subscription:Subscription = {
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
      
      resolve(subscription)
      
    }catch(e){
      reject (e)
    }
  
  })
  
}

const updateUserPurchase = async (purchase: Purchase,subscription: Subscription, intervals:number) => {
  return new Promise (async (resolve, reject) => {
    //add a transaction for this:
    if (intervals == 0) {
      reject(Error('Invalid Subscription Value. Please Try Later'))
    }else{
      try{
        const _purchase = await Purchase.query().insert(purchase);                              
        const _subscription = await _purchase.$relatedQuery('subscription').insert(subscription);
        StateManager(_subscription.id, 'PAYMENT_SUCCESS', {value:intervals});
        resolve(_subscription)
      }catch(e){
        reject(e)
      }
    }
  })
}

const getFulfillmentIntervals = async (req: any): Promise<number> => {
  return new Promise<number>(async (resolve, reject) => {
    try {
      const quantity = req.body.quantity
      const frequency = req.body.frequency
      const length = req.body.length
      
      let _timeUnit: string = length.unit
      let _frequencyUnit: string = frequency.unit

      let timeUnit = $enum(Units.time).getKeyOrThrow(_timeUnit);
      let timeValue: number = length.value
      let frequencyUnit = $enum(Units.frequency).getKeyOrThrow(_frequencyUnit);
      let frequencyValue: number = frequency.value

      let _timePeriod: Types.time = { unit: Units.time[timeUnit], value: timeValue }
      let _frequency: Types.frequency = { unit: Units.frequency[frequencyUnit], value: frequencyValue }
      let intervals: number = QuantityResolver.resolve(_timePeriod, _frequency)
      
      resolve(intervals)
    } catch (e) {
      reject(e)
    }
  })
}

PaymentRouter.route('/new/customer').post(async (req:express.Request, res:express.Response) => {
  return stripe.customers.create({
      description: req.body.id,
    }).then((customer: any,err: any) => {
      if (customer){
        res.status(200).json(customer)
        //write to db
      }else{
        res.status(400).json(err)
      }
    });
});

PaymentRouter.route('/new/card').post(async (req:express.Request, res:express.Response) => {
  const customerId = req.body.customerId;

  return stripe.customers.createSource(
    customerId,
    {
      source: 'tok_mastercard',
    }).then((card: any,err: any) => {
      if (card){
        res.status(200).json(card)
      }else{
        res.status(400).json(err)
      }
    });
 
});

PaymentRouter.route('/customer/cards').post(async (req:express.Request, res:express.Response) => {
  const customerId = req.body.customerId;
  return stripe.customers.listSources(
    customerId,
    {
      limit: 3,
      object: 'card',
    }).then((cards: any,err: any) => {
      if (cards){
        res.status(200).json(cards)
      }else{
        res.status(400).json(err)
      }
    });
})

PaymentRouter.route('/new/charge').post(async (req:express.Request, res:express.Response) => {

  return stripe.charges
  .create({
    amount: req.body.amount, // Unit: cents
    currency: 'aed',
    customer: req.body.customerId,
    card: req.body.cardId,
    description: 'Test payment',
  })
  .then((result: any) => {
    res.status(200).json(result);
  }).catch((e: any) => {
    res.status(400).json(e)
  });

});

PaymentRouter.route('/new/applePay').post(async (req:any, res:express.Response) => {

  // console.log(req.body)
  // validate all params before charging
  // push units from to dashboard from server, dashboard to client,
  try {
    const quantity = req.body.quantity
    const length = req.body.length
    const intervals = await getFulfillmentIntervals(req)
    if (intervals == 0) {
      res.status(400).json(Error('invalid interval count - ' + intervals))
    } else {
        return stripe.charges
        .create({
          amount: req.body.amount, // Unit: cents
          currency: 'aed',
          source: req.body.tokenId,
          description: 'Test payment',
        })
        .then(async (result: any) => {
          try{
            const purchase = await getPurchase(result,req.body.listingId,req.user.sub,req.body.orderDetails,req.body.deliveryAddress)
            const subscription = await getSubscription(req.body.listingId, req.user.sub, quantity, length.value, length.unit)
            
            updateUserPurchase (purchase,subscription,intervals)
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
        })
      }
    } catch (e) {
        res.status(400).json(e)
    }
  
    //update purchases

});

PaymentRouter.route('/remove/card').post(async (req:express.Request, res:express.Response) => {

  const customerId = req.body.customerId;
  const cardId = req.body.cardId;

  return stripe.customers
  .deleteSource(customerId,cardId)
  .then((confirmation: any,err: any) => {
    if (confirmation){
      res.status(200).json(confirmation)
    }else{
      res.status(400).json(err)
    }
  });

});



module.exports = PaymentRouter