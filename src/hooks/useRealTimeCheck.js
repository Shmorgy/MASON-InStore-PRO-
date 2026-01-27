// src/hooks/useRealTimeCheck.jsx
import { useState, useEffect } from "react";
import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export default function useRealTimeCheck(storeId = "mainStore") {
  const [user, setUser] = useState(null);        // Firebase Auth user
  const [profile, setProfile] = useState(null);  // Firestore user profile
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("Loading..."); // Store name for all users

  // Listen to store info (available to everyone)
  useEffect(() => {
    if (!storeId) return;
    const storeRef = doc(db, "stores", storeId);
    const unsubscribeStore = onSnapshot(
      storeRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setStoreName(docSnap.data().name || "Store");
        } else {
          setStoreName("Store");
        }
      },
      (error) => {
        console.error("Error fetching store name:", error);
        setStoreName("Store");
      }
    );
    return () => unsubscribeStore();
  }, [storeId]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Check admin/superadmin claims
        const tokenResult = await currentUser.getIdTokenResult();
        setIsAdmin(tokenResult.claims.admin || tokenResult.claims.superadmin || false);

        // Listen to Firestore user profile
        const profileRef = doc(db, "users", currentUser.uid);
        const unsubscribeProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            setProfile(docSnap.exists() ? docSnap.data() : null);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setProfile(null);
            setLoading(false);
          }
        );

        // Cleanup listener on logout
        return () => unsubscribeProfile();

      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, profile, isAdmin, loading, storeName };
}
