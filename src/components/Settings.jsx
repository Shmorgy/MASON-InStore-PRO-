// src/pages/Settings.jsx
import React, { useState } from "react";
import useRealtimeCheck from "../hooks/useRealtimeCheck";
import { db } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";
import { sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../firebase.js";

export default function Settings() {
  const { user, isAdmin } = useAuth();

  // --- Store Name (live) ---
  const storeName = useRealtimeCheck();

  // Editable for admins
  const [newStoreName, setNewStoreName] = useState("");

  // --- Theme ---
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("darkMode", !prev);
      return !prev;
    });
  };

  // --- Notifications ---
  const [notifications, setNotifications] = useState(true);
  const toggleNotifications = () => setNotifications(prev => !prev);

  // --- Payment Method ---
  const [defaultPayment, setDefaultPayment] = useState("Credit Card");

  // --- Password Update ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const changePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    if (!currentPassword) {
      alert("Please enter your current password.");
      return;
    }

    setLoadingPassword(true);

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to update password: " + err.message);
    } finally {
      setLoadingPassword(false);
    }
  };

  const sendRecoveryEmail = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Recovery email sent!");
    } catch (err) {
      console.error(err);
      alert("Failed to send recovery email: " + err.message);
    }
  };

  // --- Save Store Name ---
  const saveStoreName = async () => {
    if (!isAdmin) return;
    try {
      const storeRef = doc(db, "stores", "mainStore");
      await setDoc(storeRef, { name: newStoreName }, { merge: true });
      setNewStoreName("");
      alert("Store name updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update store name.");
    }
  };

  return (
    <div style={{ maxWidth: "100vw", margin: "0 auto", padding: "2rem", fontFamily: "var(--font-text)", backgroundColor:"white" }}>
    <p style={{marginTop:"5dvh"}}></p>
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20, fontFamily: "var(--font-text)" }}>
      <h2>Settings</h2>

      

      {/* Theme */}
      <section style={{ marginBottom: 20 }}>
        <h3>Theme</h3>
        <label>
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
          Enable Dark Mode
        </label>
      </section>

      {/* Notifications */}
      <section style={{ marginBottom: 20 }}>
        <h3>Notifications</h3>
        <label>
          <input type="checkbox" checked={notifications} onChange={toggleNotifications} />
          Enable Notifications
        </label>
      </section>

      {/* Payment Method */}
      <section style={{ marginBottom: 20 }}>
        <h3>Default Payment Method</h3>
        <select value={defaultPayment} onChange={(e) => setDefaultPayment(e.target.value)} style={{ padding: 8 }}>
          <option value="Credit Card">Credit Card</option>
          <option value="PayPal">PayPal</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </section>

      {/* Password Change */}
      <section style={{ marginBottom: 20 }}>
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          style={{ padding: 8, width: "100%", marginBottom: 5 }}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ padding: 8, width: "100%", marginBottom: 5 }}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ padding: 8, width: "100%", marginBottom: 5 }}
        />
        <button
          onClick={changePassword}
          style={{ padding: "8px 16px" }}
          disabled={loadingPassword}
        >
          {loadingPassword ? "Updating..." : "Change Password"}
        </button>
      </section>

      {/* Account Recovery */}
      <section style={{ marginBottom: 20 }}>
        <h3>Account Recovery</h3>
        <button onClick={sendRecoveryEmail} style={{ padding: "8px 16px" }}>
          Send Recovery Email
        </button>
      </section>
    </div>
    </div>
  );
}
