import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cloud-function-for-firebase.firebaseio.com"
});

export const bostonWheather = functions.https.onRequest((request, response) => {
    admin.firestore().doc('cities-weather/boston-ma-us').get()
        .then(snapshoot => {
            console.log(snapshoot.data(), 'test dsf woi')
            response.send(snapshoot.data())
        })
        .catch(error => {
            console.log(error)
            response.status(500).send("Hello from Firebase!" + error);
        })
});
