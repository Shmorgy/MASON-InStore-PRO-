import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useOrders } from "../context/OrdersContext.jsx";
import { useNavigate } from "react-router-dom";
import { PP } from "./ProfilePic.jsx";

export default function Profile() {
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  const nav = useNavigate();

  const [profilePic, setProfilePic] = useState(user?.photoURL || "/placeholder-profile.png");
  const [loyaltyPoints, setLoyaltyPoints] = useState(1200); // Mock
  const [tier, setTier] = useState("Gold");
  const [specialDeals, setSpecialDeals] = useState([
    { id: 1, title: "10% off next purchase" },
    { id: 2, title: "Free shipping for 1 month" },
  ]);

  if (!user) return <p>Loading profile...</p>;

  const handleLogout = async () => {
    await logout();
    nav("/");
  };

  const cardStyle = {
    backgroundColor: "#ffffff0c",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
    transition: "transform 0.2s",
    color:"black"
  };

  return (
    <>
    <div style={{ maxWidth: "100vw", margin: "0 0", padding: "auto", backgroundColor:"rgba(255, 255, 255, 0.39)" }}>
      {/* Profile Header */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "2rem" }}>
        <PP currentPic={profilePic} onChange={setProfilePic} />

        <div style={{ flex: 1, minWidth: "200px" }}>
          <h2 style={{ margin: 0 }}>{user.displayName || "Anonymous User"}</h2>
          <p style={{ margin: "0.25rem 0", color: "#000000ff" }}>{user.email}</p>
          <button
            onClick={handleLogout}
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem 1.5rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Loyalty Program */}
      <section style={cardStyle}>
        <h3>Loyalty Program</h3>
        <p>Points: <strong>{loyaltyPoints}</strong></p>
        <p>Tier: <strong>{tier}</strong></p>
      </section>

      {/* Order History */}
      <section style={cardStyle}>
        <h3>Order History</h3>
        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {orders.map(order => (
              <li key={order.id} style={{ padding: "0.8rem 0", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{order.items?.map(i => i.name).join(", ")}</span>
                <span style={{ color: "#2c2c2cff" }}>{new Date(order.date).toLocaleDateString()}</span>
                <span style={{ fontWeight: "bold" }}>R{order.total}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Special Deals */}
      <section style={cardStyle}>
        <h3>Special Deals</h3>
        {specialDeals.length === 0 ? <p>No special deals available.</p> :
          <ul style={{ listStyle: "none", padding: 0 }}>
            {specialDeals.map(deal => (
              <li key={deal.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee", fontWeight: "500", color: "#333" }}>
                {deal.title}
              </li>
            ))}
          </ul>
        }
      </section>
    </div>
    </>
  );
}
