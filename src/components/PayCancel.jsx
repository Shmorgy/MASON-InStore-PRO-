import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PayCancel() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const orderId = params.get("order");

  useEffect(() => {
    console.log("Payment cancelled for order:", orderId);
  }, [orderId]);

  return (
    <div style={{ padding: "32px", textAlign: "center" }}>
      <h1>Payment Cancelled</h1>
      <p>Your order {orderId} was not completed.</p>
      <button onClick={() => navigate("/cart")}>Back to Cart</button>
    </div>
  );
}
