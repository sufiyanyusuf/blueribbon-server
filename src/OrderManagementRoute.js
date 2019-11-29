"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var SubscriptionStateManager_1 = require("./utils/SubscriptionStateManager");
var OrderManagementRouter = express_1["default"].Router();
var SubscriptionState = require('../db/models/subscriptionState');
var Subscription = require('../db/models/subscription');
var getCurrentStateforSubscription = function (subscriptionStates) {
    // console.log(subscriptionStates)
    var currentState;
    subscriptionStates.map(function (state) {
        if (!currentState) {
            currentState = state;
        }
        else {
            if (currentState.id < state.id) {
                currentState = state;
            }
        }
    });
    return currentState;
};
var getSubscriptionStatesForId = function (subscriptions, id) {
    var states = subscriptions.filter(function (state) {
        if (state.subscription_id == id) {
            return state;
        }
    });
    return states;
};
var getSubscriptionIdList = function (states) {
    var idList = [];
    states.map(function (state) {
        if (!(idList.includes(state.subscription_id))) {
            idList.push(state.subscription_id);
        }
    });
    return idList;
};
var getFulfillmentEventType = function (action) {
    switch (action) {
        case SubscriptionStateManager_1.EventTypes.initiated:
            return { type: SubscriptionStateManager_1.EventTypes.initiated };
            break;
        case SubscriptionStateManager_1.EventTypes.shipped:
            return { type: SubscriptionStateManager_1.EventTypes.shipped };
            break;
        case SubscriptionStateManager_1.EventTypes.failure:
            return { type: SubscriptionStateManager_1.EventTypes.failure };
            break;
        case SubscriptionStateManager_1.EventTypes.success:
            return { type: SubscriptionStateManager_1.EventTypes.success };
            break;
        default:
            return null;
    }
};
OrderManagementRouter.route('/getActiveOrders').get(function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
});
OrderManagementRouter.route('/getOrders/:orderState').get(function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var orderState_1, storedStates_1, idList, currentSubscriptionStatesById, matchingOrderStates, orders, e_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    orderState_1 = req.params.orderState;
                    console.log(orderState_1);
                    return [4 /*yield*/, SubscriptionState.query()]; //query by org id later
                case 1:
                    storedStates_1 = _a.sent() //query by org id later
                    ;
                    idList = getSubscriptionIdList(storedStates_1);
                    currentSubscriptionStatesById = idList.map(function (id) {
                        var states = getSubscriptionStatesForId(storedStates_1, id);
                        return getCurrentStateforSubscription(states);
                    });
                    matchingOrderStates = currentSubscriptionStatesById.filter(function (state) {
                        if (state.fulfillment_state == orderState_1) {
                            var result = {
                                'timestamp': state.timestamp,
                                'fulfillment_state': state.fulfillment_state,
                                'actions': state.fulfillment_options,
                                'subscription_id': state.subscription_id
                            };
                            return result;
                        }
                    });
                    if (!(matchingOrderStates.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, Promise.all(matchingOrderStates.map(function (orderState) { return __awaiter(_this, void 0, void 0, function () {
                            var subscription, order, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, Subscription
                                                .query()
                                                .findById(orderState.subscription_id)
                                                .eager('purchase')];
                                    case 1:
                                        subscription = _a.sent();
                                        order = __assign(__assign({}, orderState), { 'title': subscription.title, 'customer': subscription.user_id, 'order': subscription.purchase.order_details });
                                        return [2 /*return*/, order];
                                    case 2:
                                        e_2 = _a.sent();
                                        return [2 /*return*/, (e_2)];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    orders = _a.sent();
                    res.status(200).json(orders);
                    return [3 /*break*/, 4];
                case 3:
                    res.status(204).json({});
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    res.status(500).json(e_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
});
OrderManagementRouter.route('/updateFulfillmentState').post(function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var subscriptionId, action, subscriptionEvent;
        return __generator(this, function (_a) {
            subscriptionId = req.body.subscriptionId;
            action = req.body.action;
            subscriptionEvent = getFulfillmentEventType(action);
            if (!subscriptionEvent) {
                res.status(400).json('not allowed');
            }
            else {
                SubscriptionStateManager_1.stateManager(subscriptionId, subscriptionEvent);
            }
            return [2 /*return*/];
        });
    });
});
//send notifications
module.exports = OrderManagementRouter;
