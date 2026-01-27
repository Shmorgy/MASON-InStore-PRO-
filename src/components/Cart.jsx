import { useCart } from "../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!cart.length) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "20vh", color: "#fff"}}>
        Your cart is empty
      </h2>
    );
  }

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  const glassStyle = {
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    background: "rgba(41, 41, 41, 0.44)",
    border: "1px solid rgba(46, 46, 46, 0.49)",
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "700px",
    margin: "10vh auto",
    color: "#fff",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    top:"7vh",
  };

  const listItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
  };

  return (
    <>
    <div style={{ padding: "0 16px"}}>
      <div style={glassStyle} >
        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Your Cart</h1>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {cart.map((item) => (
            <li key={item.id} style={listItemStyle}>
              <span>
                {item.name} × {item.quantity} — R
                {(Number(item.price || 0) * item.quantity).toFixed(2)}
              </span>

              <button
                className="Admin_button"
                onClick={() => removeFromCart(item.id)}
                style={{ padding: "6px 12px" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <h2 style={{ textAlign: "right", marginTop: "24px" }}>
          Total: R{total.toFixed(2)}
        </h2>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            className="Admin_button"
            onClick={() => navigate("/checkout")}
            style={{ padding: "10px 20px" }}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
