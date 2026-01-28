import React, { useMemo, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { storeID, clientID, itcFunctions } from "../firebase.js";
import { validateCheckoutTotal } from "../utils/validateCheckoutTotals.js";
import { httpsCallable } from "firebase/functions";

const createOrderFN = httpsCallable(itcFunctions, "createOrder");

export default function Checkout() {
  const { cart } = useCart();
  const { user } = useAuth();

  const [method, setMethod] = useState("Delivery");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState(user?.displayName?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.displayName?.split(" ")[1] || "");
  const [cell, setCell] = useState(user?.phoneNumber || "");
  const [paymentMethod, setPaymentMethod] = useState("cc");
  const [paymentType, setPaymentType] = useState("one-time");
  const [subscriptionAmount, setSubscriptionAmount] = useState("");
  const [subscriptionFrequency, setSubscriptionFrequency] = useState(3); // 3=monthly
  const [subscriptionCycles, setSubscriptionCycles] = useState(12);
  const [loading, setLoading] = useState(false);

  const normalizedCart = useMemo(() => {
    if (!cart) return [];
    return cart.map((item) => {
      const priceCents = Math.round(Number(item.price || 0) * 100);
      const qty = Number(item.quantity || item.qty || 1);
      return { ...item, priceCents, qty, lineTotalCents: priceCents * qty };
    });
  }, [cart]);

  const totalCents = normalizedCart.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const totalFormatted = (totalCents / 100).toFixed(2);

  const handleCheckout = async () => {
    if (loading) return;

    if (!normalizedCart.length) return alert("Your cart is empty");
    if (!email || !email.includes("@")) return alert("Please enter a valid email address");
    if (method === "Delivery" && !address.trim()) return alert("Delivery address is required");

    if (paymentType === "subscription") {
      if (!subscriptionAmount || Number(subscriptionAmount) <= 0) {
        return alert("Enter a valid subscription amount");
      }
      // PayFast subscription frequency must be 3, 4, 5, or 6
      const freq = Number(subscriptionFrequency);
      if (![3, 4, 5, 6].includes(freq)) {
        return alert("Frequency must be 3 (monthly), 4 (quarterly), 5 (biannual), or 6 (annual)");
      }
    }

    setLoading(true);

    try {
      // Prepare cart for validation - include productId
        const cartForValidation = normalizedCart.map((item) => ({
          productId: item.id || item.productId,
          qty: item.qty,
        }));

        // Validate and get line items with proper product names from database
        const validationResult = await validateCheckoutTotal(storeID, cartForValidation);

        console.log("Validation result:", validationResult);

      // Use the validated line items (which include product names from the database)
        const backendCart = validationResult.lineItems.map((item) => ({
          productName: item.productName,
          productId: item.productId,
          qty: item.qty,
          price: Number(item.price),
          lineTotal: Number(item.lineTotal),
        }));

        const payload = {
          storeId: storeID,
          clientId: clientID,
          cart: backendCart,
          customer: {
            email,
            uid: user?.uid || null,
            firstName,
            lastName,
            cell,
          },
          delivery: method === "Delivery" ? { method, address } : { method },
          paymentMethod,
          sandbox: false, // Changed to true for testing
          storeurl : window.location.origin,
        };

      if (paymentType === "subscription") {
        payload.subscription = {
          amount: Number(subscriptionAmount).toFixed(2),
          frequency: Number(subscriptionFrequency),
          cycles: Number(subscriptionCycles),
        };
      }

      console.log("Sending payload:", payload);

      const res = await createOrderFN(payload);
      const { pfData, pfEndpoint } = res.data;
      if (!pfData || !pfEndpoint) throw new Error("Incomplete payment data");

      console.log("Received pfData:", pfData);

      // Build form dynamically
      const form = document.createElement("form");
      form.method = "POST";
      form.action = pfEndpoint;
      form.style.display = "none";

      // Include ALL fields from pfData
      Object.entries(pfData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      
      console.log("Submitting form with fields:", Array.from(form.elements).map(el => ({ name: el.name, value: el.value })));
      
      form.submit();
    } catch (err) {
      console.error("Checkout failed:", err);
      alert(err?.message || "Unexpected checkout error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Checkout</h2>

          <label style={styles.label}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />

          <label style={styles.label}>First Name</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={styles.input} />

          <label style={styles.label}>Last Name</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={styles.input} />

          <label style={styles.label}>Phone Number</label>
          <input type="text" value={cell} onChange={(e) => setCell(e.target.value)} style={styles.input} />

          <label style={styles.label}>Delivery Method</label>
          <div style={styles.buttonGroup}>
            {["Delivery", "Pickup"].map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)} style={{
                ...styles.optionButton,
                ...(method === m ? styles.optionActive : {}),
              }}>{m}</button>
            ))}
          </div>

          {method === "Delivery" && (
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" style={styles.input} />
          )}

          

          {paymentType === "subscription" && (
            <>
              <label style={styles.label}>Subscription Amount</label>
              <input type="number" value={subscriptionAmount} onChange={(e) => setSubscriptionAmount(e.target.value)} style={styles.input} />

              <label style={styles.label}>Frequency</label>
              <select value={subscriptionFrequency} onChange={(e) => setSubscriptionFrequency(e.target.value)} style={styles.input}>
                <option value="3">Monthly (3)</option>
                <option value="4">Quarterly (4)</option>
                <option value="5">Biannual (5)</option>
                <option value="6">Annual (6)</option>
              </select>

              <label style={styles.label}>Cycles (total payments)</label>
              <input type="number" value={subscriptionCycles} onChange={(e) => setSubscriptionCycles(e.target.value)} style={styles.input} />
            </>
          )}

          

          <h3 style={styles.total}>Total: R{totalFormatted}</h3>

          <button onClick={handleCheckout} disabled={loading} style={{
            ...styles.checkoutButton,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer"
          }}>{loading ? "Processing..." : "Proceed to Payment"}</button>
        </div>

        <div style={styles.card}>
          <h2 style={styles.heading}>Your Cart</h2>
          {normalizedCart.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center", padding: 20 }}>Your cart is empty</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {normalizedCart.map((item, idx) => (
                <li key={item.id || idx} style={styles.cartItem}>
                  <span style={{ flex: 1 }}>{item.name} <span style={{ color: "#888" }}>× {item.qty}</span></span>
                  <span style={{ fontWeight: "600" }}>R{(item.lineTotalCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { 
    padding: 20, 
    color: "#fff", 
    maxWidth: 1200, 
    margin: "0 auto",
    minHeight: "80vh" 
  },
  grid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
    gap: 24,
    alignItems: "start"
  },
  card: {
    background: "rgba(30,30,30,0.8)",
    backdropFilter: "blur(10px)",
    borderRadius: 12,
    padding: 24,
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  },
  heading: { 
    marginTop: 0, 
    borderBottom: "1px solid #444", 
    paddingBottom: 10,
    fontSize: 24,
    fontWeight: "600"
  },
  label: { 
    display: "block", 
    marginBottom: 5,
    marginTop: 15,
    fontSize: 14, 
    color: "#aaa",
    fontWeight: "500"
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 5,
    borderRadius: 6,
    border: "1px solid #444",
    background: "#111",
    color: "#fff",
    fontSize: 14,
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  },
  buttonGroup: {
    display: "flex",
    gap: 10,
    marginBottom: 5
  },
  paymentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: 10,
    marginBottom: 5
  },
  optionButton: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 6, 
    cursor: "pointer", 
    background: "#222", 
    color: "#fff", 
    border: "1px solid #444",
    transition: "all 0.2s",
    fontSize: 14,
    fontWeight: "500"
  },
  optionActive: { 
    background: "#fff", 
    color: "#000", 
    fontWeight: "bold",
    border: "1px solid #fff"
  },
  total: { 
    textAlign: "right", 
    fontSize: 24, 
    margin: "30px 0 20px",
    color: "#4CAF50",
    fontWeight: "700"
  },
  checkoutButton: { 
    width: "100%", 
    padding: 16, 
    borderRadius: 8, 
    background: "linear-gradient(135deg, #0070f3 0%, #0051cc 100%)", 
    color: "#fff", 
    border: "none", 
    fontSize: 16,
    fontWeight: "600",
    transition: "all 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  },
  cartItem: { 
    display: "flex", 
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0", 
    borderBottom: "1px solid #333",
    gap: 10
  },
};