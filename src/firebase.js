import firebase from 'firebase/app'
import "firebase/auth";
import "firebase/firestore";
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCRCHpKaou65pBCyzuPP4Iixwbve42ib6U",
    authDomain: "chatweb-23836.firebaseapp.com",
    databaseURL: "https://chatweb-23836.firebaseio.com",
    projectId: "chatweb-23836",
    storageBucket: "chatweb-23836.appspot.com",
    messagingSenderId: "130946914648",
    appId: "1:130946914648:web:928c05e06c79a197be2d2d",
    measurementId: "G-HB3YXFX8HM"
};

export const provider = new firebase.auth.GoogleAuthProvider();

export const app = firebase.initializeApp(firebaseConfig);

export const database = app.firestore();

export const newTimestamp = firebase.firestore.FieldValue.serverTimestamp();

export const nowTimestamp = firebase.firestore.Timestamp.now();