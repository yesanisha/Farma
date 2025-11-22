// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.setUserRole = functions.auth.user().onCreate(async (user) => {
    const uid = user.uid;
    await admin.auth().setCustomUserClaims(uid, {
        role: "user",
        setup: false,
    });

    // Optional: create initial Firestore doc
    await admin.firestore().collection("users").doc(uid).set({
        email: user.email,
        name: "",
        phoneNumber: "",
        location: "",
        info: "",
        favorites: [],
    });

    return true;
});
