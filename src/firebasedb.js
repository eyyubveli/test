const admin = require("firebase-admin");
const serviceAccount = require("../config.json")

admin.initializeApp({
    credential : admin.credential.cert(serviceAccount)
});

const db = admin.firestore();  
const userRef = db.collection('users');
const timeStamp = admin.firestore.FieldValue.serverTimestamp();

module.exports = {userRef , timeStamp}