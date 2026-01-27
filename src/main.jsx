import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { OrdersProvider } from "./context/OrdersContext.jsx";
import { StoreProvider } from "./context/StoreProvider.jsx";
import { itcFunctions } from "./firebase.js";

// PayFast engine readiness guard
window.payfastReady = false;


// Listen for the engine script to load
window.addEventListener("load", () => {
  if (window.payfast_do_onsite_payment) {
    window.payfastReady = true;
    console.log("PayFast onsite engine ready");
  }
});


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
       <HelmetProvider>
        <OrdersProvider>
          <CartProvider>
            <StoreProvider>
              <App />
            </StoreProvider>
          </CartProvider>
        </OrdersProvider>
       </HelmetProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

