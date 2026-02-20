import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// -----------------------------
// Defaults / IDs
// -----------------------------

// cID = Client ID and must be lowercase
// sID = Store ID and must be literal, hence `${}`

export const cID = import.meta.env.VITE_CLIENT_ID ||"imaanjade@gmail.com";
export const sID = import.meta.env.VITE_STORE_ID || "MASON";

export const clientID = `${cID}`;
export const storeID = `${sID}`;

// -----------------------------
// Template Firebase App
// -----------------------------
const templateConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD-XizEX3Zi4q4g_6rxogYhG2JPdjxsU9Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "instore-mason.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "instore-mason",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "instore-mason.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID||"604116313071",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:604116313071:web:87fba2b9b18d0ae473cc1a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID  || "G-PL4HGX0SD8"
};

export const app = initializeApp(templateConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");
export const projectID = templateConfig.projectId;

// -----------------------------
// ITC Firebase App
// -----------------------------
const itcConfig = {
  apiKey: "AIzaSyBglTa9bB5leL9pUAwRqzp8DgQg3HYzE0c",
  authDomain: "itcore-7bfe2.firebaseapp.com",
  projectId: "itcore-7bfe2",
  storageBucket: "itcore-7bfe2.firebasestorage.app",
  messagingSenderId: "493724520192",
  appId: "1:493724520192:web:cd18e4e50070790896ade5",
};

export const itcApp = initializeApp(itcConfig, "ITCApp");
export const itcDb = getFirestore(itcApp);
export const itcFunctions = getFunctions(itcApp, "us-central1");
export const itcStorage = getStorage(itcApp );
