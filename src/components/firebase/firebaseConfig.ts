// Firebase Config for React
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDS0csOUCeQh8W9J1g8i_dUtFWrGA7TxTc",
  authDomain: "presentpro-b7e76.firebaseapp.com",
  projectId: "presentpro-b7e76",
  storageBucket: "presentpro-b7e76.firebasestorage.app",
  messagingSenderId: "491049130415",
  appId: "1:491049130415:web:822e278e325f96cda0375a",
  measurementId:"G-30J6N4WKPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);       // ✅ Add this line
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider };
