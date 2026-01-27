import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaySuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const orderId = params.get("order");

  useEffect(() => {
    // Optional: fetch order status from your backend
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
