import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getApp(name, projectId, envVar) {
  const existing = getApps().find(a => a.name === name);
  if (existing) return existing;

  const secret = process.env[envVar];
  if (!secret) throw new Error(`Missing secret: ${envVar}`);

  return initializeApp({
    credential: cert(JSON.parse(secret)),
    projectId,
  }, name);
}

export function getDb() {
  const projectId = process.env.STORE_PROJECT_ID || "instore-mason";
  if (!projectId) throw new Error("Missing secret: STORE_PROJECT_ID");
  return getFirestore(getApp("template", projectId, "TEMPLATE_SERVICE_ACCOUNT"));
}

export function getItcDb() {
  return getFirestore(getApp("itc", "itcore-7bfe2", "ITC_SERVICE_ACCOUNT"));
}

// Client email — e.g. "joe@example.com"
export function getClientId() {
  const v = process.env.CLIENT_ID;
  if (!v) throw new Error("Missing secret: CLIENT_ID");
  return v;
}

// Literal store name — e.g. "Joe's Coffee"
export function getStoreId() {
  const v = process.env.STORE_ID;
  if (!v) throw new Error("Missing secret: STORE_ID");
  return v;
}