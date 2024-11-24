var admin = require("firebase-admin");
var serviceAccount = require("./decoraition-firebase-adminsdk-g54wj-536e1e1fae.json");

const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const adminAuth = adminApp.auth();
const adminDb = adminApp.firestore();

module.exports = { adminApp, adminAuth, adminDb };
