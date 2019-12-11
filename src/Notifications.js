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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var node_pushnotifications_1 = __importDefault(require("node-pushnotifications"));
var User = require('../db/models/user');
var Subscription = require('../db/models/subscription');
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes[NotificationTypes["itemShipped"] = 0] = "itemShipped";
    NotificationTypes[NotificationTypes["paymentDeclined"] = 1] = "paymentDeclined";
    NotificationTypes[NotificationTypes["subscriptionRenewalDue"] = 2] = "subscriptionRenewalDue";
    NotificationTypes[NotificationTypes["subscriptionExpired"] = 3] = "subscriptionExpired";
})(NotificationTypes = exports.NotificationTypes || (exports.NotificationTypes = {}));
exports.notifySubscriber = function (notificationEvent) { return __awaiter(void 0, void 0, void 0, function () {
    var notificationData, apnsData, settings, notification, userId, deviceToken, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(notificationEvent);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, getNotificationContent(notificationEvent)];
            case 2:
                notificationData = _a.sent();
                apnsData = {
                    title: notificationData.title,
                    topic: process.env.APNS_BUNDLE_ID,
                    body: notificationData.body,
                    custom: notificationData.data,
                    priority: 'high',
                    collapseKey: '',
                    contentAvailable: true,
                    pushType: 'alert',
                    timeToLive: 28 * 86400
                };
                settings = {
                    apn: {
                        token: {
                            key: process.env.APNS_P8.replace(/\\n/g, '\n'),
                            keyId: process.env.APNS_KEY_ID,
                            teamId: process.env.APNS_TEAM_ID
                        },
                        production: false // true for APN production environment, false for APN sandbox environment, 
                    },
                    gcm: {
                        id: process.env.FCM_API_KEY
                    },
                    isAlwaysUseFCM: false
                };
                notification = new node_pushnotifications_1["default"](settings);
                return [4 /*yield*/, getUserId(notificationEvent.subscriptionId)];
            case 3:
                userId = _a.sent();
                return [4 /*yield*/, getUserDeviceToken(userId)];
            case 4:
                deviceToken = _a.sent();
                notification.send([deviceToken], apnsData)
                    .then(function (results) { return console.log('r', results); })["catch"](function (error) { return console.log('e', error); });
                return [3 /*break*/, 6];
            case 5:
                e_1 = _a.sent();
                console.log(e_1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
var getNotificationContent = function (notificationEvent) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var notificationData, _a, productInfo, productInfo, productInfo, productInfo, e_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 10, , 11]);
                            notificationData = {
                                title: '',
                                body: '',
                                data: {}
                            };
                            _a = notificationEvent.type;
                            switch (_a) {
                                case NotificationTypes.itemShipped: return [3 /*break*/, 1];
                                case NotificationTypes.paymentDeclined: return [3 /*break*/, 3];
                                case NotificationTypes.subscriptionExpired: return [3 /*break*/, 5];
                                case NotificationTypes.subscriptionRenewalDue: return [3 /*break*/, 7];
                            }
                            return [3 /*break*/, 9];
                        case 1: return [4 /*yield*/, getProductInfo(notificationEvent.subscriptionId)];
                        case 2:
                            productInfo = _b.sent();
                            notificationData.title = 'On The Way...';
                            notificationData.body = 'Your ' + productInfo.title + ' from ' + productInfo.brand + ' has been shipped.';
                            return [3 /*break*/, 9];
                        case 3: return [4 /*yield*/, getProductInfo(notificationEvent.subscriptionId)];
                        case 4:
                            productInfo = _b.sent();
                            notificationData.title = 'Payment Declined';
                            notificationData.body = 'Payment is due for renewal of your subscription - ' + productInfo.title + ' from ' + productInfo.brand + '. Please update your card details by x date in order to continue with your subscription.';
                            return [3 /*break*/, 9];
                        case 5: return [4 /*yield*/, getProductInfo(notificationEvent.subscriptionId)];
                        case 6:
                            productInfo = _b.sent();
                            notificationData.title = 'Expired';
                            notificationData.body = 'Your subscription for' + productInfo.title + ' from ' + productInfo.brand + ' has expired. You can renew it anytime you want.';
                            return [3 /*break*/, 9];
                        case 7: return [4 /*yield*/, getProductInfo(notificationEvent.subscriptionId)];
                        case 8:
                            productInfo = _b.sent();
                            notificationData.title = 'Renewing Soon...';
                            notificationData.body = 'Your subscription for' + productInfo.title + ' from ' + productInfo.brand + ' will renew soon. You can pause this, or cancel anytime you like, before x due date.';
                            return [3 /*break*/, 9];
                        case 9:
                            resolve(notificationData);
                            return [3 /*break*/, 11];
                        case 10:
                            e_2 = _b.sent();
                            reject(e_2);
                            return [3 /*break*/, 11];
                        case 11: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
var getProductInfo = function (subscriptionId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var subscription, productInfo, e_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, Subscription.query().findById(subscriptionId)];
                        case 1:
                            subscription = _a.sent();
                            if ((subscription.title) && (subscription.brand_name)) {
                                productInfo = {
                                    title: subscription.title,
                                    brand: subscription.brand_name
                                };
                                resolve(productInfo);
                            }
                            else {
                                reject(Error('Subscription doesnt exist'));
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            e_3 = _a.sent();
                            reject(e_3);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
var getUserId = function (subscriptionId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var subscription, e_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, Subscription.query().findById(subscriptionId)];
                        case 1:
                            subscription = _a.sent();
                            if (subscription.user_id) {
                                resolve(subscription.user_id);
                            }
                            else {
                                reject(Error('Subscription doesnt exist'));
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            e_4 = _a.sent();
                            reject(e_4);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
var getUserDeviceToken = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var user, e_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, User.query().where('user_id', userId)];
                        case 1:
                            user = _a.sent();
                            if (user[0].notification_token) {
                                resolve(user[0].notification_token);
                            }
                            else {
                                reject(Error('Users device token doesnt exist'));
                            }
                            return [3 /*break*/, 3];
                        case 2:
                            e_5 = _a.sent();
                            reject(e_5);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); })];
    });
}); };
exports.test = function () { return __awaiter(void 0, void 0, void 0, function () {
    var apnsData, settings, notification;
    return __generator(this, function (_a) {
        try {
            apnsData = {
                title: "test",
                topic: process.env.APNS_BUNDLE_ID,
                body: "test",
                custom: "test",
                priority: 'high',
                collapseKey: '',
                contentAvailable: true,
                pushType: 'alert',
                timeToLive: 28 * 86400
            };
            settings = {
                apn: {
                    token: {
                        key: process.env.APNS_P8.replace(/\\n/g, '\n'),
                        keyId: process.env.APNS_KEY_ID,
                        teamId: process.env.APNS_TEAM_ID
                    },
                    production: false // true for APN production environment, false for APN sandbox environment, 
                },
                gcm: {
                    id: process.env.FCM_API_KEY
                },
                isAlwaysUseFCM: false
            };
            notification = new node_pushnotifications_1["default"](settings);
            notification.send([process.env.PUSH_TOKEN_TEST_IOS], apnsData)
                .then(function (results) { return console.log('r', results); })["catch"](function (error) { return console.log('e', error); });
        }
        catch (e) {
            console.log(e);
        }
        return [2 /*return*/];
    });
}); };
