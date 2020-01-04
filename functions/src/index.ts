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

export const getBostonAreaWeather = functions.https.onRequest((req, res) => {
    admin.firestore().doc('areas/greater-boston').get()
        .then(areaSnapshot => {
            const cities = areaSnapshot.data()?.cities
            const promises = []
            for (const city in cities) {
                const p = admin.firestore().doc(`cities-weather/${city}`).get()
                promises.push(p)
            }
            return Promise.all(promises)
        })
        .then(citySnapshots => {
            const results: (FirebaseFirestore.DocumentData | undefined)[] = []
            citySnapshots.forEach(citySnap => {
                const data = citySnap.data()
                data!.city = citySnap.id
                results.push(data)
            })
            res.send(results)
        })
        .catch(error => {
            console.log(error)
            res.status(500).send(error)
        })
})

export const getBostonWheather = functions.https.onRequest((request, response) => {
    admin.firestore().doc('cities-weather/boston-ma-us').get()
        .then(snapshot => {
            console.log(snapshot.data(), 'test dsf woi')
            response.send(snapshot.data())
        })
        .catch(error => {
            console.log(error)
            response.status(500).send("Hello from Firebase!" + error);
        })
});
