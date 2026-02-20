import { onRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { getDb, getItcDb, getClientId, getStoreId } from "./firebaseAdmin.js";


export const processPaymentSuccess = onRequest(
  {
    region: "us-central1",
    memory: "256MiB",
    minInstances: 0,
    maxInstances: 10,
    secrets: ["TEMPLATE_SERVICE_ACCOUNT", "ITC_SERVICE_ACCOUNT", "INTERNAL_SERVICE_TOKEN"],
  },
  async (req, res) => {
    const db = getDb();       // instore-mason → products
    const itcDb = getItcDb(); // itcore-7bfe2  → storeorders

    const clientId = getClientId();  // from SECRET — not req.body
    const storeId  = getStoreId();   // from SECRET — not req.body

    const requestId = `PS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    console.log(`[${requestId}] Request received`);

    // -------------------- AUTH --------------------
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token || token !== process.env.INTERNAL_SERVICE_TOKEN) {
      console.warn(`[${requestId}] Unauthorized`);
      return res.status(403).send("Forbidden");
    }

    // -------------------- INPUT --------------------
    const { orderId, items } = req.body;
    if (!orderId || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Missing orderId, or items." });
    }

    try {
      // -------------------- FETCH ORDER (itcDb) --------------------
      // Orders live in itcore-7bfe2
      const orderRef = itcDb
        .collection("clients")
        .doc(clientId)
        .collection("clientstores")
        .doc(storeId)
        .collection("storeorders")
        .doc(orderId);

      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) {
        return res.status(404).json({ error: "Order not found." });
      }

      const orderData = orderSnap.data();



      if (orderData.paymentProcessed) {
        console.log(`[${requestId}] Already processed, skipping`);
        return res.status(200).json({ success: true, stockUpdates: [{ status: "skipped", reason: "already processed" }] });
      }

      // -------------------- UPDATE STOCK (db) --------------------
      // Products live in instore-mason — use a db transaction for stock updates
      const stockUpdates = [];

      await db.runTransaction(async (transaction) => {
      // -------------------- PASS 1: ALL READS --------------------
      const reads = await Promise.all(
        items.map(async (item) => {
          const { productId, variantId, qty } = item;

          if (!productId || !qty || qty <= 0) {
            return { item, snap: null, skipped: true };
          }

          const productRef = db.collection("products").doc(productId);
          const productSnap = await transaction.get(productRef);
          return { item, snap: productSnap, ref: productRef };
        })
      );

      // -------------------- PASS 2: ALL WRITES --------------------
      for (const { item, snap, skipped, ref } of reads) {
        const { productId, variantId, qty } = item;

        if (skipped) {
          stockUpdates.push({ productId, variantId, status: "skipped", reason: "Invalid item" });
          continue;
        }

        if (!snap.exists) {
          stockUpdates.push({ productId, variantId, status: "error", reason: "Product not found" });
          continue;
        }

        const product = snap.data();

        if (variantId) {
          const variants = product.variants || [];
          const index = variants.findIndex((v) => v.id === variantId);

          if (index === -1) {
            stockUpdates.push({ productId, variantId, status: "error", reason: "Variant not found" });
            continue;
          }

          const currentStock = variants[index].stock || 0;
          const newStock = Math.max(0, currentStock - qty);
          const updatedVariants = [...variants];
          updatedVariants[index] = { ...variants[index], stock: newStock };

          transaction.update(ref, {
            variants: updatedVariants,
            lastStockUpdate: FieldValue.serverTimestamp(),
          });
          stockUpdates.push({ productId, variantId, previousStock: currentStock, newStock, quantityDeducted: qty });

        } else {
          const currentStock = product.stock || 0;
          const newStock = Math.max(0, currentStock - qty);

          transaction.update(ref, {
            stock: newStock,
            lastStockUpdate: FieldValue.serverTimestamp(),
          });
          stockUpdates.push({ productId, previousStock: currentStock, newStock, quantityDeducted: qty });
        }
      }
    });

      // -------------------- MARK ORDER PROCESSED (itcDb) --------------------
      // Write back to itcDb separately after stock transaction succeeds
      await orderRef.update({
        paymentProcessed: true,
        paymentProcessedAt: FieldValue.serverTimestamp(),
      });

      console.log(`[${requestId}] Stock update completed`);
      return res.status(200).json({ success: true, stockUpdates });

    } catch (err) {
      console.error(`[${requestId}] Error`, err);
      return res.status(500).json({ error: err.message });
    }
  }
);