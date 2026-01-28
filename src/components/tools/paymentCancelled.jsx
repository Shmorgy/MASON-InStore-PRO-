import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancelled() {
  const [orderId, setOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('orderId');
    setOrderId(id);

    // Log the cancellation for reference
    if (id) {
      const cancelledOrders = JSON.parse(localStorage.getItem('cancelledOrders') || '[]');
      if (!cancelledOrders.includes(id)) {
        cancelledOrders.push(id);
        localStorage.setItem('cancelledOrders', JSON.stringify(cancelledOrders.slice(-10))); // Keep last 10
      }
      console.log('Payment cancelled for order:', id);
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.warningIcon}>!</div>
        
        <h1 style={styles.heading}>Payment Cancelled</h1>
        
        <p style={styles.message}>
          Your payment was cancelled. No charges have been made to your account.
        </p>

        {orderId && (
          <div style={styles.orderInfo}>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              <strong>Order ID:</strong> {orderId}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>
              This order has been cancelled and will not be processed.
            </p>
          </div>
        )}

        <div style={styles.infoBox}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            💡 Your cart items have been saved. You can return to checkout to complete your purchase.
          </p>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            onClick={() => navigate('/checkout')} 
            style={styles.primaryButton}
          >
            Return to Checkout
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            style={styles.secondaryButton}
          >
            Continue Shopping
          </button>
        </div>

        <button 
          onClick={() => navigate('/orders')} 
          style={styles.linkButton}
        >
          View My Orders
        </button>
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
    background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)'
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
  warningIcon: {
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
  orderInfo: {
    background: '#fff3e0',
    borderLeft: '4px solid #ff9800',
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'left'
  },
  infoBox: {
    background: '#e3f2fd',
    borderLeft: '4px solid #2196F3',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px'
  },
  primaryButton: {
    flex: 1,
    background: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  secondaryButton: {
    flex: 1,
    background: 'transparent',
    color: '#ff9800',
    border: '2px solid #ff9800',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  linkButton: {
    background: 'transparent',
    color: '#667eea',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px',
    textDecoration: 'underline',
    transition: 'color 0.2s'
  }
};