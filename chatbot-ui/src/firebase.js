// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-a4K8QQQBFGxdJHfd412qwcmqeB98-Us",
  authDomain: "ai-legal-counsellor-fyp.firebaseapp.com",
  projectId: "ai-legal-counsellor-fyp",
  storageBucket: "ai-legal-counsellor-fyp.appspot.com",
  messagingSenderId: "559816463427",
  appId: "1:559816463427:web:fc444adb2c1b224a0a0f0f6",
  measurementId: "G-PZHKMJXEXP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);