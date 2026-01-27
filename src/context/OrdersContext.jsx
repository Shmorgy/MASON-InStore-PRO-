import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase.js";
import { collection, doc, updateDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "./AuthContext.jsx";

const OrdersContext = createContext();

export function OrdersProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user && !isAdmin) return;

    const ordersRef = collection(db, "orders");
    const ordersQuery = isAdmin
      ? query(ordersRef)
      : query(ordersRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      ordersQuery,
      snapshot => {
        const firestoreOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        }));
        // Merge optimistic + Firestore orders
        setOrders(prev => {
          const ids = new Set(firestoreOrders.map(o => o.id));
          const merged = [
            ...firestoreOrders,
            ...prev.filter(o => o.id && !ids.has(o.id))
          ];
          return merged.sort((a, b) => b.createdAt - a.createdAt);
        });
      },
      err => console.error("Orders fetch error:", err)
    );

    return () => unsubscribe();
  }, [user, isAdmin]);

  const addOrder = async ({ id = null, cartItems = [], total = 0, deliveryOption = "Pickup", address = null, status = "pending" }) => {
    if (!user) throw new Error("User not logged in");

    const normalize = v => v && typeof v === "string" ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "Pickup";

    const newOrder = {
      id,
      userId: user.uid,
      items: cartItems.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price ?? 0,
        quantity: i.quantity ?? 1,
        imageUrls: i.imageUrls ?? []
      })),
      total,
      status,
      deliveryOption: normalize(deliveryOption),
      address: normalize(deliveryOption) === "Delivery" ? address : null,
      createdAt: new Date()
    };

    setOrders(prev => id && prev.some(o => o.id === id) ? prev : [newOrder, ...prev]);

    if (!id) return;
    const orderRef = doc(db, "orders", id);
    await updateDoc(orderRef, newOrder);
  };

  const updateOrderStatus = async (orderId, status) => {
    if (!orderId) return;
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, { status });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const deleteOrder = async (orderId) => {
    if (!orderId || !isAdmin) return;
    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, deleteOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export const useOrders = () => useContext(OrdersContext);
