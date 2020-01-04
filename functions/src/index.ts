import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cloud-function-for-firebase.firebaseio.com"
});

export const onBostonWeatherUpdate =
    functions.firestore.document('cities-weather/boston-ma-us').onUpdate(change => {
        const after = change.after.data()
        const payload = {
            data: {
                temp: String(after!.temp),
                conditions: after!.conditions
            }
        }
        return admin.messaging().sendToTopic('weather_boston-ma-us', payload)
            .catch(error => {
                console.log('FCM Failed', error)
            })
    })

export const getBostonAreaWeather = functions.https.onRequest(async (req, res) => {
    try {
        const areaSnapshot = await admin.firestore().doc('areas/greater-boston').get()
        const cities = areaSnapshot.data()?.cities
        const promises = []
        for (const city in cities) {
            const p = admin.firestore().doc(`cities-weather/${city}`).get()
            promises.push(p)
        }
        const snapshots = await Promise.all(promises)
        const results: (FirebaseFirestore.DocumentData | undefined)[] = []
        snapshots.forEach(citySnap => {
            const data = citySnap.data()
            data!.city = citySnap.id
            results.push(data)
        })
        res.send(results)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }


})

export const getBostonWheather = functions.https.onRequest(async (request, response) => {
    try {
        const snapshot = await admin.firestore().doc('cities-weather/boston-ma-us').get()
        const data = snapshot.data()
        response.send(data)
    } catch (error) {
        console.log(error)
        response.status(500).send("Hello from Firebase!" + error);
    }
});
