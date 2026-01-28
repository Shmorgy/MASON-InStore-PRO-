// src/utils/validateCheckoutTotals.js
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Validate cart totals using store DB (products collection)
 * Returns { valid, total, lineItems } or throws error
 * All prices are handled in integer cents to avoid floating point issues.
 */
export async function validateCheckoutTotal(storeId, cart) {
  if (!storeId || !Array.isArray(cart) || cart.length === 0) {
    throw new Error("Invalid storeId or empty cart");
  }

  let totalCents = 0;
  const lineItems = [];

  for (const item of cart) {
    // Determine quantity from item
    const qty = typeof item.quantity === "number" ? item.quantity : item.qty;
    if (!item.productId || typeof qty !== "number") {
      throw new Error("Malformed cart item");
    }

    // Lookup product in Firestore
    const productRef = doc(db, "products", item.productId);
    const snap = await getDoc(productRef);
    if (!snap.exists()) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    const product = snap.data();

    // --- Integer cents arithmetic ---
    const priceCents = Math.round(Number(product.price) * 100); // price per unit in cents
    const lineTotalCents = priceCents * qty; // total for this item in cents
    totalCents += lineTotalCents;

    // Push line item for frontend or backend
    lineItems.push({
      productId: item.productId,
      productName: product.name || product.title || `Product ${item.productId}`,
      price: (priceCents / 100).toFixed(2),       // string decimal for PayFast
      quantity: qty,
      qty,
      lineTotal: (lineTotalCents / 100).toFixed(2), // string decimal for PayFast
      priceCents, // include cents for internal verification if needed
      lineTotalCents, // internal verification
    });
  }

  return {
    valid: true,
    total: +((totalCents / 100).toFixed(2)), // exact decimal string for PayFast
    totalCents,                          // exact integer cents
    lineItems,
  };
}
