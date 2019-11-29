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
var SubscriptionState = require('../../db/models/subscriptionState');
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
        var storedState, lastState, stateDefinition, previousState, resolvedState, service, _subscriptionEvent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(subscriptionId, event, params);
                    return [4 /*yield*/, SubscriptionState.query().where('subscription_id', subscriptionId)];
                case 1:
                    storedState = _a.sent();
                    storedState.map(function (state) {
                        if (!lastState) {
                            lastState = state;
                        }
                        else {
                            if (lastState.id < state.id) {
                                lastState = state;
                            }
                        }
                    });
                    if (lastState) {
                        stateDefinition = lastState.state;
                        previousState = xstate_1.State.create(stateDefinition);
                        resolvedState = machine.resolveState(previousState);
                        service = xstate_1.interpret(machine).start(resolvedState);
                    }
                    else {
                        service = xstate_1.interpret(machine).start();
                    }
                    //any -> schema
                    service.onTransition(function (_state) { return __awaiter(void 0, void 0, void 0, function () {
                        var knex, options, state, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!_state.changed) return [3 /*break*/, 4];
                                    if (event.type == EventTypes.resetCycle) {
                                        clearFulfilledState(subscriptionId);
                                    }
                                    if (event.type == EventTypes.endCycle) {
                                        clearFulfilledState(subscriptionId);
                                    }
                                    knex = SubscriptionState.knex();
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    if (_state.matches({ fulfillment: States.ineligible })) {
                                        options = (machine.states.fulfillment.states.ineligible.events);
                                    }
                                    else if (_state.matches({ fulfillment: States.pending })) {
                                        options = (machine.states.fulfillment.states.pending.events);
                                    }
                                    else if (_state.matches({ fulfillment: States.initiated })) {
                                        options = (machine.states.fulfillment.states.initiated.events);
                                    }
                                    else if (_state.matches({ fulfillment: States.shipped })) {
                                        options = (machine.states.fulfillment.states.shipped.events);
                                    }
                                    else if (_state.matches({ fulfillment: States.successful })) {
                                        options = (machine.states.fulfillment.states.successful.events); //change this
                                    }
                                    else if (_state.matches({ fulfillment: States.failure })) {
                                        options = (machine.states.fulfillment.states.failure.events);
                                    }
                                    return [4 /*yield*/, objection_1.transaction(knex, function (trx) { return __awaiter(void 0, void 0, void 0, function () {
                                            var newState, fulfillmentCycleOffset, fulfilledState;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, SubscriptionState
                                                            .query(trx)
                                                            .insert({
                                                            'subscription_id': subscriptionId,
                                                            'state': _state,
                                                            'subscription_state': _state.value.subscription,
                                                            'payment_state': _state.value.payment,
                                                            'fulfillment_state': _state.value.fulfillment,
                                                            'fulfillment_options': options
                                                        })];
                                                    case 1:
                                                        newState = _a.sent();
                                                        if (!_state.matches({ fulfillment: States.successful })) return [3 /*break*/, 3];
                                                        if (!_state.context) return [3 /*break*/, 3];
                                                        fulfillmentCycleOffset = moment(Date.now()).add(_state.context.fulfillmentOffset, 'days').format();
                                                        return [4 /*yield*/, newState
                                                                .$relatedQuery('fulfilledState', trx)
                                                                .insert({
                                                                'subscription_id': subscriptionId,
                                                                'next_cycle': fulfillmentCycleOffset
                                                            })];
                                                    case 2:
                                                        fulfilledState = _a.sent();
                                                        return [2 /*return*/, fulfilledState];
                                                    case 3: return [2 /*return*/, newState];
                                                }
                                            });
                                        }); })];
                                case 2:
                                    state = _a.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    err_1 = _a.sent();
                                    console.log(err_1, 'Something went wrong. State not inserted');
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    _subscriptionEvent = event.type;
                    console.log(_subscriptionEvent);
                    service.send(_subscriptionEvent, params);
                    // Stop the service when you are no longer using it.
                    service.stop();
                    return [2 /*return*/];
            }
        });
    });
};
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
