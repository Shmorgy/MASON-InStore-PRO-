import * as functions from "firebase-functions";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const itcApp = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "itcore-7bfe2"
}, "itcApp");

export const bootstrapStore = functions.https.onCall(async (data, context) => {
  console.log("=== BOOTSTRAP FUNCTION CALLED ===");
  console.log("Received data:", JSON.stringify(data));
  console.log("Context auth:", context.auth);
  
  const { clientID, storeID } = data;
  
  console.log("Extracted clientID:", clientID);
  console.log("Extracted storeID:", storeID);

  if (!clientID || !storeID) {
    console.error("VALIDATION FAILED - Missing required fields");
    throw new functions.https.HttpsError(
      "invalid-argument",
      "clientID and storeID are required"
    );
  }

  try {
    const db = admin.firestore();
    const storeRef = db.doc("storeData/default");
    
    console.log("Checking if storeData/default exists...");
    const storeSnap = await storeRef.get();

    if (storeSnap.exists) {
      console.log("Store already provisioned");
      return { success: true, alreadyProvisioned: true };
    }

    console.log(`Fetching from ITC: clients/${clientID}/clientStores/${storeID}`);
    const itcDb = admin.firestore(itcApp);
    const itcRef = itcDb.doc(`clients/${clientID}/clientStores/${storeID}`);
    const itcSnap = await itcRef.get();

    if (!itcSnap.exists) {
      console.error(`ITC store not found at: clients/${clientID}/clientStores/${storeID}`);
      throw new functions.https.HttpsError(
        "not-found", 
        `ITC store does not exist at clients/${clientID}/clientStores/${storeID}`
      );
    }

    console.log("ITC store found, writing to local Firestore...");
    const itcData = itcSnap.data();
    console.log("ITC data keys:", Object.keys(itcData));
    
    await storeRef.set({
      ...itcData,
      provisionedFromITC: true,
      provisionedAt: admin.firestore.FieldValue.serverTimestamp(),
      itcClientId: clientID,
      itcStoreId: storeID,
    });

    console.log("Bootstrap completed successfully");
    return { success: true };
  } catch (error) {
    console.error("Bootstrap error:", error);
    throw error;
  }
});