// src/firebase.js
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAjFHv1jOhULNpvcY4-SdR6zB8-U1-Sx6Q",
    authDomain: "salchipapon.firebaseapp.com",
    projectId: "salchipapon",
    storageBucket: "salchipapon.firebasestorage.app",
    messagingSenderId: "590878913280",
    appId: "1:590878913280:web:ad8d3fb7d39b1c48db39e5",
    measurementId: "G-39KL5ZL7G7"
};

const app = initializeApp(firebaseConfig);

// Exportar Firestore y Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
