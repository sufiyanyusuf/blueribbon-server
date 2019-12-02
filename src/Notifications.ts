
import NotificationService from 'node-pushnotifications'
const User = require('../db/models/user');
const Subscription = require('../db/models/subscription');

export enum NotificationTypes {
    itemShipped,
    paymentDeclined,
    subscriptionRenewalDue,
    subscriptionExpired,
}

export type NotificationEvent =
    | { type: NotificationTypes.itemShipped, subscriptionId:number }
    | { type: NotificationTypes.paymentDeclined, subscriptionId:number }
    | { type: NotificationTypes.subscriptionExpired, subscriptionId:number }
    | { type: NotificationTypes.subscriptionRenewalDue, subscriptionId:number }
  
interface NotificationData{
    title: string,
    body: string,
    data: any
}

interface ProductInfo{
    title: string,
    brand: string
}

export const notifySubscriber = async (notificationEvent:NotificationEvent) => {
    console.log(notificationEvent)
    try { 

        let notificationData:NotificationData = await getNotificationContent(notificationEvent)

        const apnsData = {
            title: notificationData.title,
            topic: process.env.APNS_BUNDLE_ID,
            body: notificationData.body,
            custom: notificationData.data,
            priority: 'high',
            collapseKey: '',
            contentAvailable: true,
            pushType: 'alert',
            timeToLive: 28 * 86400,
        };
        
        const settings = {
            apn: {
                token: {
                    key: process.env.APNS_P8.replace(/\\n/g, '\n'),
                    keyId: process.env.APNS_KEY_ID,
                    teamId: process.env.APNS_TEAM_ID,
                },
                production: false // true for APN production environment, false for APN sandbox environment, 
            },
            gcm: {
                id: process.env.FCM_API_KEY,
            },
            isAlwaysUseFCM: false, // true all messages will be sent through node-gcm (which actually uses FCM)
        };
    
        const notification = new NotificationService(settings)
        const userId = await getUserId(notificationEvent.subscriptionId)
        const deviceToken = await getUserDeviceToken(userId)
        
        notification.send([deviceToken], apnsData)
            .then((results:any) => console.log('r',results))
            .catch((error:any) => console.log('e',error))

    } catch (e) {
        console.log(e)
    }
  
}

const getNotificationContent = async (notificationEvent: NotificationEvent): Promise<NotificationData> => {
    return new Promise<NotificationData>(async (resolve, reject) => { 
        try {
            var notificationData: NotificationData = {
                title: '',
                body: '',
                data:{}
            }

            switch (notificationEvent.type) {

                case NotificationTypes.itemShipped: {
                    const productInfo = await getProductInfo(notificationEvent.subscriptionId)
                    notificationData.title = 'On The Way...'
                    notificationData.body = 'Your ' + productInfo.title + ' from ' + productInfo.brand + ' has been shipped.'
                    break
                }
                case NotificationTypes.paymentDeclined: {
                    const productInfo = await getProductInfo(notificationEvent.subscriptionId)
                    notificationData.title = 'Payment Declined'
                    notificationData.body = 'Payment is due for renewal of your subscription - ' + productInfo.title + ' from ' + productInfo.brand + '. Please update your card details by x date in order to continue with your subscription.'
                    break
                }
                case NotificationTypes.subscriptionExpired: {
                    const productInfo = await getProductInfo(notificationEvent.subscriptionId)
                    notificationData.title = 'Expired'
                    notificationData.body = 'Your subscription for' + productInfo.title + ' from ' + productInfo.brand + ' has expired. You can renew it anytime you want.'
                    break
                }
                case NotificationTypes.subscriptionRenewalDue: {
                    const productInfo = await getProductInfo(notificationEvent.subscriptionId)
                    notificationData.title = 'Renewing Soon...'
                    notificationData.body = 'Your subscription for' + productInfo.title + ' from ' + productInfo.brand + ' will renew soon. You can pause this, or cancel anytime you like, before x due date.'
                    break
                }

            }
      
            resolve (notificationData)
        }catch(e){
          reject (e)
        }
    })
}

const getProductInfo = async (subscriptionId:number): Promise<ProductInfo> => {
    
    return new Promise <ProductInfo> (async (resolve, reject) => {
        try {
            const subscription = await Subscription.query().findById(subscriptionId)
            if ((subscription.title)&&(subscription.brand_name)) { 
                const productInfo: ProductInfo = {
                    title: subscription.title,
                    brand: subscription.brand_name
                }
                resolve (productInfo)
            } else {
                reject(Error('Subscription doesnt exist'))
            }
        }catch(e){
          reject (e)
        }
      
    })

}

const getUserId = async (subscriptionId:number): Promise<string> => {
    
    return new Promise <string> (async (resolve, reject) => {
    
        try {
            const subscription = await Subscription.query().findById(subscriptionId)
            if (subscription.user_id) { 
                resolve (subscription.user_id)
            } else {
                reject(Error('Subscription doesnt exist'))
            }
        }catch(e){
          reject (e)
        }
      
    })

}

const getUserDeviceToken = async (userId: string): Promise<string> => {
    
    return new Promise <string> (async (resolve, reject) => {
    
        try {
            const user = await User.query().where('user_id', userId)
            if (user[0].notification_token) { 
                resolve (user[0].notification_token)
            } else {
                reject(Error('Users device token doesnt exist'))
            }
        }catch(e){
          reject (e)
        }
      
    })

}


export const test = async () => {
    try { 

        const apnsData = {
            title: "test",
            topic: process.env.APNS_BUNDLE_ID,
            body: "test",
            custom: "test",
            priority: 'high',
            collapseKey: '',
            contentAvailable: true,
            pushType: 'alert',
            timeToLive: 28 * 86400,
        };
        
        const settings = {
            apn: {
                token: {
                    key: process.env.APNS_P8.replace(/\\n/g, '\n'),
                    keyId: process.env.APNS_KEY_ID,
                    teamId: process.env.APNS_TEAM_ID,
                },
                production: false // true for APN production environment, false for APN sandbox environment, 
            },
            gcm: {
                id: process.env.FCM_API_KEY,
            },
            isAlwaysUseFCM: false, // true all messages will be sent through node-gcm (which actually uses FCM)
        };
    
        const notification = new NotificationService(settings)
        notification.send([process.env.PUSH_TOKEN_TEST_IOS], apnsData)
            .then((results:any) => console.log('r',results))
            .catch((error:any) => console.log('e',error))

    } catch (e) {
        console.log(e)
    }
  
}

