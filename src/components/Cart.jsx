import { useCart } from "../context/CartContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (!cart.length) {
    return (
      <h2 className="glassStyle" style={{ textAlign: "center", color: "#fff"}}>
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
    background: "rgba(255, 255, 255, 0.29)",
    border: "1px solid rgb(46, 46, 46)",
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "700px",
    margin: "10vh auto",
    color: "#000000",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
    
  };

  const listItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px ",
    borderBottom: "1px solid rgba(0, 0, 0, 0.2)",
    boxShadow: "inset 0px 0px 10px rgba(0, 0, 0, 0.2)",
    borderRadius:"15px",
    margin:"9px"
  };

  return (
    <>
    <div  style={{ padding: "0 16px"}}>
      <div style={glassStyle} >
        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Your Cart</h1>

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {cart.map((item) => (
            <li key={item.id} style={listItemStyle}>
              <span >
                {item.name} × {item.quantity} — R
                {(Number(item.price || 0) * item.quantity).toFixed(2)}
              </span>

              <button
                className="Admin_button"
                onClick={() => removeFromCart(item.id)}
                style={{ padding: "6px", marginTop:"2vh" }}
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
