"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var express = require("express");
var Defaults_1 = require("./utils/Defaults");
var ts_enum_util_1 = require("ts-enum-util");
var PaymentRouter = express.Router();
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var Purchase = require('../db/models/purchase');
var Listing = require('../db/models/listing');
var ProductInfo = require('../db/models/productInfo');
var Subscription = require('../db/models/subscription');
var uuid = require('uuid/v1');
var pluralize = require('pluralize');
var transaction = require('objection').transaction;
var QuantityResolver = require('./utils/QuantityResolver');
var FrequencyResolver = require('./utils/FrequencyResolver');
var SubscriptionStateManager_1 = require("./utils/SubscriptionStateManager");
var getPurchase = function (stripePurchase, listingId, userId, orderDetails, deliveryAddress) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var purchase;
                return __generator(this, function (_a) {
                    try {
                        purchase = {
                            user_id: userId,
                            listing_id: listingId,
                            purchase_id: uuid(),
                            payment_id: stripePurchase.id,
                            amount: stripePurchase.amount / 100,
                            currency: stripePurchase.currency,
                            payment_gateway: 'stripe',
                            receipt_url: stripePurchase.receipt_url,
                            card_last4: stripePurchase.payment_method_details.card.last4,
                            card_brand: stripePurchase.payment_method_details.card.brand,
                            order_details: orderDetails,
                            delivery_address: deliveryAddress
                        };
                        resolve(purchase);
                    }
                    catch (e) {
                        reject(e);
                    }
                    return [2 /*return*/];
                });
            }); })];
    });
}); };
var getSubscription = function (listingId, userId, quantity, period, unit, frequencyValue, frequencyUnit) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log(listingId);
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var listing, productInfo, organization, _unit, subscription, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, Listing.query().findById(listingId)];
                        case 1:
                            listing = _a.sent();
                            return [4 /*yield*/, listing.$relatedQuery('productInfo')];
                        case 2:
                            productInfo = _a.sent();
                            return [4 /*yield*/, listing.$relatedQuery('organization')];
                        case 3:
                            organization = _a.sent();
                            _unit = quantity + ' ' + pluralize('Coupon', quantity);
                            if (listing && listing.subscription_type == 'scheduled') {
                                _unit = period + ' ' + pluralize(unit, period);
                            }
                            subscription = {
                                user_id: userId,
                                listing_id: listingId,
                                subscription_id: uuid(),
                                type: listing.subscription_type,
                                value: _unit,
                                title: productInfo.title,
                                brand_name: organization.title,
                                brand_logo: organization.logo,
                                is_active: true,
                                product_photo: productInfo.image_url,
                                frequency_unit: frequencyUnit,
                                frequency_value: frequencyValue
                            };
                            resolve(subscription);
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _a.sent();
                            reject(e_1);
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
var updateUserPurchase = function (purchase, subscription, intervals, frequencyOffset) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var _subscription, _purchase, _subscriptionId, eventType, purchased, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(intervals == 0)) return [3 /*break*/, 1];
                            reject(Error('Invalid Subscription Value. Please Try Later'));
                            return [3 /*break*/, 6];
                        case 1:
                            _a.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, Subscription.query().insert(subscription)];
                        case 2:
                            _subscription = _a.sent();
                            return [4 /*yield*/, _subscription.$relatedQuery('purchase').insert(purchase)];
                        case 3:
                            _purchase = _a.sent();
                            _subscriptionId = _subscription.id;
                            eventType = { type: SubscriptionStateManager_1.EventTypes.paymentSuccess, value: intervals, fulfillmentOffset: frequencyOffset };
                            return [4 /*yield*/, SubscriptionStateManager_1.stateManager(_subscriptionId, eventType, { value: intervals, fulfillmentOffset: frequencyOffset })];
                        case 4:
                            purchased = _a.sent();
                            resolve(_subscription);
                            return [3 /*break*/, 6];
                        case 5:
                            e_2 = _a.sent();
                            reject(e_2);
                            return [3 /*break*/, 6];
                        case 6: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
var getFrequencyOffset = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var frequency, _frequencyUnit, _frequencyValue, _frequency;
                return __generator(this, function (_a) {
                    try {
                        frequency = req.body.frequency;
                        _frequencyUnit = ts_enum_util_1.$enum(Defaults_1.Units.frequency).getKeyOrThrow(frequency.unit);
                        _frequencyValue = frequency.value;
                        _frequency = { unit: Defaults_1.Units.frequency[_frequencyUnit], value: _frequencyValue };
                        resolve(FrequencyResolver.resolveOffset(_frequency));
                    }
                    catch (e) {
                        reject(e);
                    }
                    return [2 /*return*/];
                });
            }); })];
    });
}); };
var getFulfillmentIntervals = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var quantity, frequency, length_1, _timeUnit, _frequencyUnit, timeUnit, timeValue, frequencyUnit, frequencyValue, _timePeriod, _frequency, intervals;
                return __generator(this, function (_a) {
                    try {
                        quantity = req.body.quantity;
                        frequency = req.body.frequency;
                        length_1 = req.body.length;
                        _timeUnit = length_1.unit;
                        _frequencyUnit = frequency.unit;
                        timeUnit = ts_enum_util_1.$enum(Defaults_1.Units.time).getKeyOrThrow(_timeUnit);
                        timeValue = length_1.value;
                        frequencyUnit = ts_enum_util_1.$enum(Defaults_1.Units.frequency).getKeyOrThrow(_frequencyUnit);
                        frequencyValue = frequency.value;
                        _timePeriod = { unit: Defaults_1.Units.time[timeUnit], value: timeValue };
                        _frequency = { unit: Defaults_1.Units.frequency[frequencyUnit], value: frequencyValue };
                        intervals = QuantityResolver.resolve(_timePeriod, _frequency);
                        resolve(intervals);
                    }
                    catch (e) {
                        reject(e);
                    }
                    return [2 /*return*/];
                });
            }); })];
    });
}); };
PaymentRouter.route('/new/customer').post(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, stripe.customers.create({
                description: req.body.id
            }).then(function (customer, err) {
                if (customer) {
                    res.status(200).json(customer);
                    //write to db
                }
                else {
                    res.status(400).json(err);
                }
            })];
    });
}); });
PaymentRouter.route('/new/card').post(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var customerId;
    return __generator(this, function (_a) {
        customerId = req.body.customerId;
        return [2 /*return*/, stripe.customers.createSource(customerId, {
                source: 'tok_mastercard'
            }).then(function (card, err) {
                if (card) {
                    res.status(200).json(card);
                }
                else {
                    res.status(400).json(err);
                }
            })];
    });
}); });
PaymentRouter.route('/customer/cards').post(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var customerId;
    return __generator(this, function (_a) {
        customerId = req.body.customerId;
        return [2 /*return*/, stripe.customers.listSources(customerId, {
                limit: 3,
                object: 'card'
            }).then(function (cards, err) {
                if (cards) {
                    res.status(200).json(cards);
                }
                else {
                    res.status(400).json(err);
                }
            })];
    });
}); });
PaymentRouter.route('/new/charge').post(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, stripe.charges
                .create({
                amount: req.body.amount,
                currency: 'aed',
                customer: req.body.customerId,
                card: req.body.cardId,
                description: 'Test payment'
            })
                .then(function (result) {
                res.status(200).json(result);
            })["catch"](function (e) {
                res.status(400).json(e);
            })];
    });
}); });
PaymentRouter.route('/new/applePay').post(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var quantity_1, length_2, frequency_1, intervals_1, fulfillmentCycleOffset_1, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                quantity_1 = req.body.quantity;
                length_2 = req.body.length;
                frequency_1 = req.body.frequency;
                return [4 /*yield*/, getFulfillmentIntervals(req)];
            case 1:
                intervals_1 = _a.sent();
                return [4 /*yield*/, getFrequencyOffset(req)];
            case 2:
                fulfillmentCycleOffset_1 = _a.sent();
                if (intervals_1 == 0) {
                    res.status(400).json(Error('invalid interval count - ' + intervals_1));
                }
                else {
                    return [2 /*return*/, stripe.charges
                            .create({
                            amount: req.body.amount,
                            currency: 'aed',
                            source: req.body.tokenId,
                            description: 'Test payment'
                        })
                            .then(function (result) { return __awaiter(void 0, void 0, void 0, function () {
                            var purchase, subscription, e_4;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 3, , 4]);
                                        return [4 /*yield*/, getPurchase(result, req.body.listingId, req.user.sub, req.body.orderDetails, req.body.deliveryAddress)];
                                    case 1:
                                        purchase = _a.sent();
                                        return [4 /*yield*/, getSubscription(req.body.listingId, req.user.sub, quantity_1, length_2.value, length_2.unit, parseInt(frequency_1.value), frequency_1.unit)];
                                    case 2:
                                        subscription = _a.sent();
                                        updateUserPurchase(purchase, subscription, intervals_1, fulfillmentCycleOffset_1)
                                            .then(function (_) {
                                            res.status(200);
                                        })["catch"](function (e) {
                                            console.log(e);
                                            res.status(400);
                                        });
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_4 = _a.sent();
                                        res.status(400);
                                        console.log(e_4);
                                        return [3 /*break*/, 4];
                                    case 4:
                                        res.status(200).json(result);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                }
                return [3 /*break*/, 4];
            case 3:
                e_3 = _a.sent();
                res.status(400).json(e_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
PaymentRouter.route('/remove/card').post(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var customerId, cardId;
    return __generator(this, function (_a) {
        customerId = req.body.customerId;
        cardId = req.body.cardId;
        return [2 /*return*/, stripe.customers
                .deleteSource(customerId, cardId)
                .then(function (confirmation, err) {
                if (confirmation) {
                    res.status(200).json(confirmation);
                }
                else {
                    res.status(400).json(err);
                }
            })];
    });
}); });
module.exports = PaymentRouter;
