// src/pages/StorePayResult.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase.js";

export default function StorePayResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const type = params.get("type"); // success or cancel
  const orderId = params.get("order");
  const clientId = params.get("clientId");
  const storeId = params.get("storeId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId || !clientId || !storeId) {
        setError("Missing payment or store information.");
        setLoading(false);
        return;
      }

      try {
        const orderRef = db
          .collection("clients")
          .doc(clientId)
          .collection("clientStores")
          .doc(storeId)
          .collection("StoreOrders")
          .doc(orderId);

        const docSnap = await orderRef.get();
        if (!docSnap.exists) {
          setError("Order not found.");
          setLoading(false);
          return;
        }

        setOrder(docSnap.data());
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order information.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, clientId, storeId]);

  const handleBackToStore = () => {
    navigate(`/store?client=${clientId}&store=${storeId}`);
  };

  if (loading) return <div style={styles.container}>Loading order...</div>;
  if (error) return <div style={styles.container}>{error}</div>;

  return (
    <div style={styles.container}>
      <h1>
        {type === "success"
          ? "Payment Successful!"
          : "Payment Cancelled or Failed"}
      </h1>

      {type === "success" && order && (
        <>
          <p>
            Thank you for your payment. Order <strong>#{orderId}</strong> has
            been processed.
          </p>

          <h2>Order Details</h2>
          <ul style={styles.orderList}>
            {order.items?.map((item, idx) => (
              <li key={idx} style={styles.orderItem}>
                {item.name || item.productId} × {item.qty || item.quantity} — R
                {((item.price || 0) * (item.qty || item.quantity)).toFixed(2)}
              </li>
            ))}
          </ul>

          <h3>
            Total: R
            {order.items
              ?.reduce(
                (sum, i) => sum + (i.price || 0) * (i.qty || i.quantity),
                0
              )
              .toFixed(2)}
          </h3>
        </>
      )}

      <button onClick={handleBackToStore} style={styles.backButton}>
        Back to Store
      </button>
    </div>
  );
}

// -------------------------------
// Styles
const styles = {
  container: {
    maxWidth: 600,
    margin: "80px auto",
    padding: 24,
    background: "rgba(52,52,52,0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: 16,
    color: "#fff",
    textAlign: "center",
  },
  orderList: {
    listStyle: "none",
    padding: 0,
    marginBottom: 16,
  },
  orderItem: {
    padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
  },
  backButton: {
    marginTop: 24,
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#3498db",
    color: "#fff",
    fontWeight: "bold",
  },
};
