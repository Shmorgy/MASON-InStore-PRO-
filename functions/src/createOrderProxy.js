import { onCall, HttpsError } from "firebase-functions/v2/https";
import axios from "axios";

export const proxyCreateOrder = onCall({ region: "us-central1" }, async (req) => {
  try {
    // ITC callable function endpoint
    const itcFunctionUrl = "https://createorder-v3uftvqsza-bq.a.run.app";

    const res = await axios.post(itcFunctionUrl, req.data, {
      headers: { "Content-Type": "application/json" },
    });

    return res.data;
  } catch (err) {
    console.error("Proxy createOrder error:", err.message || err);
    throw new HttpsError("internal", "Failed to create order via ITC");
  }
});
