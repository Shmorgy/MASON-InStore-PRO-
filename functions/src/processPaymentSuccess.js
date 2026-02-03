import { onRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin.js";

export const processPaymentSuccess = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    minInstances: 0,
    maxInstances: 10,
    secrets: ["INTERNAL_SERVICE_TOKEN"]
  },
  async (req, res) => {
    const requestId = `PS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    console.log(`[${requestId}] Request received`);

    try {
      // -------------------- AUTH --------------------
      const authHeader = req.headers.authorization || "";
      const token = authHeader.replace("Bearer ", "");
      if (!token || token !== process.env.INTERNAL_SERVICE_TOKEN) {
        console.warn(`[${requestId}] Unauthorized request`);
        return res.status(403).send("Forbidden");
      }

      // -------------------- INPUT --------------------
      const { clientId, storeId, orderId, items } = req.body;
      if (!clientId || !storeId || !orderId || !Array.isArray(items) || !items.length) {
        return res.status(400).json({ error: "Missing clientId, storeId, orderId, or items" });
      }

      // -------------------- TRANSACTION --------------------
      const result = await db.runTransaction(async (transaction) => {
        const stockUpdates = [];

        const orderRef = db
          .collection("clients")
          .doc(clientId)
          .collection("clientstores")
          .doc(storeId)
          .collection("storeorders")
          .doc(orderId);

        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) {
          throw new Error("Order not found");
        }

        const orderData = orderSnap.data();

        // -------------------- IDEMPOTENCY --------------------
        if (orderData.paymentProcessed) {
          console.log(`[${requestId}] Order already processed, skipping stock deduction`);
          return [{ orderId, status: "skipped", reason: "already processed" }];
        }

        for (const item of items) {
          const { productId, variantId, qty } = item;

          if (!productId || !qty || qty <= 0) {
            stockUpdates.push({ productId, variantId, status: "skipped", reason: "Invalid item" });
            continue;
          }

          const productRef = db
            .collection("clients")
            .doc(clientId)
            .collection("clientstores")
            .doc(storeId)
            .collection("products")
            .doc(productId);

          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists) {
            stockUpdates.push({ productId, variantId, status: "error", reason: "Product not found" });
            continue;
          }

          const product = productSnap.data();

          if (variantId) {
            const variants = product.variants || [];
            const index = variants.findIndex(v => v.id === variantId);

            if (index === -1) {
              stockUpdates.push({ productId, variantId, status: "error", reason: "Variant not found" });
              continue;
            }

            const currentStock = variants[index].stock || 0;
            const newStock = Math.max(0, currentStock - qty);

            const updatedVariants = [...variants];
            updatedVariants[index] = { ...variants[index], stock: newStock };

            transaction.update(productRef, { variants: updatedVariants, lastStockUpdate: FieldValue.serverTimestamp() });
            stockUpdates.push({ productId, variantId, previousStock: currentStock, newStock, quantityDeducted: qty });
          } else {
            const currentStock = product.stock || 0;
            const newStock = Math.max(0, currentStock - qty);

            transaction.update(productRef, { stock: newStock, lastStockUpdate: FieldValue.serverTimestamp() });
            stockUpdates.push({ productId, previousStock: currentStock, newStock, quantityDeducted: qty });
          }
        }

        // Mark order as processed for idempotency
        transaction.update(orderRef, { paymentProcessed: true, paymentProcessedAt: FieldValue.serverTimestamp() });

        return stockUpdates;
      });

      console.log(`[${requestId}] Stock update completed`);
      return res.status(200).json({ success: true, stockUpdates: result });
    } catch (err) {
      console.error(`[${requestId}] Error`, err);
      return res.status(500).json({ error: err.message });
    }
  }
);
