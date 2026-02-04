import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext();

const GUEST_KEY = "cart_guest";

function readCart(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(key, cart) {
  localStorage.setItem(key, JSON.stringify(cart));
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const guestCart = readCart(GUEST_KEY);
      return guestCart;
    } catch {
      return [];
    }
  });

  /* ----------------------------------
     Load correct cart on auth change
  ---------------------------------- */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Guest session
      setCart(readCart(GUEST_KEY));
      return;
    }

    const userKey = `cart_${user.uid}`;
    const guestCart = readCart(GUEST_KEY);
    const userCart = readCart(userKey);

    // Merge guest → user ONCE
    const merged = [...userCart];

    for (const item of guestCart) {
      const existing = merged.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += Number(item.quantity || 1);
      } else {
        merged.push({ ...item, quantity: Number(item.quantity || 1) });
      }
    }

    setCart(merged);
    writeCart(userKey, merged);
    localStorage.removeItem(GUEST_KEY);
  }, [user, authLoading]);

  /* ----------------------------------
     Persist cart
  ---------------------------------- */
  useEffect(() => {
    if (authLoading) return;

    const key = user ? `cart_${user.uid}` : GUEST_KEY;
    writeCart(key, cart);
  }, [cart, user, authLoading]);

  /* ----------------------------------
     Cart operations
  ---------------------------------- */
  const addToCart = (product) => {
    const qtyToAdd = Number(product.quantity) || 1;
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + qtyToAdd;

      if (product.stock && newQty > product.stock) {
        alert(`Cannot add more than ${product.stock} items (${currentQty}) already in cart!)`);
        return prev;
      }

      if (existing) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, quantity: newQty }
            : p
        );
      }
      return [...prev, { ...product, quantity: qtyToAdd }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    const key = user ? `cart_${user.uid}` : GUEST_KEY;
    localStorage.removeItem(key);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        authLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
