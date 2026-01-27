import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db, itcDb, clientID, storeID } from "../firebase.js";

export default function useStoreSetup() {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientID || !storeID) return;

    const storeRef = doc(db, "storeData", "default");

    const bootstrap = async () => {
      const localSnap = await getDoc(storeRef);

      if (!localSnap.exists()) {
        console.log("No local store data found, fetch from ITC...")
      }
    };

    bootstrap().catch(err => {
      console.error("Store bootstrap failed:", err);
      setLoading(false);
    });

    const unsubscribe = onSnapshot(
      storeRef,
      snap => {
        setStore(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      err => {
        console.error("Store snapshot error:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return {
    store,
    storeName: !loading
      ? typeof store?.name === "string"
        ? store.name
        : store.name?.text ?? "Unknown Store"
      : "Loading...",
    loading,
    provisioned: !!store?.provisionedFromITC,
  };
}
