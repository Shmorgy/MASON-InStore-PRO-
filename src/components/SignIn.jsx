import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/store", { replace: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Recovery email sent to ${email}`);
    } catch (err) {
      console.error(err);
      alert("Failed to send recovery email: " + err.message);
    }
  };

  return (
    <div className="auth-page flex-center">
      <form onSubmit={submit} className="auth-form">
        <h2 className="auth-title">Sign In</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="auth-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="auth-input"
        />

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/sign_up")}
          className="auth-button"
        >
          Create Account
        </button>

        <button
          type="button"
          onClick={forgotPassword}
          className="auth-button"
          style={{ backgroundColor: "var(--NB-color)" }}
        >
          Forgot Password?
        </button>
      </form>
    </div>
  );
}
