import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cloud-function-for-firebase.firebaseio.com"
});

(async () => {
    await chat('pizzaChat', 'Adi', "Apaan tuu ??")
    await chat('pizzaChat', 'Deni', "Apaan tuu pizza??")
    await chat('pizzaChat', 'Rosa', "Apaan tuu coba pizza??")
    await chat('pizzaChat', 'ilham', "Apaan pizaa tuu ??")
    await chat('pizzaChat', 'alex', "Apaan tuu tooo pizza ??")
})()
    .catch(error => {
        console.log(error)
    })

async function chat(room: string, name: string, text: string) {
    const messagesRef = admin.database().ref('rooms').child(room).child('messages')
    await messagesRef.push({ name, text })
    await sleep(2000)
}
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

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
export const onMessageUpdate = functions.database.ref('/rooms/{roomId}/messages/{messageId}')
    .onUpdate((change, context) => {
        const after = change.after.val()
        const before = change.before.val()
        if (before.text === after.text) {
            console.log('Text did change')
            return null
        }
        const text = addPizzazz(after.text)
        const timeEdited = Date.now()
        return change.after.ref.update({ text, timeEdited })
    })

export const onMessageCreate = functions.database.ref('/rooms/{roomId}/messages/{messageId}')
    .onCreate((snapshot, context) => {
        const roomId = context.params.roomId
        const messageId = context.params.messageId

        console.log(`New message ${messageId} in room ${roomId}`)

        const messageData = snapshot.val()
        const text = addPizzazz(messageData.text)
        return snapshot.ref.update({ text })
    })

function addPizzazz(text: string): string {
    return text.replace(/\bpizza\b/g, '🍕')
}

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
