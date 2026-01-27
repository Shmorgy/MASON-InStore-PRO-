import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase.js";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create Firestore user doc ONLY after Auth user exists
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        admin: false,
        createdAt: Date.now()
      });

      navigate("/store", { replace: true });

    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Try logging in.");
      } else {
        alert(err.message);
      }
    }
  };

  return (
    <div className="auth-page flex-center">
      <form onSubmit={submit} className="auth-form">
        <h2 className="auth-title">Sign Up</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="auth-input"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
        />

        <button type="submit" className="auth-button">Sign Up</button>

        {/* FIXED: ensure navigate is called on click, not executed at render time */}
        <button
          type="button"
          className="auth-button"
          onClick={() => navigate("/sign_in")}
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
