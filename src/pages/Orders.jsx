import React, { useState, useEffect } from "react";
import { useOrders } from "../context/OrdersContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function OrdersPage() {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();
  const { isAdmin } = useAuth();
  const [showDeliveryOnly, setShowDeliveryOnly] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    if (!orders) return;
    let newOrders = [...orders];
    if (showDeliveryOnly) {
      newOrders = newOrders.filter(o => o.deliveryOption === "Delivery");
    }
    setFilteredOrders(newOrders);
  }, [orders, showDeliveryOnly]);

  const pendingOrders = filteredOrders.filter(o => o.status === "pending");
  const completedOrders = filteredOrders.filter(o => o.status === "completed");

  return (
    <div style={{ height: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
        <h1>{isAdmin ? "Admin Dashboard" : "Your Orders"}</h1>

        {isAdmin && (
          <div style={{ marginBottom: 20 }}>
            <label>
              <input
                type="checkbox"
                checked={showDeliveryOnly}
                onChange={() => setShowDeliveryOnly(prev => !prev)}
                style={{ marginRight: 8 }}
              />
              Show Delivery Orders Only
            </label>
          </div>
          
        )}

        {pendingOrders.length > 0 && (
          <>
            <h2>Pending Orders</h2>
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                isAdmin={isAdmin}
                updateOrderStatus={updateOrderStatus}
                deleteOrder={deleteOrder}
              />
            ))}
          </>
        )}

        {completedOrders.length > 0 && (
          <>
            <h2 style={{ marginTop: 30 }}>{isAdmin ? "Completed Orders" : "Order History"}</h2>
            {completedOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                isAdmin={isAdmin}
                updateOrderStatus={updateOrderStatus}
                deleteOrder={deleteOrder}
              />
            ))}
          </>
        )}

        {filteredOrders.length === 0 && <p>No orders to show.</p>}
      </div>
    </div>
  );
}

function OrderCard({ order, isAdmin, updateOrderStatus, deleteOrder }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete order ${order.id}? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      await deleteOrder(order.id); // assumes deleteOrder returns a promise
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
      await updateOrderStatus(order.id, "completed");
    } catch (err) {
      console.error("Failed to update order:", err);
      alert("Failed to update order. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div
      style={{
        marginBottom: 10,
        padding: 10,
        border: "1px solid #ccc",
        borderRadius: 5,
        backgroundColor: "#f0f8ff3a", // same for pending & completed
      }}
    >
      <div>
        <strong>Order ID:</strong> {order.id}{" "}
        <span
          style={{
            backgroundColor: order.status === "pending" ? "#FFA500" : "#4CAF50",
            color: "#000",
            padding: "2px 8px",
            borderRadius: 5,
          }}
        >
          {order.status?.toUpperCase() || "PENDING"}
        </span>
      </div>

      <div><strong>Total:</strong> R{order.total ?? 0}</div>
      <div>
        <strong>Method:</strong> {order.deliveryOption}
        {order.deliveryOption === "Delivery" && order.address ? ` | Address: ${order.address}` : ""}
      </div>

      <div>
        <strong>Items:</strong>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 5 }}>
          {order.items?.map((item) => (
            <li
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              {item.imageUrls?.[0] && (
                <img
                  src={item.imageUrls[0]}
                  alt={item.name}
                  style={{ width: 30, height: 30, objectFit: "cover", borderRadius: 3 }}
                />
              )}
              <span>{item.name} x {item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          {order.status === "pending" && (
            <button
              onClick={handleComplete}
              disabled={loading}
              style={{
                padding: "6px 12px",
                backgroundColor: "#4CAF50",
                color: "#000",
                border: "none",
                borderRadius: 5,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Processing..." : "Mark Completed"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#FF6347",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : "Delete Order"}
          </button>
        </div>
      )}
    </div>
    </>
  );
}
