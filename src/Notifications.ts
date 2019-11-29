
import NotificationService from 'node-pushnotifications'
require('dotenv').config({ path: 'variables.env' })

export const sendNotification = () => {
    const apnsDdata = {
        title: 'Testing notification',
        topic: process.env.APNS_BUNDLE_ID,
        body: 'Is it working ?',
        custom: {
          field: 'value',
        },
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

    notification.send([process.env.PUSH_TOKEN_TEST_IOS], apnsDdata)
        .then((results:any) => console.log('r',results))
        .catch((error:any) => console.log('e',error))
}