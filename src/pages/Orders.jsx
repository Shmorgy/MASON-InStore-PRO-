import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { clientID, storeID } from "../firebase.js";
import { httpsCallable } from "firebase/functions";
import { itcFunctions } from "../firebase.js";

const getOrdersFunction = httpsCallable(itcFunctions, "getOrders");
const updateOrderFunction = httpsCallable(itcFunctions, "updateOrder");

export default function OrdersPage() {
  const { isAdmin, currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [showDeliveryOnly, setShowDeliveryOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("completed"); // "pending" | "completed"
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    if (!clientID || !storeID) {
      setError("Client ID or Store ID is missing");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await getOrdersFunction({ clientId: clientID, storeId: storeID });
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

  useEffect(() => {
    if (!orders) return;
    let newOrders = [...orders];

    if (!isAdmin) {
      newOrders = newOrders.filter((o) => o.clientId === currentUser?.email);
    }
    if (showDeliveryOnly) {
      newOrders = newOrders.filter((o) => o.deliveryOption === "Delivery");
    }

    setFilteredOrders(newOrders);
  }, [orders, showDeliveryOnly, isAdmin, currentUser]);

  const pendingOrders = filteredOrders.filter((o) => o.payment_status?.toUpperCase() !== "COMPLETE");
  const completedOrders = filteredOrders.filter((o) => o.payment_status?.toUpperCase() === "COMPLETE");
  const displayedOrders = activeTab === "pending" ? pendingOrders : completedOrders;

  if (loading) return <div style={styles.centerContainer}><p>Loading orders...</p></div>;
  if (error) return <div style={styles.centerContainer}><p style={{ color: "red" }}>{error}</p></div>;

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
                style={{ marginRight: 8, display: "inline" }}
              />
              Show Delivery Orders Only
            </label>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{ ...styles.tabButton, ...(activeTab === "pending" ? styles.tabActive : styles.tabInactive) }}
            onClick={() => setActiveTab("pending")}
          >
            Pending Orders
            {pendingOrders.length > 0 && (
              <span style={styles.tabBadge}>{pendingOrders.length}</span>
            )}
          </button>
          <button
            style={{ ...styles.tabButton, ...(activeTab === "completed" ? styles.tabActive : styles.tabInactive) }}
            onClick={() => setActiveTab("completed")}
          >
            {isAdmin ? "Completed Orders" : "Order History"}
            {completedOrders.length > 0 && (
              <span style={styles.tabBadge}>{completedOrders.length}</span>
            )}
          </button>
        </div>

        {/* Order List */}
        {displayedOrders.length > 0 ? (
          displayedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isAdmin={isAdmin}
              clientID={clientID}
              storeID={storeID}
              onUpdate={loadOrders}
            />
          ))
        ) : (
          <p style={styles.emptyMessage}>No {activeTab} orders to show.</p>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, isAdmin, clientID, storeID, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const isComplete = order.payment_status?.toUpperCase() === "COMPLETE";
  const isFulfilled = order.fulfilled === "true";

  const handleAction = async (fulfilled) => {
    const label = fulfilled ? "fulfilled (customer received)" : "completed";
    if (!window.confirm(`Mark order ${order.id} as ${label}?`)) return;

    try {
      setLoading(true);
      const result = await updateOrderFunction({
        orderId: order.id,
        clientId: clientID,
        storeId: storeID,
        fulfilled: fulfilled ? "true" : "true", // both actions set fulfilled=true for now
      });

      if (result.data.success) {
        alert(`Order marked as ${label}`);
        onUpdate();
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
        <div><strong>Order ID:</strong> {order.id}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ ...styles.statusBadge, backgroundColor: isComplete ? "#4CAF50" : "#FFA500" }}>
            Payment: {order.payment_status || "AWAITING"}
          </span>
          <span style={{ ...styles.statusBadge, backgroundColor: isFulfilled ? "#4CAF50" : "#ff6a00" }}>
            Fulfilled: {order.fulfilled?.toUpperCase() || "UNKNOWN"}
          </span>
        </div>
      </div>

      <div style={styles.orderDetail}><strong>Customer:</strong> {order.firstName} {order.lastName}</div>
      <div style={styles.orderDetail}><strong>Total:</strong> R{order.total ?? 0}</div>
      <div style={styles.orderDetail}>
        <strong>Method:</strong> {order.deliveryOption}
        {order.deliveryOption === "Delivery" && order.address ? ` | Address: ${order.address}` : ""}
      </div>

      <div style={styles.orderDetail}>
        <strong>Items:</strong>
        <ul style={styles.itemsList}>
          {order.items?.map((item, index) => (
            <li key={item.productId || index} style={styles.itemRow}>
              {item.imageUrls?.[0] && (
                <img src={item.imageUrls[0]} alt={item.productName || item.name} style={styles.itemImage} />
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
          
          {/* Pending: not paid, not fulfilled → Mark Completed */}
          {!isComplete && !isFulfilled && (
            <button
              onClick={() => handleAction(false)}
              disabled={loading}
              style={{ ...styles.button, ...styles.completeButton, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Processing..." : "Mark as Fulfilled (Customer Received)"}
            </button>
          )}
          {/* Completed: paid, not yet fulfilled → Mark Fulfilled */}
          {isComplete && !isFulfilled && (
            <button
              onClick={() => handleAction(true)}
              disabled={loading}
              style={{ ...styles.button, ...styles.fulfillButton, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Processing..." : "Mark as Fulfilled (Customer Received)"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: { minHeight: "100vh", padding: "20px" },
  centerContainer: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  contentContainer: {
    maxWidth: 800, margin: "0 auto", padding: 20, color: "black",
    background: "rgba(255, 255, 255, 0.14)", borderRadius: "10px", border: "1px solid var(--accent)",
  },
  filterContainer: { marginBottom: 16, display: "grid" },
  tabContainer: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid var(--accent)", paddingBottom: 0 },
  tabButton: {
    padding: "10px 20px", border: "none", borderRadius: "8px 8px 0 0",
    fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
  },
  tabActive: { backgroundColor: "var(--accent)", color: "#fff" },
  tabInactive: { backgroundColor: "rgba(255,255,255,0.2)", color: "#333" },
  tabBadge: {
    backgroundColor: "rgba(0,0,0,0.25)", color: "#fff",
    borderRadius: "999px", padding: "1px 7px", fontSize: "11px", fontWeight: "bold",
  },
  emptyMessage: { textAlign: "center", color: "#555", padding: "40px 0" },
  orderCard: { marginBottom: 10, padding: 15, border: "1px solid var(--accent)", borderRadius: 8, backgroundColor: "#ffffff94" },
  orderHeader: {
    marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #000",
    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
  },
  statusBadge: { color: "#fff", padding: "4px 10px", borderRadius: 5, fontSize: "11px", fontWeight: "bold" },
  orderDetail: { marginBottom: 8 },
  itemsList: { listStyle: "none", padding: 0, marginTop: 5 },
  itemRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  itemImage: { width: 30, height: 30, objectFit: "cover", borderRadius: 3 },
  buttonContainer: { marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" },
  button: { padding: "6px 12px", border: "none", borderRadius: 5, fontSize: "14px", fontWeight: "500" },
  completeButton: { backgroundColor: "#4CAF50", color: "#fff" },
  fulfillButton: { backgroundColor: "#55ff00", color: "#fff" },
  deleteButton: { backgroundColor: "#FF6347", color: "#fff" },
};