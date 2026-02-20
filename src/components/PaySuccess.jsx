import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function PaySuccess() {
  const { clearCart } = useCart();
  

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const orderId = params.get("order");
  

  useEffect(() => {
    clearCart()
    console.log("Payment successful for order:", orderId);
  }, [orderId]);

  return (
    <div style={{ padding: "32px", textAlign: "center" }}>
      <h1>Payment Successful!</h1>
      <p>Thank you for your order {orderId}. Your payment has been received.</p>
      <button onClick={() => navigate("/orders")}>Go to My Orders</button>
    </div>
  );
}
