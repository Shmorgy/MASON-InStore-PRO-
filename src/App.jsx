import "./styles.css";
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout.jsx";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";

import Settings_Page from "./components/Settings.jsx";
import Store from "./pages/Store.jsx";
import Setup from "./components/Setup.jsx";
import Profile from "./components/Profile.jsx";
import Cart from "./components/Cart.jsx";
import Checkout from "./components/Checkout.jsx";
import Admin from "./pages/Admin.jsx";
import Orders from "./pages/Orders.jsx";

import SignIn from "./components/SignIn.jsx";
import SignUp from "./components/SignUp.jsx";

import Dummy from "./pages/dummy.jsx";

import PaySuccess from "./components/PaySuccess.jsx";
import PayCancel from "./components/PayCancel.jsx";
import StorePayResult from "./pages/storePayResult.jsx";

import ScrollToTop from "./components/ScrollTop.jsx";
import { useStore } from "./context/StoreProvider.jsx";

import PaymentSuccess from "./components/tools/paymentSuccess.jsx";
import PaymentCancelled  from "./components/tools/paymentCancelled.jsx";

export default function App() {
  const { storeName, loading } = useStore();

  useEffect(() => {
      if (!loading && typeof storeName === "string") {
        document.title = storeName;
      }
    }, [storeName, loading]);

  return (
    <div className="app-root">
      <ScrollToTop/>
      <Routes>
          {/* Auth routes (no layout) */}
          <Route path="/sign_in" element={<SignIn />} />
          <Route path="/sign_up" element={<SignUp />} />
          <Route path="/success" element={<PaySuccess />} />
          <Route path="/cancel" element={<PayCancel />} />

          <Route path="/payresult" element={<StorePayResult />} />

          {/* App routes (with layout) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/settings" element={<Settings_Page />} />
            <Route path="/store" element={<Store />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dummy" element={<Dummy />} />

            {/* Commerce flow */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />

            {/* Admin */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/orders" element={<Orders />} />
          </Route>
      </Routes>
    </div>
  );
}
