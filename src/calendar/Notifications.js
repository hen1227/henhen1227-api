import dotenv from 'dotenv';
import apn from 'apn';
import admin from 'firebase-admin';
import {Club, DeviceToken, User} from "../models/Models.js";
import serviceAccount from '../../.secrets/google-services.json' assert { type: 'json' };
import webpush from "web-push";
dotenv.config();

// MARK: Web Push

const vapidPublicKey = process.env.WEBPUSH_PUBLIC_KEY;
const vapidPrivateKey = process.env.WEBPUSH_PRIVATE_KEY;

console.log(vapidPublicKey);
console.log(vapidPrivateKey);
webpush.setVapidDetails(
    'mailto:henry@henhen1227.com',
    vapidPublicKey,
    vapidPrivateKey
);

const sendToWebPush = (tokenData, dataToSend = 'I don\'t know why ur seeing this.') => {
    const subscription = JSON.parse(tokenData);

    webpush.sendNotification(subscription, dataToSend).catch(error => {
        console.error(error.stack);
    });
}

// dont forget export GOOGLE_APPLICATION_CREDENTIALS="/Users/henryabrahamsen/WebstormProjects/henhen1227-api/.secrets/google-services.json"
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://henhen1227-calendar.firebaseio.com'
});

function sendToFCM(deviceToken, message) {
    const payload = {
        notification: {
            title: 'Calendar',
            body: message
        }
    };

    admin.messaging().sendToDevice(deviceToken, payload)
        .then(response => {
            console.log('Successfully sent message:', response);
        })
        .catch(error => {
            console.log('Error sending message:', error);
        });
}

// MARK: APN
// APNs Configuration
const apnProvider = new apn.Provider({
    token: {
        key: ".secrets/AuthKey_5QP84X4Q4V.p8",
        keyId: "5QP84X4Q4V",
        teamId: "5BHAWQJGY5"
    },
    production: process.env.PRODUCTION_ENVIRONMENT // set to true when in production environment
});

function sendToAPNs(deviceToken, message) {
    let note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600*24*3;
    note.alert = message;
    note.topic = "com.henhen1227.calendar";

    apnProvider.send(note, deviceToken).then(result => {
        console.log(result.sent);
        console.log(result.failed);
    }).catch(error => {
        console.log(error);
    });
}

export async function sendNotificationTo(message, token, platform) {
    try {
        if(platform === 'ios') {
            await sendToAPNs(token, message);
        } else if (platform === 'Android') {
            await sendToFCM(token, message);
        }
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

export async function sendNotificationToAllDevices(message) {
    try {
        const tokens = await DeviceToken.findAll();

        const iosTokens = tokens
            .filter(token => token.platform === 'ios')
            .map(token => token.token);

        const androidTokens = tokens
            .filter(token => token.platform === 'Android')
            .map(token => token.token);

        if(iosTokens.length > 0) {
            // Send notifications to iOS devices
            const note = new apn.Notification();
            note.alert = message;
            note.topic = "com.henhen1227.calendar";
            note.sound = "default";
            apnProvider.send(note, iosTokens).then(result => {
                console.log(result.sent);
                console.log(result.failed);
            }).catch(error => {
                console.log(error);
            });
        }

        if (androidTokens.length > 0) {
            // Send notifications to Android devices
            const androidMessage = {
                notification: {
                    title: 'Notification Title',
                    body: message
                },
                tokens: androidTokens
            };

            await admin.messaging().sendEachForMulticast(androidMessage);
        }
        console.log('Notifications sent successfully.');
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

export async function sendNotificationToClubMembers(message, clubId) {
    try {
        const allTokens = await DeviceToken.findAll();
        console.log(allTokens)

        for (let token of allTokens) {
            const user = await User.findByPk(token.userId, {
                include: [
                    {
                        model: Club,
                        as: 'SubscribedClubs',
                    }
                ]
            });
            // console.log("user: ", user)
            // console.log("token: ", token)
            if (user) {
                const clubs = user.SubscribedClubs.map(club => club.id);
                // console.log("clubs: ", clubs)
                if (clubs.includes(clubId)) {
                    if (token.platform === 'ios') {
                        await sendToAPNs(token.token, message);
                    } else if (token.platform === 'Android') {
                        await sendToFCM(token.token, message);
                    }else if (token.platform === 'web') {
                        await sendToWebPush(token.token, message);
                    }
                }
            }
        }
        console.log('Notifications sent successfully.');
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}


// Test notifications
// setTimeout(async () => {
//     await sendNotificationToClubMembers("Hello world!", 7);
// }, 2000);
