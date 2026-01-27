#!/usr/bin/env node
/**
 * Usage:
 *   node setAdmin.js <USER_UID> <PATH_TO_SERVICE_ACCOUNT_JSON>
 *
 * Example:
 *   node setAdmin.js n3lKfW7CLeV8vN8H8SLOeqxcvav2 ../SA/mason-service-account.json
 */

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import process from "process";

async function main() {
  const [,, uid, serviceAccountPath] = process.argv;

  if (!uid || !serviceAccountPath) {
    console.error("Usage: node setAdmin.js <USER_UID> <PATH_TO_SERVICE_ACCOUNT_JSON>");
    process.exit(1);
  }

  try {
    const absPath = path.resolve(serviceAccountPath);
    const serviceAccountRaw = fs.readFileSync(absPath, "utf8");
    const serviceAccount = JSON.parse(serviceAccountRaw);

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin SDK initialized");

    // Set custom admin claim
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Custom claim "admin" set for user: ${uid}`);

    // Optional: Test Firestore access
    const db = admin.firestore();
    try {
      const snap = await db.collection("stores").limit(5).get();
      console.log("✅ Firestore access test (first 5 stores):");
      snap.forEach(doc => console.log("  -", doc.id));
    } catch (err) {
      console.error("❌ Firestore access test failed:", err.message);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to set admin claim:", err);
    process.exit(1);
  }
}

main();
