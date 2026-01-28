import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { clientID, storeID } from "../firebase.js";
import { httpsCallable } from "firebase/functions";
import { itcFunctions } from "../firebase.js";

// Initialize the getOrders cloud function
const getOrdersFunction = httpsCallable(itcFunctions, "getOrders");

export default function OrdersPage() {
  const { isAdmin } = useAuth(); 
  const [orders, setOrders] = useState([]);
  const [showDeliveryOnly, setShowDeliveryOnly] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders when component mounts or when clientID/storeID changes
  useEffect(() => {
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

    loadOrders();
  }, [clientID, storeID]);

  // Filter orders based on delivery option
  useEffect(() => {
    if (!orders) return;
    let newOrders = [...orders];
    if (showDeliveryOnly) {
      newOrders = newOrders.filter((o) => o.deliveryOption === "Delivery");
    }
    setFilteredOrders(newOrders);
  }, [orders, showDeliveryOnly]);

  const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
  const completedOrders = filteredOrders.filter((o) => o.status === "completed");

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
                style={{ marginRight: 8 }}
              />
              Show Delivery Orders Only
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

function OrderCard({ order, isAdmin, clientID, storeID }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete order ${order.id}? This action cannot be undone.`))
      return;

    try {
      setLoading(true);
      // TODO: Implement delete order cloud function
      console.log("Delete order:", order.id, clientID, storeID);
      alert("Delete functionality not yet implemented");
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Failed to delete order. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm(`Mark order ${order.id} as completed?`)) return;

    try {
      setLoading(true);
      // TODO: Implement update order cloud function
      console.log("Update order:", order.id, clientID, storeID);
      alert("Update functionality not yet implemented");
    } catch (err) {
      console.error("Failed to update order:", err);
      alert("Failed to update order. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.orderCard}>
      <div style={styles.orderHeader}>
        <strong>Order ID:</strong> {order.id}{" "}
        <span
          style={{
            ...styles.statusBadge,
            backgroundColor: order.status === "pending" ? "#FFA500" : "#4CAF50",
          }}
        >
          {order.status?.toUpperCase() || "PENDING"}
        </span>
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
          {order.status === "pending" && (
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
              {loading ? "Processing..." : "Mark Completed"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.deleteButton,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : "Delete Order"}
          </button>
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
  },
  filterContainer: {
    marginBottom: 20,
  },
  emptyMessage: {
    textAlign: "center",
    color: "#888",
    padding: "40px 0",
  },
  orderCard: {
    marginBottom: 10,
    padding: 15,
    border: "1px solid #ccc",
    borderRadius: 8,
    backgroundColor: "#f0f8ff3a",
  },
  orderHeader: {
    marginBottom: 8,
  },
  statusBadge: {
    color: "#000",
    padding: "2px 8px",
    borderRadius: 5,
    fontSize: "12px",
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
    color: "#000",
  },
  deleteButton: {
    backgroundColor: "#FF6347",
    color: "#fff",
  },
};