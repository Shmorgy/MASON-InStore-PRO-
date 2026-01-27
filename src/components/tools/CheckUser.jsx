import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

export function useAdmin() {
const [isAdmin, setIsAdmin] = useState(false);
const [loading, setLoading] = useState(true);

useEffect(() => {
const auth = getAuth();
const unsubscribe = auth.onAuthStateChanged(async (user) => {
if (user) {
try {
// Force refresh token to get latest claims
const idTokenResult = await user.getIdTokenResult(true);
setIsAdmin(!!idTokenResult.claims.admin);
} catch (err) {
console.error("Error checking admin claim:", err);
setIsAdmin(false);
}
} else {
setIsAdmin(false);
}
setLoading(false);
});

return () => unsubscribe();


}, []);

return { isAdmin, loading };
}
