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
  const [loyaltyPoints, setLoyaltyPoints] = useState(0); // Mock
  const [tier, setTier] = useState("one");
  const [specialDeals, setSpecialDeals] = useState([
    { id: 1, title: "Comng soon!" }
  ]);

  if (!user) return <p>Loading profile...</p>;

  const handleLogout = async () => {
    await logout();
    nav("/");
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.21)",
    borderRadius: "12px",
    border:"1px solid rgb(0,0,0)",
    padding: "1.5rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    marginBottom: "1.5rem",
    transition: "transform 0.2s",
    color:"black",
    maxWidth:"40vw"
  };

  

  return (
    <>
    <div style={{ maxWidth: "100%", padding: "1rem",marginTop:"1rem", backgroundColor: "var(--bg)" }}>
      {/* Profile Header */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "2rem", background:"rgba(255, 255, 255, 0.13)",padding:"2vh",border:"1px solid var(--accent)", borderRadius:"10px", color:"rgb(0,0,0)" }}>
        {/*<PP currentPic={profilePic} onChange={setProfilePic} /> */}

        <div style={{ flex: 1, minWidth: "200px" }}>
          <h2 style={{ margin: 0,color: "var(--accent)" }}>{user.username || "Anonymous User"}</h2>
          <p style={{ margin: "0.25rem 0", color: "var(--accent)" }}>{user.email}</p>
          <button
            onClick={handleLogout}
            className="LB"
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    alignItems: "stretch"}}>
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
                <span style={{ color: "rgb(0, 0, 0)" }}>{new Date(order.date).toLocaleDateString()}</span>
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
              <li key={deal.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #000000", fontWeight: "500", color: "#333" }}>
                {deal.title}
              </li>
            ))}
          </ul>
        }
      </section>
      </div>
    </div>
    </>
  );
}
