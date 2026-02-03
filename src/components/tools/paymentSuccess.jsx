import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';

export default function PaymentSuccess() {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  useEffect(() => {
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (!orderId) {
      console.error('No order ID found');
      navigate('/');
      return;
    }

    // Clear cart on successful payment
    clearCart();
    
    // Store order ID for reference
    const recentOrders = JSON.parse(localStorage.getItem('recentOrders') || '[]');
    if (!recentOrders.includes(orderId)) {
      recentOrders.push(orderId);
      localStorage.setItem('recentOrders', JSON.stringify(recentOrders.slice(-10))); // Keep last 10
    }

    // Countdown timer for redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/orders'); // or navigate to home: navigate('/')
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, clearCart]);

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.successIcon}>✓</div>
        
        <h1 style={styles.heading}>Payment Successful!</h1>
        
        <p style={styles.message}>
          Thank you for your order. Your payment has been received and is being processed.
        </p>

        <div style={styles.orderDetails}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Order Information</h3>
          <p><strong>Order ID:</strong> {orderId}</p>
          <p><strong>Status:</strong> Processing</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '16px' }}>
            You will receive a confirmation email shortly with your order details.
          </p>
        </div>

        <div style={styles.infoBox}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            💡 Your order is being confirmed. You can track it in the Orders page.
          </p>
        </div>

        <p style={styles.redirect}>
          Redirecting to orders page in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>

        <button 
          onClick={() => navigate('/orders')} 
          style={styles.button}
        >
          View Orders
        </button>

        <button 
          onClick={() => navigate('/')} 
          style={{...styles.button, ...styles.secondaryButton}}
        >
          Continue Shopping
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
    background: 'linear-gradient(135deg, #667eea00 0%rgba(118, 75, 162, 0)a2 100%)'
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
  orderDetails: {
    background: '#f5f5f5',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '24px',
    textAlign: 'left'
  },
  infoBox: {
    background: '#e3f2fd',
    borderLeft: '4px solid #2196F3',
    borderRadius: '4px',
    padding: '12px',
    marginTop: '20px',
    textAlign: 'left'
  },
  redirect: {
    fontSize: '14px',
    color: '#999',
    marginTop: '24px',
    marginBottom: '16px',
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
    marginTop: '8px',
    width: '100%',
    transition: 'background 0.2s'
  },
  secondaryButton: {
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
  }
};