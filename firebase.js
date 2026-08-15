// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDFwNH7tU993SE2FwCykgHO4USYH_wgGbk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jewellyy-99408.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jewellyy-99408",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jewellyy-99408.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "863780731460",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:863780731460:web:08adc1ded975f0819d1a11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("Firebase connected successfully!");
console.log("Firestore initialized successfully!");
console.log("Firebase Authentication initialized successfully!");

export { app, db, auth, serverTimestamp };
