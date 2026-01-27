import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "./admin.js";

/**
 * Process payment success and update stock levels
 * Called by client after payment redirect from PayFast
 * Waits for IPN confirmation before updating stock
 * Uses transaction for atomic stock updates
 */
export const processPaymentSuccess = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    minInstances: 0,
    maxInstances: 100
  },
  async (req) => {
    const requestId = `PS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const { orderId } = req.data;

      console.log(`[${requestId}] Processing payment success for order: ${orderId}`);

      if (!orderId) {
        throw new HttpsError("invalid-argument", "Order ID is required");
      }

      // Use transaction for atomic operations
      const result = await db.runTransaction(async (transaction) => {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists) {
          throw new HttpsError("not-found", `Order ${orderId} not found`);
        }

        const order = orderSnap.data();

        // Verify payment completed via IPN
        if (order.paymentStatus !== "completed" && order.status !== "paid") {
          throw new HttpsError(
            "failed-precondition",
            "Payment not yet confirmed by PayFast. Please wait a moment and try again."
          );
        }

        // Check if already processed (idempotency)
        if (order.stockUpdated) {
          console.log(`[${requestId}] Order already processed, returning cached results`);
          return {
            success: true,
            message: "Order already processed",
            alreadyProcessed: true,
            stockUpdates: order.stockUpdateResults || []
          };
        }

        console.log(`[${requestId}] Updating stock for ${order.items.length} items`);

        // Get store collection name from order index
        const indexRef = db.collection("orderIndex").doc(orderId);
        const indexSnap = await transaction.get(indexRef);
        
        if (!indexSnap.exists) {
          throw new HttpsError("not-found", "Order index not found");
        }

        const { clientId, storeId, storeCollectionName = "clientstores" } = indexSnap.data();

        // Update stock for each item
        const stockUpdates = [];

        for (const item of order.items) {
          const { productId, variantId, qty, name } = item;

          if (!productId || !qty) {
            console.warn(`[${requestId}] Skipping invalid item:`, item);
            stockUpdates.push({
              productId,
              variantId,
              status: "skipped",
              reason: "Missing product ID or quantity"
            });
            continue;
          }

          const productRef = db
            .collection("clients")
            .doc(clientId)
            .collection(storeCollectionName)
            .doc(storeId)
            .collection("products")
            .doc(productId);

          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists) {
            console.error(`[${requestId}] Product not found: ${productId}`);
            stockUpdates.push({
              productId,
              variantId,
              status: "error",
              reason: "Product not found"
            });
            continue;
          }

          const product = productSnap.data();

          // Handle variant stock
          if (variantId) {
            const variants = product.variants || [];
            const variantIndex = variants.findIndex(v => v.id === variantId);

            if (variantIndex === -1) {
              console.error(`[${requestId}] Variant not found: ${variantId}`);
              stockUpdates.push({
                productId,
                variantId,
                status: "error",
                reason: "Variant not found"
              });
              continue;
            }

            const variant = variants[variantIndex];
            const currentStock = variant.stock || 0;
            const newStock = Math.max(0, currentStock - qty);

            // Update variant stock
            const updatedVariants = [...variants];
            updatedVariants[variantIndex] = {
              ...variant,
              stock: newStock
            };

            transaction.update(productRef, {
              variants: updatedVariants,
              lastStockUpdate: FieldValue.serverTimestamp()
            });

            stockUpdates.push({
              productId,
              variantId,
              status: "success",
              previousStock: currentStock,
              newStock,
              quantityDeducted: qty,
              productName: product.name || name || "Unknown",
              variantName: variant.name || variant.title || "Unknown"
            });

            console.log(
              `[${requestId}] Updated variant stock: ${productId}/${variantId} ` +
              `from ${currentStock} to ${newStock}`
            );

          } else {
            // Handle simple product stock
            const currentStock = product.stock || 0;
            const newStock = Math.max(0, currentStock - qty);

            transaction.update(productRef, {
              stock: newStock,
              lastStockUpdate: FieldValue.serverTimestamp()
            });

            stockUpdates.push({
              productId,
              status: "success",
              previousStock: currentStock,
              newStock,
              quantityDeducted: qty,
              productName: product.name || name || "Unknown"
            });

            console.log(
              `[${requestId}] Updated product stock: ${productId} ` +
              `from ${currentStock} to ${newStock}`
            );
          }
        }

        // Mark order as stock updated
        transaction.update(orderRef, {
          stockUpdated: true,
          stockUpdatedAt: FieldValue.serverTimestamp(),
          stockUpdateResults: stockUpdates,
          status: "confirmed",
          clientProcessedAt: FieldValue.serverTimestamp()
        });

        // Copy to store collection
        const storeOrderRef = db
          .collection("clients")
          .doc(clientId)
          .collection(storeCollectionName)
          .doc(storeId)
          .collection("StoreOrders")
          .doc(orderId);

        transaction.set(
          storeOrderRef,
          {
            ...order,
            stockUpdated: true,
            stockUpdatedAt: FieldValue.serverTimestamp(),
            stockUpdateResults: stockUpdates,
            status: "confirmed"
          },
          { merge: true }
        );

        console.log(`[${requestId}] Stock updates completed successfully`);

        return {
          success: true,
          message: "Stock updated successfully",
          stockUpdates,
          summary: {
            totalItems: order.items.length,
            successfulUpdates: stockUpdates.filter(u => u.status === "success").length,
            failedUpdates: stockUpdates.filter(u => u.status === "error").length,
            skippedUpdates: stockUpdates.filter(u => u.status === "skipped").length
          }
        };
      });

      console.log(`[${requestId}] Transaction completed successfully`);
      return result;

    } catch (err) {
      console.error(`[${requestId}] processPaymentSuccess error:`, err);

      // Log error for debugging
      try {
        await db.collection("processPaymentErrors").add({
          requestId,
          orderId: req.data.orderId,
          error: err.message,
          stack: err.stack,
          timestamp: FieldValue.serverTimestamp()
        });
      } catch (logErr) {
        console.error(`[${requestId}] Failed to log error:`, logErr);
      }

      if (err instanceof HttpsError) {
        throw err;
      }

      throw new HttpsError("internal", `Failed to process payment: ${err.message}`);
    }
  }
);

/**
 * Validate stock availability before creating order
 * Called by createOrder function
 */
export async function validateStockAvailability(
  cart,
  clientId,
  storeId,
  storeCollectionName = "clientstores"
) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new HttpsError("invalid-argument", "Cart is empty");
  }

  const stockIssues = [];

  for (const item of cart) {
    const { productId, variantId, qty, name } = item;

    if (!productId) {
      stockIssues.push({
        item,
        issue: "Missing product ID"
      });
      continue;
    }

    if (!qty || qty <= 0) {
      stockIssues.push({
        item,
        issue: "Invalid quantity"
      });
      continue;
    }

    try {
      const productRef = db
        .collection("clients")
        .doc(clientId)
        .collection(storeCollectionName)
        .doc(storeId)
        .collection("products")
        .doc(productId);

      const productSnap = await productRef.get();

      if (!productSnap.exists()) {
        stockIssues.push({
          productId,
          variantId,
          productName: name || "Unknown",
          issue: "Product not found"
        });
        continue;
      }

      const product = productSnap.data();

      if (variantId) {
        // Check variant stock
        const variant = product.variants?.find(v => v.id === variantId);

        if (!variant) {
          stockIssues.push({
            productId,
            variantId,
            productName: product.name || name || "Unknown",
            issue: "Variant not found"
          });
          continue;
        }

        const availableStock = variant.stock || 0;

        if (availableStock < qty) {
          stockIssues.push({
            productId,
            variantId,
            productName: product.name || name || "Unknown",
            variantName: variant.name || variant.title || "Unknown",
            requested: qty,
            available: availableStock,
            issue: "Insufficient stock"
          });
        }
      } else {
        // Check simple product stock
        const availableStock = product.stock || 0;

        if (availableStock < qty) {
          stockIssues.push({
            productId,
            productName: product.name || name || "Unknown",
            requested: qty,
            available: availableStock,
            issue: "Insufficient stock"
          });
        }
      }
    } catch (err) {
      console.error(`Error checking stock for product ${productId}:`, err);
      stockIssues.push({
        productId,
        variantId,
        productName: name || "Unknown",
        issue: `Error checking stock: ${err.message}`
      });
    }
  }

  if (stockIssues.length > 0) {
    const errorMessage = stockIssues
      .map(issue => {
        if (issue.issue === "Insufficient stock") {
          const itemName = issue.variantName 
            ? `${issue.productName} - ${issue.variantName}`
            : issue.productName;
          return `${itemName}: Requested ${issue.requested}, Available ${issue.available}`;
        }
        return `${issue.productName || issue.productId}: ${issue.issue}`;
      })
      .join("; ");

    throw new HttpsError(
      "failed-precondition",
      `Stock validation failed: ${errorMessage}`,
      { stockIssues }
    );
  }

  return true;
}