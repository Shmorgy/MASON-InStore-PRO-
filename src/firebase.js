import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// -----------------------------
// Defaults / IDs
// -----------------------------
export const clientID = "imaan";
export const storeID = "mason";

// -----------------------------
// Template Firebase App
// -----------------------------
const templateConfig = {
  apiKey: "AIzaSyD-XizEX3Zi4q4g_6rxogYhG2JPdjxsU9Y",
  authDomain: "instore-mason.firebaseapp.com",
  projectId: "instore-mason",
  storageBucket: "instore-mason.firebasestorage.app",
  messagingSenderId: "604116313071",
  appId: "1:604116313071:web:87fba2b9b18d0ae473cc1a",
  measurementId: "G-PL4HGX0SD8"
};

export const templateApp = initializeApp(templateConfig, "TemplateApp");
export const db = getFirestore(templateApp);
export const auth = getAuth(templateApp);
export const storage = getStorage(templateApp);
export const functions = getFunctions(templateApp, "us-central1");

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
