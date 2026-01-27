// PaymentSuccess.jsx - Frontend Component
// Handles stock updates in the FRONTEND Firebase project
// Does NOT interact with ITC backend directly

import React, { useEffect, useState } from 'react';
import { db } from '../../firebase'; // Frontend Firebase config
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';

export default function PaymentSuccess() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
      setStatus('error');
      setMessage('No order ID found. Please contact support.');
      return;
    }

    processPaymentSuccess(orderId);
  }, []);

  const processPaymentSuccess = async (orderId) => {
    try {
      setMessage('Waiting for payment confirmation...');

      // Wait for IPN confirmation from ITC backend
      const ipnConfirmed = await waitForIPNConfirmation(orderId, 30000);
      
      if (!ipnConfirmed) {
        setStatus('pending');
        setMessage('Payment is being processed. You will receive an email confirmation shortly.');
        return;
      }

      setMessage('Payment confirmed! Processing your order...');

      // Update stock in LOCAL frontend database
      const stockUpdateResult = await updateLocalStock(orderId);

      if (stockUpdateResult.success) {
        setStatus('success');
        setMessage('Payment successful! Your order has been confirmed.');
        setOrderDetails(stockUpdateResult.orderDetails);

        // Clear cart from localStorage
        localStorage.removeItem('cart');
        
        // Redirect to home after 5 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      } else {
        throw new Error(stockUpdateResult.error || 'Failed to update stock');
      }

    } catch (error) {
      console.error('Error processing payment success:', error);
      setStatus('error');
      setMessage(`Error processing payment: ${error.message}. Order ID: ${orderId}`);
    }
  };

  /**
   * Wait for IPN confirmation by checking ITC backend order status
   * Polls the order document that was created in ITC backend
   */
  const waitForIPNConfirmation = async (orderId, timeout = 30000) => {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds
    
    // TODO: Replace this URL with your actual ITC backend API endpoint
    // This should check the order status in the ITC backend
    const ITC_ORDER_STATUS_URL = `https://your-itc-backend.com/api/checkOrderStatus?orderId=${orderId}`;
    
    while (Date.now() - startTime < timeout) {
      try {
        // Option 1: If you have an API endpoint in ITC backend
        // const response = await fetch(ITC_ORDER_STATUS_URL);
        // const data = await response.json();
        // if (data.paymentStatus === 'completed') return true;
        
        // Option 2: If order is also stored locally (for offline access)
        // Check local copy of order status
        const localOrderRef = doc(db, 'orders', orderId);
        const localOrderSnap = await getDoc(localOrderRef);
        
        if (localOrderSnap.exists()) {
          const order = localOrderSnap.data();
          if (order.paymentStatus === 'completed' || order.status === 'paid') {
            console.log('IPN confirmation received');
            return true;
          }
        }
        
      } catch (err) {
        console.error('Error checking IPN confirmation:', err);
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('IPN confirmation timeout');
    return false;
  };

  /**
   * Update stock levels in LOCAL frontend database
   * This is the frontend's responsibility, not ITC backend
   */
  const updateLocalStock = async (orderId) => {
    try {
      // Get order details (from local storage or fetch from ITC backend)
      const order = JSON.parse(localStorage.getItem(`order_${orderId}`) || '{}');
      
      if (!order.items || order.items.length === 0) {
        throw new Error('Order items not found');
      }

      // Check if already processed
      const processedOrders = JSON.parse(localStorage.getItem('processedOrders') || '[]');
      if (processedOrders.includes(orderId)) {
        console.log('Order already processed');
        return {
          success: true,
          orderDetails: order,
          message: 'Already processed'
        };
      }

      // Update stock for each item in LOCAL database
      const batch = writeBatch(db);
      const stockUpdates = [];

      for (const item of order.items) {
        const { productId, variantId, qty, name } = item;

        if (!productId || !qty) {
          console.warn('Skipping invalid item:', item);
          continue;
        }

        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
          console.error(`Product not found: ${productId}`);
          stockUpdates.push({
            productId,
            variantId,
            status: 'error',
            reason: 'Product not found'
          });
          continue;
        }

        const product = productSnap.data();

        if (variantId) {
          // Handle variant stock
          const variants = product.variants || [];
          const variantIndex = variants.findIndex(v => v.id === variantId);

          if (variantIndex === -1) {
            console.error(`Variant not found: ${variantId}`);
            continue;
          }

          const variant = variants[variantIndex];
          const currentStock = variant.stock || 0;
          const newStock = Math.max(0, currentStock - qty);

          const updatedVariants = [...variants];
          updatedVariants[variantIndex] = {
            ...variant,
            stock: newStock
          };

          batch.update(productRef, {
            variants: updatedVariants,
            lastStockUpdate: new Date()
          });

          stockUpdates.push({
            productId,
            variantId,
            status: 'success',
            previousStock: currentStock,
            newStock,
            quantityDeducted: qty,
            productName: product.name || name || 'Unknown',
            variantName: variant.name || variant.title || 'Unknown'
          });

          console.log(`Updated variant stock: ${productId}/${variantId} from ${currentStock} to ${newStock}`);

        } else {
          // Handle simple product stock
          const currentStock = product.stock || 0;
          const newStock = Math.max(0, currentStock - qty);

          batch.update(productRef, {
            stock: newStock,
            lastStockUpdate: new Date()
          });

          stockUpdates.push({
            productId,
            status: 'success',
            previousStock: currentStock,
            newStock,
            quantityDeducted: qty,
            productName: product.name || name || 'Unknown'
          });

          console.log(`Updated product stock: ${productId} from ${currentStock} to ${newStock}`);
        }
      }

      // Commit all stock updates atomically
      await batch.commit();
      console.log('Stock batch committed successfully');

      // Mark order as processed locally
      processedOrders.push(orderId);
      localStorage.setItem('processedOrders', JSON.stringify(processedOrders));

      // Optionally store order locally
      if (order.orderId) {
        const localOrderRef = doc(db, 'orders', orderId);
        await updateDoc(localOrderRef, {
          status: 'confirmed',
          stockUpdated: true,
          stockUpdatedAt: new Date(),
          stockUpdateResults: stockUpdates
        }).catch(err => {
          console.warn('Could not update local order (may not exist):', err.message);
        });
      }

      return {
        success: true,
        orderDetails: order,
        stockUpdates,
        summary: {
          totalItems: order.items.length,
          successfulUpdates: stockUpdates.filter(u => u.status === 'success').length,
          failedUpdates: stockUpdates.filter(u => u.status === 'error').length
        }
      };

    } catch (error) {
      console.error('Error updating local stock:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'processing' && (
          <>
            <div style={styles.spinner}></div>
            <h1 style={styles.heading}>Processing Payment</h1>
            <p style={styles.message}>{message}</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div style={styles.pendingIcon}>⏱</div>
            <h1 style={styles.heading}>Payment Pending</h1>
            <p style={styles.message}>{message}</p>
            <button 
              onClick={() => window.location.href = '/'} 
              style={styles.button}
            >
              Return to Home
            </button>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <h1 style={styles.heading}>Payment Successful!</h1>
            <p style={styles.message}>{message}</p>
            {orderDetails && (
              <div style={styles.orderDetails}>
                <h3 style={{ marginTop: 0 }}>Order Details</h3>
                <p><strong>Order ID:</strong> {orderDetails.orderId}</p>
                <p><strong>Total:</strong> R{orderDetails.totalAmount?.toFixed(2) || '0.00'}</p>
                <p><strong>Email:</strong> {orderDetails.customer?.email}</p>
                <p><strong>Status:</strong> Confirmed</p>
              </div>
            )}
            <p style={styles.redirect}>Redirecting to home page in 5 seconds...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.errorIcon}>✕</div>
            <h1 style={styles.heading}>Payment Error</h1>
            <p style={styles.message}>{message}</p>
            <button 
              onClick={() => window.location.href = '/'} 
              style={styles.button}
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  heading: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1a1a1a'
  },
  message: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    margin: '0 auto 24px',
    animation: 'spin 1s linear infinite'
  },
  successIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#4CAF50',
    color: 'white',
    fontSize: '48px',
    lineHeight: '80px',
    margin: '0 auto 24px',
    fontWeight: 'bold'
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#f44336',
    color: 'white',
    fontSize: '48px',
    lineHeight: '80px',
    margin: '0 auto 24px',
    fontWeight: 'bold'
  },
  pendingIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#ff9800',
    color: 'white',
    fontSize: '48px',
    lineHeight: '80px',
    margin: '0 auto 24px',
    fontWeight: 'bold'
  },
  orderDetails: {
    background: '#f5f5f5',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '24px',
    textAlign: 'left'
  },
  redirect: {
    fontSize: '14px',
    color: '#999',
    marginTop: '24px',
    fontStyle: 'italic'
  },
  button: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '24px',
    transition: 'background 0.2s'
  }
};

// Add CSS for spinner animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}