import React, { useEffect, useState } from 'react';
import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';

export default function PaymentCancelled() {
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing cancellation...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('orderId');
    setOrderId(id);

    if (id) {
      cancelOrder(id);
    } else {
      setStatus('cancelled');
      setMessage('Your payment was cancelled. No charges have been made.');
    }
  }, []);

  const cancelOrder = async (orderId) => {
    try {
      // Call server-side function to cancel order
      const cancelOrderFn = httpsCallable(functions, 'cancelOrder');
      const result = await cancelOrderFn({ orderId });

      if (result.data.success) {
        setStatus('cancelled');
        setMessage('Your payment was cancelled. No charges have been made.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      
      // Still show as cancelled to user (they didn't pay)
      // But log the error for admin investigation
      setStatus('cancelled');
      setMessage('Your payment was cancelled. No charges have been made.');
      
      if (error.code === 'functions/not-found') {
        console.warn('Order not found in system:', orderId);
      } else {
        console.warn('Failed to update order status:', error.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'processing' && (
          <>
            <div style={styles.spinner}></div>
            <h1 style={styles.heading}>Processing Cancellation</h1>
            <p style={styles.message}>{message}</p>
          </>
        )}

        {status === 'cancelled' && (
          <>
            <div style={styles.warningIcon}>!</div>
            <h1 style={styles.heading}>Payment Cancelled</h1>
            <p style={styles.message}>{message}</p>
            {orderId && (
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
                Order ID: {orderId}
              </p>
            )}
            <button 
              onClick={() => window.location.href = '/checkout'} 
              style={styles.button}
            >
              Return to Checkout
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              style={{ ...styles.button, background: '#999', marginLeft: '12px' }}
            >
              Go to Home
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.errorIcon}>✕</div>
            <h1 style={styles.heading}>Error</h1>
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
    background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)'
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