// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyCPLzgm3_zEogrLB3KRjN6y101EwleIpe8",
    authDomain: "astra-795be.firebaseapp.com",
    databaseURL: "https://astra-795be-default-rtdb.firebaseio.com",
    projectId: "astra-795be",
    storageBucket: "astra-795be.firebasestorage.app",
    messagingSenderId: "767365236599",
    appId: "1:767365236599:web:d2b904ccc9e1a119e58372"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };