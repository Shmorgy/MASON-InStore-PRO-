import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";


const firebaseConfig = {
  apiKey: "AIzaSyBglTa9bB5leL9pUAwRqzp8DgQg3HYzE0c",
  authDomain: "itcore-7bfe2.firebaseapp.com",
  projectId: "itcore-7bfe2",
  storageBucket: "itcore-7bfe2.firebasestorage.app",
  messagingSenderId: "493724520192",
  appId: "1:493724520192:web:cd18e4e50070790896ade5",
  measurementId: "G-4J61M11G0M"
};

const app = firebaseConfig;
const functions = getFunctions(app);

export default function PayfastRedirect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayNow = async () => {
    setLoading(true);
    setError("");

    try {
      // Call Firebase function to get PayFast payment data
      const initiatePayfastCallable = httpsCallable(functions, "createOrder");
      const result = await initiatePayfastCallable({
        amount: "50.00",
        item_name: "Test Product",
        email: "customer@example.com",
        returnUrl: "https://itcore-7bfe2.web.app",
        cancelUrl: "https://itcore-7bfe2.web.app",
        notifyUrl: "https://payfastipn-v3uftvqsza-uc.a.run.app"
      });

      const { paymentData, payfastUrl } = result.data;

      // Create a temporary form in the current document
      const form = document.createElement("form");
      form.method = "POST";
      form.action = payfastUrl;
      form.style.display = "none";

      for (const key in paymentData) {
        if (paymentData.hasOwnProperty(key)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = paymentData[key];
          form.appendChild(input);
        }
      }

      document.body.appendChild(form);
      form.submit(); // redirects the current page to PayFast
      document.body.removeChild(form);

    } catch (err) {
      console.error("Error initiating PayFast:", err);
      setError("Failed to start PayFast payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePayNow} disabled={loading}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
