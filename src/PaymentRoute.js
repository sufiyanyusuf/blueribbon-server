const express = require('express');
const PaymentRouter = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//cus_G2w3giq2XEGgBI

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

  // console.log(req.body.amount, req.body.tokenId, req.body.customerId);

    return stripe.charges
    .create({
      amount: req.body.amount, // Unit: cents
      currency: 'aed',
      customer: req.body.customerId,
      card: req.body.cardId,
      description: 'Test payment',
    })
    .then(result => res.status(200).json(result));


  
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