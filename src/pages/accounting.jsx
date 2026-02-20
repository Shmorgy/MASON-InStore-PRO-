import React, { useEffect, useState, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { itcFunctions, clientID, storeID } from "../firebase";

const getOrdersFn = httpsCallable(itcFunctions, "getOrders");
const requestPayoutFn = httpsCallable(itcFunctions, "requestPayout");

// Reserve fee percentage for transaction fees
const RESERVE_RATIO = 0.03; // 3%
const MIN_PAYOUT = 700; // R1000 minimum

export default function Accounting() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    completedOrders: 0,
    availableBalance: 0,
    grossRevenue: 0,
    grossProfit: 0,
    uniqueVisitors: 0,
    ordersPlaced: 0,
    avgOrderValue: 0,
  });

  const intervalRef = useRef(null);

  // Fetch completed orders and calculate metrics
  const fetchOrders = async () => {
    try {
      const res = await getOrdersFn({ clientId: clientID, storeId: storeID });
      const fetchedOrders = res.data?.orders || res.data || [];
      const planType = res.data?.planType || "basic"; // fallback
      setOrders(fetchedOrders);

      const completedOrders = fetchedOrders.filter(o => o.status === "completed");

      const grossRevenue = completedOrders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      );

      const planFeeRate = planType === "basic" ? 0.05 : 0;
      const totalFeeRate = planFeeRate + RESERVE_RATIO;
      const totalFees = grossRevenue * totalFeeRate;
      const grossProfit = grossRevenue - totalFees;

      const totalEarnings = grossRevenue;
      const reserveAmount = grossRevenue * RESERVE_RATIO;
      const availableBalance = Math.max(0, grossRevenue - reserveAmount);

      const uniqueVisitors = new Set(
        fetchedOrders.map(o => o.customer?.email).filter(Boolean)
      ).size;

      const ordersPlaced = fetchedOrders.length;
      const avgOrderValue = completedOrders.length
        ? grossRevenue / completedOrders.length
        : 0;

      setMetrics({
        totalEarnings,
        completedOrders: completedOrders.length,
        availableBalance,
        grossRevenue,
        grossProfit,
        uniqueVisitors,
        ordersPlaced,
        avgOrderValue,
      });
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));

    // Auto-refresh every 10 seconds
    intervalRef.current = setInterval(fetchOrders, 10000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Handle payout request
  const handlePayout = async () => {
    const amount = Number(payoutAmount);
    if (!amount || amount < MIN_PAYOUT) {
      return alert(`Minimum payout is R${MIN_PAYOUT}`);
    }
    if (amount > metrics.availableBalance) {
      return alert(
        `Cannot request more than available balance: R${metrics.availableBalance.toFixed(
          2
        )}`
      );
    }

    setPayoutLoading(true);
    try {
      const res = await requestPayoutFn({ clientID, storeID, amount });
      console.log("Payout requested:", res.data);
      alert(`Payout of R${amount.toFixed(2)} requested!`);
      setPayoutAmount("");
      fetchOrders(); // refresh metrics
    } catch (err) {
      console.error("Payout failed:", err);
      alert("Failed to request payout");
    }
    setPayoutLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Metrics + Payout */}
      <div style={styles.right}>
        <h2>Metrics</h2>
        <div style={styles.metric}>
          <span>Total Earnings:</span>
          <strong>R{metrics.totalEarnings.toFixed(2)}</strong>
        </div>
        <div style={styles.metric}>
          <span>Completed Orders:</span>
          <strong>{metrics.completedOrders}</strong>
        </div>
        <div style={styles.metric}>
          <span>Available for Payout:</span>
          <strong>R{metrics.availableBalance.toFixed(2)}</strong>
        </div>

        {/* Advanced Metrics Card */}
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Performance</h3>
          <div style={styles.metric}><span>Gross Revenue:</span><strong>R{metrics.grossRevenue.toFixed(2)}</strong></div>
          <div style={styles.metric}><span>Gross Profit:</span><strong>R{metrics.grossProfit.toFixed(2)}</strong></div>
          <div style={styles.metric}><span>Unique Visitors:</span><strong>{metrics.uniqueVisitors}</strong></div>
          <div style={styles.metric}><span>Orders Placed:</span><strong>{metrics.ordersPlaced}</strong></div>
          <div style={styles.metric}><span>Avg Order Value:</span><strong>R{metrics.avgOrderValue.toFixed(2)}</strong></div>
        </div>

        <h2>Payout</h2>
        <input
          type="number"
          placeholder="Amount"
          value={payoutAmount}
          onChange={e => setPayoutAmount(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={handlePayout}
          disabled={
            payoutLoading ||
            Number(payoutAmount) < MIN_PAYOUT ||
            Number(payoutAmount) > metrics.availableBalance
          }
          style={{ ...styles.button, opacity: payoutLoading ? 0.7 : 1 }}
        >
          {payoutLoading ? "Requesting..." : "Request Payout"}
        </button>
        <small>Minimum payout: R{MIN_PAYOUT}</small>
      </div>

      {/* Completed Orders */}
      <div style={styles.left}>
        <h2>Completed Orders</h2>
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(o => o.status === "completed")
                .map(order => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>{order.customer?.email || "N/A"}</td>
                    <td>R{order.totalAmount.toFixed(2)}</td>
                    <td>{order.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: 24,
    padding: 20,
    color: "#000000",
    fontFamily: "var(--font-title)",
  },
  left: {
    flex: 2,
    background: "#ffffff37",
    padding: 20,
    borderRadius: 12,
    maxHeight: "80vh",
    overflowY: "auto",
    fontFamily: 'var(--font-text)',
    border: "1px solid rgb(0,0,0)",
  },
  right: {
    flex: 1,
    background: "#ffffff5c",
    padding: 20,
    borderRadius: 12,
    height: "fit-content",
    fontFamily: 'var(--font-text)',
    border: "1px solid rgb(0,0,0)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  metric: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 10,
    background: "#ffffff80",
    border: "1px solid #000",
  },
  input: {
    width: "fit-content",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #444",
    background: "#111",
    color: "#fff",
  },
  button: {
    width: "100%",
    padding: 12,
    borderRadius: 6,
    border: "none",
    background: "var(--top)",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};
