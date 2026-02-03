import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { clientID, storeID } from "../firebase.js";
import { httpsCallable } from "firebase/functions";
import { itcFunctions } from "../firebase.js";

// Initialize cloud functions
const getOrdersFunction = httpsCallable(itcFunctions, "getOrders");
const updateOrderFunction = httpsCallable(itcFunctions, "updateOrder");


export default function OrdersPage() {
  const { isAdmin } = useAuth(); 
  const [orders, setOrders] = useState([]);
  const [showDeliveryOnly, setShowDeliveryOnly] = useState(false);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders when component mounts or when clientID/storeID changes
  const loadOrders = async () => {
    if (!clientID || !storeID) {
      setError("Client ID or Store ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Call the cloud function to fetch orders
      const result = await getOrdersFunction({
        clientId: clientID,
        storeId: storeID
      });

      console.log("Raw result:", result);
      console.log("Orders data:", result.data);

      setOrders(result.data || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [clientID, storeID]);

  // Filter orders based on delivery option
  useEffect(() => {
    if (!orders) return;
    let newOrders = [...orders];
    if (showDeliveryOnly) {
      newOrders = newOrders.filter((o) => o.deliveryOption === "Delivery");
    }
    if (showPendingOnly) {
      newOrders = newOrders.filter((o) => o.status === "pending");
    }
    setFilteredOrders(newOrders);
  }, [orders, showDeliveryOnly, showPendingOnly]);

  const pendingOrders = filteredOrders.filter((o) => o.payment_status === "awaiting_payment");
  const completedOrders = filteredOrders.filter((o) => o.payment_status === "complete");

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentContainer}>
        <h1>{isAdmin ? "Admin Dashboard" : "Your Orders"}</h1>

        {isAdmin && (
          <div style={styles.filterContainer}>
            <label>
              <input
                type="checkbox"
                checked={showDeliveryOnly}
                onChange={() => setShowDeliveryOnly((prev) => !prev)}
                style={{ marginRight: 8,display:"inline"}}
              />
              Show Delivery Orders Only
            </label>
            <label>
              <input
                type="checkbox"
                checked={showPendingOnly}
                onChange={() => setShowPendingOnly((prev) => !prev)}
                style={{ marginRight: 8, display:"inline" }}
              />
              Show Pending Orders Only
            </label>
          </div>
        )}

        {pendingOrders.length > 0 && (
          <>
            <h2>Pending Orders</h2>
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isAdmin={isAdmin}
                clientID={clientID}
                storeID={storeID}
                onUpdate={loadOrders}
              />
            ))}
          </>
        )}

        {completedOrders.length > 0 && (
          <>
            <h2 style={{ marginTop: 30 }}>
              {isAdmin ? "Completed Orders" : "Order History"}
            </h2>
            {completedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isAdmin={isAdmin}
                clientID={clientID}
                storeID={storeID}
                onUpdate={loadOrders}
              />
            ))}
          </>
        )}

        {filteredOrders.length === 0 && (
          <p style={styles.emptyMessage}>No orders to show.</p>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, isAdmin, clientID, storeID, onUpdate }) {
  const [loading, setLoading] = useState(false);

  

  const handleComplete = async () => {
    if (!window.confirm(`Mark order ${order.id} as completed?`)) return;

    try {
      setLoading(true);
      
      const result = await updateOrderFunction({
        orderId: order.id,  
        clientId: clientID,
        storeId: storeID,
        fulfilled: "true"
      });

      if (result.data.success) {
        alert("Order marked as completed");
        onUpdate(); // Refresh the orders list
      }
    } catch (err) {
      console.error("Failed to update order:", err);
      alert(err.message || "Failed to update order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.orderCard}>
      <div style={styles.orderHeader}>
        <div>
          <strong>Order ID:</strong> {order.id}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: order.payment_status === "COMPLETE" ? "#4CAF50" : "#FFA500",
            }}
          >
            Payment: {order.payment_status || "AWAITING"}
          </span>
          <span
            style={{
              ...styles.statusBadge,
              backgroundColor: order.fulfilled === "true" ? "#4CAF50" : "#ff6a00",
            }}
          >
            fulfilled: {order.fulfilled?.toUpperCase() || "unknown"}
          </span>
        </div>
      </div>

      <div style={styles.orderDetail}>
        <strong>Total:</strong> R{order.total ?? 0}
      </div>
      
      <div style={styles.orderDetail}>
        <strong>Method:</strong> {order.deliveryOption}
        {order.deliveryOption === "Delivery" && order.address
          ? ` | Address: ${order.address}`
          : ""}
      </div>

      <div style={styles.orderDetail}>
        <strong>Items:</strong>
        <ul style={styles.itemsList}>
          {order.items?.map((item, index) => (
            <li key={item.productId || index} style={styles.itemRow}>
              {item.imageUrls?.[0] && (
                <img
                  src={item.imageUrls[0]}
                  alt={item.productName || item.name}
                  style={styles.itemImage}
                />
              )}
              <span>
                {item.productName || item.name || "Unknown Item"} x {item.qty || item.quantity || 1}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div style={styles.buttonContainer}>
          {order.payment_status === "awaiting_payment" && order.fulfilled === "false" && (
            <button
              onClick={handleComplete}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.completeButton,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Processing..." : "Mark Order Completed"}
            </button>
          )}
          
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: "100vh",
    padding: "20px",
  },
  centerContainer: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    maxWidth: 800,
    margin: "0 auto",
    padding: 20,
    color:"BLACK",
    background:"rgba(255, 255, 255, 0.14)",
    borderRadius:"10px",
    border:"1px solid var(--accent)"
  },
  filterContainer: {
    marginBottom: 20,
    display:"grid"
  },
  emptyMessage: {
    textAlign: "center",
    color: "#ffffff",
    padding: "40px 0",
  },
  orderCard: {
    marginBottom: 10,
    padding: 15,
    border: "1px solid var(--accent)",
    borderRadius: 8,
    backgroundColor: "#ffffff94",
  },
  orderHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: "1px solid #000000",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8
  },
  statusBadge: {
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 5,
    fontSize: "11px",
    fontWeight: "bold",
  },
  orderDetail: {
    marginBottom: 8,
  },
  itemsList: {
    listStyle: "none",
    padding: 0,
    marginTop: 5,
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  itemImage: {
    width: 30,
    height: 30,
    objectFit: "cover",
    borderRadius: 3,
  },
  buttonContainer: {
    marginTop: 12,
    display: "flex",
    gap: 8,
  },
  button: {
    padding: "6px 12px",
    border: "none",
    borderRadius: 5,
    fontSize: "14px",
    fontWeight: "500",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
    color: "#fff",
  },
  deleteButton: {
    backgroundColor: "#FF6347",
    color: "#fff",
  },
};