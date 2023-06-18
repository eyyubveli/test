const admin = require("firebase-admin");
const serviceAccount = require("./config.json")

admin.initializeApp({
    credential : admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();  
const userRef = firestore.collection('users').doc();
const timeStamp = admin.firestore.FieldValue.serverTimestamp();

export {userRef , timeStamp}