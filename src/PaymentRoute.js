const express = require('express');
const PaymentRouter = express.Router();

const stripe = require('stripe')('sk_test_fQ0Hzgu9LrDLEKxDsCOO9tjQ00t5nexgqU');

PaymentRouter.route('/new').post(async (req, res) => {
  return stripe.charges
    .create({
      amount: req.body.amount, // Unit: cents
      currency: 'aed',
      source: req.body.tokenId,
      description: 'Test payment',
    })
    .then(result => res.status(200).json(result));
});

module.exports = PaymentRouter