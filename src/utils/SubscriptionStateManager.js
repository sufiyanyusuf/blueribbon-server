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
var objection_1 = require("objection");
var xstate_1 = require("xstate");
var Notifications_1 = require("./../Notifications");
var SubscriptionState = require('../../db/models/subscriptionState');
var UserSubscription = require('../../db/models/subscription');
var FulfilledStates = require('../../db/models/fulfilledStates');
var moment = require('moment');
var assign = xstate_1.actions.assign;
var EventTypes;
(function (EventTypes) {
    EventTypes["endCycle"] = "END_CYCLE";
    EventTypes["resetCycle"] = "RESET_CYCLE";
    EventTypes["activate"] = "ACTIVATE";
    EventTypes["pause"] = "PAUSE";
    EventTypes["resume"] = "RESUME";
    EventTypes["expired"] = "EXPIRED";
    EventTypes["initiated"] = "INITIATED";
    EventTypes["shipped"] = "SHIPPED";
    EventTypes["success"] = "SUCCESS";
    EventTypes["failure"] = "FAILURE";
    EventTypes["paymentSuccess"] = "PAYMENT_SUCCESS";
    EventTypes["paymentDeclined"] = "PAYMENT_DECLINED";
})(EventTypes = exports.EventTypes || (exports.EventTypes = {}));
var States;
(function (States) {
    States["ineligible"] = "ineligible";
    States["pending"] = "pending";
    States["initiated"] = "initiated";
    States["shipped"] = "shipped";
    States["failure"] = "failure";
    States["successful"] = "successful";
    States["inactive"] = "inactive";
    States["active"] = "active";
    States["paused"] = "paused";
})(States = exports.States || (exports.States = {}));
var subscriptionValid = function (context, event) {
    return context.remainingFulfillmentIntervals > 0 && !context.paused;
};
var subscriptionNotPaused = function (context, event) {
    return (context.paused != true);
};
var pauseSubscription = assign({
    paused: true
});
var resumeSubscription = assign({
    paused: false
});
var subscriptionInvalid = function (context, event) {
    return context.remainingFulfillmentIntervals < 1 && !context.paused;
};
var deductSubscriptionValue = xstate_1.actions.assign({
    remainingFulfillmentIntervals: function (context, event) {
        return context.remainingFulfillmentIntervals - 1;
    }
});
var incrementSubscriptionValue = xstate_1.actions.assign({
    remainingFulfillmentIntervals: function (context, event) {
        if (event.type == 'PAYMENT_SUCCESS' && event.value) {
            return context.remainingFulfillmentIntervals + event.value;
        }
        else {
            return context.remainingFulfillmentIntervals;
        }
    },
    fulfillmentOffset: function (context, event) {
        if (event.type == 'PAYMENT_SUCCESS' && event.fulfillmentOffset) {
            return context.fulfillmentOffset + event.fulfillmentOffset;
        }
        else {
            return context.fulfillmentOffset;
        }
    }
});
var machine = xstate_1.Machine({
    id: 'subscription',
    type: 'parallel',
    context: {
        remainingFulfillmentIntervals: 0,
        paused: false,
        fulfillmentOffset: 0
    },
    states: {
        subscription: {
            initial: 'inactive',
            states: {
                inactive: {
                    on: {
                        ACTIVATE: 'active'
                    }
                },
                active: {
                    on: {
                        PAUSE: 'paused',
                        EXPIRED: {
                            target: 'inactive',
                            actions: xstate_1.send('END_CYCLE')
                        }
                    }
                },
                paused: {
                    entry: pauseSubscription,
                    exit: resumeSubscription,
                    on: {
                        RESUME: 'active'
                    }
                }
            }
        },
        payment: {
            initial: 'pending',
            states: {
                pending: {
                    on: {
                        PAYMENT_DECLINED: 'declined',
                        PAYMENT_SUCCESS: {
                            target: 'successful',
                            actions: xstate_1.send('ACTIVATE')
                        }
                    }
                },
                successful: {
                    entry: incrementSubscriptionValue,
                    on: {
                        END_CYCLE: { target: 'pending', cond: subscriptionInvalid },
                        '': [
                            { target: 'pending', cond: subscriptionInvalid },
                        ]
                    }
                },
                declined: {
                    on: {
                        PAYMENT_SUCCESS: {
                            target: 'successful',
                            actions: xstate_1.send('ACTIVATE')
                        }
                    }
                }
            }
        },
        fulfillment: {
            initial: 'ineligible',
            states: {
                ineligible: {
                    on: {
                        ACTIVATE: { target: 'pending', cond: subscriptionValid }
                    }
                },
                pending: {
                    on: {
                        INITIATED: { target: 'initiated', cond: subscriptionNotPaused }
                    }
                },
                initiated: {
                    on: {
                        SHIPPED: 'shipped',
                        SUCCESS: 'successful',
                        FAILURE: 'failure'
                    }
                },
                shipped: {
                    on: {
                        SUCCESS: 'successful',
                        FAILURE: 'failure'
                    }
                },
                successful: {
                    entry: deductSubscriptionValue,
                    on: {
                        RESET_CYCLE: {
                            target: 'pending',
                            cond: subscriptionValid
                        },
                        END_CYCLE: {
                            target: 'ineligible',
                            cond: subscriptionInvalid,
                            actions: xstate_1.send('EXPIRED')
                        }
                    }
                },
                failure: {
                    on: {
                        INITIATED: 'initiated',
                        SHIPPED: 'shipped',
                        RESET_CYCLE: { target: 'pending', cond: subscriptionValid }
                    }
                }
            }
        }
    }
});
exports.stateManager = function (subscriptionId, event, params) {
    if (params === void 0) { params = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                    var storedState, subscription, lastState, service, stateDefinition, previousState, resolvedState, _subscriptionEvent;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, SubscriptionState.query().where('subscription_id', subscriptionId)];
                            case 1:
                                storedState = _a.sent();
                                return [4 /*yield*/, UserSubscription.query().findById(subscriptionId)];
                            case 2:
                                subscription = _a.sent();
                                return [4 /*yield*/, subscription.$relatedQuery('currentState')
                                    // console.log(lastState)
                                    // if (!lastState) {
                                    //     storedState.map((state:subscriptionStateRecord) => {
                                    //         if (!lastState){
                                    //             lastState = state
                                    //         }else{
                                    //             if (lastState.id < state.id) {
                                    //                 lastState = state
                                    //             }
                                    //         }
                                    //     })
                                    // }
                                ];
                            case 3:
                                lastState = _a.sent();
                                service = xstate_1.interpret(machine);
                                service.onTransition(function (state) { return __awaiter(void 0, void 0, void 0, function () {
                                    var _state_1, knex, notificationEvent, notificationEvent, notificationEvent, options, writtenState, err_1;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                // console.log(state.changed)
                                                if (state.changed === false) {
                                                    reject('no change');
                                                }
                                                if (!(state.changed === true)) return [3 /*break*/, 4];
                                                _state_1 = state;
                                                knex = SubscriptionState.knex();
                                                _a.label = 1;
                                            case 1:
                                                _a.trys.push([1, 3, , 4]);
                                                // send notifications where applicable (move this elsewhere )
                                                if (event.type == EventTypes.resetCycle) {
                                                    clearFulfilledState(subscriptionId);
                                                }
                                                if (event.type == EventTypes.endCycle) {
                                                    clearFulfilledState(subscriptionId);
                                                    // avoid multiple calls
                                                    if (_state_1.matches({ subscription: States.inactive })) {
                                                        notificationEvent = {
                                                            type: Notifications_1.NotificationTypes.subscriptionExpired,
                                                            subscriptionId: subscriptionId
                                                        };
                                                        Notifications_1.notifySubscriber(notificationEvent);
                                                    }
                                                }
                                                if (event.type == EventTypes.shipped) {
                                                    notificationEvent = {
                                                        type: Notifications_1.NotificationTypes.itemShipped,
                                                        subscriptionId: subscriptionId
                                                    };
                                                    Notifications_1.notifySubscriber(notificationEvent);
                                                }
                                                if (event.type == EventTypes.failure) {
                                                    //
                                                }
                                                if (event.type == EventTypes.success) {
                                                    //
                                                }
                                                if (event.type == EventTypes.paymentDeclined) {
                                                    notificationEvent = {
                                                        type: Notifications_1.NotificationTypes.paymentDeclined,
                                                        subscriptionId: subscriptionId
                                                    };
                                                    Notifications_1.notifySubscriber(notificationEvent);
                                                }
                                                if (event.type == EventTypes.paymentSuccess) {
                                                    //
                                                }
                                                if (_state_1.matches({ fulfillment: States.ineligible })) {
                                                    options = (machine.states.fulfillment.states.ineligible.events);
                                                }
                                                else if (_state_1.matches({ fulfillment: States.pending })) {
                                                    options = (machine.states.fulfillment.states.pending.events);
                                                }
                                                else if (_state_1.matches({ fulfillment: States.initiated })) {
                                                    options = (machine.states.fulfillment.states.initiated.events);
                                                }
                                                else if (_state_1.matches({ fulfillment: States.shipped })) {
                                                    options = (machine.states.fulfillment.states.shipped.events);
                                                }
                                                else if (_state_1.matches({ fulfillment: States.successful })) {
                                                    options = (machine.states.fulfillment.states.successful.events); //change this
                                                }
                                                else if (_state_1.matches({ fulfillment: States.failure })) {
                                                    options = (machine.states.fulfillment.states.failure.events);
                                                }
                                                return [4 /*yield*/, objection_1.transaction(knex, function (trx) { return __awaiter(void 0, void 0, void 0, function () {
                                                        var newState, isActive, updatedUserSubscription, fulfillmentCycleOffset, fulfilledStatesRecord, fulfilledState;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0: return [4 /*yield*/, SubscriptionState
                                                                        .query(trx)
                                                                        .insert({
                                                                        'subscription_id': subscriptionId,
                                                                        'state': _state_1,
                                                                        'subscription_state': _state_1.value.subscription,
                                                                        'payment_state': _state_1.value.payment,
                                                                        'fulfillment_state': _state_1.value.fulfillment,
                                                                        'fulfillment_options': options
                                                                    })];
                                                                case 1:
                                                                    newState = _a.sent();
                                                                    isActive = !(_state_1.value.subscription == States.inactive);
                                                                    return [4 /*yield*/, UserSubscription
                                                                            .query(trx)
                                                                            .findById(subscriptionId)
                                                                            .patch({
                                                                            'current_state': newState.id,
                                                                            'is_active': isActive
                                                                        })];
                                                                case 2:
                                                                    updatedUserSubscription = _a.sent();
                                                                    if (!_state_1.matches({ fulfillment: States.successful })) return [3 /*break*/, 6];
                                                                    if (!_state_1.context) return [3 /*break*/, 6];
                                                                    console.log(_state_1.context);
                                                                    return [4 /*yield*/, getFulfillmentOffset(subscriptionId, _state_1.context.fulfillmentOffset)];
                                                                case 3:
                                                                    fulfillmentCycleOffset = _a.sent();
                                                                    return [4 /*yield*/, FulfilledStates.query().where('subscription_id', newState.subscription_id)
                                                                        // check if exists in fulfilled_states table
                                                                    ];
                                                                case 4:
                                                                    fulfilledStatesRecord = _a.sent();
                                                                    if (!fulfilledStatesRecord) return [3 /*break*/, 6];
                                                                    if (!(fulfilledStatesRecord.length == 0)) return [3 /*break*/, 6];
                                                                    return [4 /*yield*/, newState
                                                                            .$relatedQuery('fulfilledState', trx)
                                                                            .insert({
                                                                            'subscription_id': subscriptionId,
                                                                            'next_cycle': fulfillmentCycleOffset
                                                                        })];
                                                                case 5:
                                                                    fulfilledState = _a.sent();
                                                                    return [2 /*return*/, fulfilledState];
                                                                case 6: return [2 /*return*/, newState];
                                                            }
                                                        });
                                                    }); })];
                                            case 2:
                                                writtenState = _a.sent();
                                                if (writtenState) {
                                                    resolve(true);
                                                }
                                                else {
                                                    console.log('no written state ?');
                                                    resolve(false);
                                                }
                                                return [3 /*break*/, 4];
                                            case 3:
                                                err_1 = _a.sent();
                                                //reject promise
                                                console.log(err_1, 'Something went wrong. State not inserted');
                                                reject(err_1);
                                                return [3 /*break*/, 4];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); });
                                // Start the service
                                if (lastState) {
                                    stateDefinition = lastState.state;
                                    previousState = xstate_1.State.create(stateDefinition);
                                    resolvedState = machine.resolveState(previousState);
                                    // Start the service
                                    service.start(resolvedState);
                                }
                                else {
                                    console.log('no history');
                                    service.start();
                                }
                                _subscriptionEvent = event.type;
                                service.send(_subscriptionEvent, params);
                                // Stop the service when you are no longer using it.
                                service.stop();
                                return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
};
var getFulfillmentOffset = function (subscriptionId, fulfillmentOffset) { return __awaiter(void 0, void 0, void 0, function () {
    var states, lastPendingState, start, now, duration, days, nextCycle, nextCycle;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, SubscriptionState
                    .query()
                    .where('subscription_id', subscriptionId)
                    .where('fulfillment_state', 'pending')
                    .orderBy('id')];
            case 1:
                states = _a.sent();
                lastPendingState = states.slice(-1)[0];
                start = moment(new Date(lastPendingState.timestamp.toString()));
                now = moment(new Date());
                duration = moment.duration(now.diff(start));
                days = duration.asDays();
                if (days < fulfillmentOffset) {
                    nextCycle = moment(start.add(fulfillmentOffset, 'days').format());
                    return [2 /*return*/, nextCycle];
                }
                else {
                    nextCycle = moment(Date.now()).format();
                    return [2 /*return*/, nextCycle];
                }
                return [2 /*return*/];
        }
    });
}); };
var clearFulfilledState = function (subscriptionId) { return __awaiter(void 0, void 0, void 0, function () {
    var removedState;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, FulfilledStates.query()["delete"]().where('subscription_id', subscriptionId)];
            case 1:
                removedState = _a.sent();
                return [2 /*return*/];
        }
    });
}); };
