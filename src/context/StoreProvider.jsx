import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { db, clientID, storeID, itcDb } from "../firebase.js";
import { useAuth } from "./AuthContext.jsx";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";

const StoreContext = createContext();

/* ───────── theme helpers ───────── */

const SAFE_THEME_SHAPE = {
  backgroundType: "solid",
  backgroundValue: "",
  primaryColor: "",
  secondaryColor: "",
  fontTitle: "",
  fontText: "",
  gradientColors: {
    start: "",
    end: "",
  },
};

function normalizeTheme(input) {
  return {
    ...SAFE_THEME_SHAPE,
    ...input,
    gradientColors: {
      ...SAFE_THEME_SHAPE.gradientColors,
      ...(input?.gradientColors || {}),
    },
  };
}

function applyThemeToRoot(theme) {
  const root = document.documentElement;

  root.dataset.bgMode = theme.backgroundValue;
  root.style.setProperty("--FA-color", theme.primaryColor);
  root.style.setProperty("--FB-color", theme.secondaryColor);
  root.style.setProperty("--font-titles", theme.fontTitle);
  root.style.setProperty("--font-text", theme.fontText);
  root.style.setProperty("--top", theme.topColor);
  root.style.setProperty("--A-color", theme.accentColor);
  root.dataset.bgMode = theme.backgroundType;
  root.style.setProperty("--bg-color", theme.backgroundColor);
  root.style.setProperty(
    "--bg-gradient",
    `linear-gradient(135deg, ${theme.gradientColors.start}, ${theme.gradientColors.end})`
  );

  if (theme.backgroundType === "gradient") {
    root.style.setProperty(
      "--bg-gradient",
      `linear-gradient(var(--gradient-angle, 135deg), ${theme.gradientColors.start}, ${theme.gradientColors.end})`
    );
  } else {
    root.style.setProperty("--bg-gradient", theme.backgroundValue);
  }
}

/* ───────── provider ───────── */

export function StoreProvider({ children }) {
  const { loading: authLoading } = useAuth();
  const [store, setStore] = useState(null);
  const [storeName, setStoreName] = useState("");
  const [ready, setReady] = useState(false);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    let unsubscribe;

    const init = async () => {
      try {
        console.log("=== INIT STARTED ===");
        console.log("clientID:", clientID);
        console.log("storeID:", storeID);
        
        // Check local store first
        const defaultRef = doc(db, "storeData", "default");
        let defaultSnap = await getDoc(defaultRef);

        // If no local data, fetch from ITC
        if (!defaultSnap.exists() && !bootstrappedRef.current) {
          bootstrappedRef.current = true;
          console.log("No local store data, fetching from ITC...");
          
          try {
            // Fetch directly from ITC (public read allowed)
            const itcRef = doc(itcDb, `clients/${clientID}/clientStores/${storeID}`);
            const itcSnap = await getDoc(itcRef);

            if (!itcSnap.exists()) {
              throw new Error(`ITC store not found at clients/${clientID}/clientStores/${storeID}`);
            }

            console.log("ITC store found, copying to local Firestore...");
            const itcData = itcSnap.data();
            
            // Write to local Firestore
            await setDoc(defaultRef, {
              ...itcData,
              provisionedFromITC: true,
              provisionedAt: new Date(),
              itcClientId: clientID,
              itcStoreId: storeID,
            });

            console.log("Successfully bootstrapped from ITC");
            
            // Re-fetch the newly created document
            defaultSnap = await getDoc(defaultRef);
          } catch (itcError) {
            console.error("Failed to fetch from ITC:", itcError);
            throw itcError;
          }
        }

        if (!defaultSnap.exists()) {
          throw new Error("No default store data found after bootstrap attempt");
        }

        const defaultData = defaultSnap.data();
        console.log("Store data loaded successfully");

        // Listen to custom overrides in real-time
        const customRef = doc(db, "storeData", "custom");
        unsubscribe = onSnapshot(customRef, (customSnap) => {
          const customData = customSnap.exists() ? customSnap.data() : {};
          const merged = normalizeTheme({ ...defaultData, ...customData });
          setStore(merged);
          setStoreName(merged.name || "My Store");
          applyThemeToRoot(merged);
          setReady(true);
        });
      } catch (err) {
        console.error("Failed to load store theme:", err);
        setReady(true); // Set ready to avoid infinite loading
      }
    };

    init();

    return () => unsubscribe?.();
  }, []);

  if (authLoading) return <div>Loading store...</div>;
  if (!ready) return <div>Fetching InStore...</div>;

  return (
    <StoreContext.Provider value={{ store, storeName }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}