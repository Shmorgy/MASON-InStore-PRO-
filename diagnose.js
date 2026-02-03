import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

console.log("🔹 Starting diagnostic function module...");

try {
  if (!getApps().length) {
    console.log("🔹 Initializing Firebase app...");
    initializeApp();
  }

  const db = getFirestore();
  console.log("🔹 Firestore initialized successfully");

} catch (err) {
  console.error("❌ Error initializing Firebase:", err);
}

export const healthCheck = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "128MiB",
  },
  async (req, res) => {
    console.log("🔹 healthCheck function invoked");

    try {
      // Minimal Firestore read test
      const testRef = getFirestore().collection("diagnose").doc("test");
      const doc = await testRef.get();

      if (doc.exists) {
        console.log("🔹 Found test doc:", doc.data());
      } else {
        console.log("🔹 Test doc does not exist (expected for first run)");
      }

      res.status(200).send("✅ Functions module loaded and Firestore reachable");
    } catch (err) {
      console.error("❌ healthCheck runtime error:", err);
      res.status(500).send("❌ Functions failed at runtime: " + err.message);
    }
  }
);
