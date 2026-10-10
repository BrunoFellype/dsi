// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCM_WKldVxj_djECx55fI7stVL5KWUpE6M",
  authDomain: "astra-a4948.firebaseapp.com",
  projectId: "astra-a4948",
  storageBucket: "astra-a4948.firebasestorage.app",
  messagingSenderId: "543038942284",
  appId: "1:543038942284:web:16e0476e2ff243e33718e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);