import { projectID } from "../../firebase";

export default function getStockServiceUrl() {
  const functionName = "processPaymentSuccess";
  const region = "us-central1";
  const url = `https://${region}-${projectID}.cloudfunctions.net/${functionName}`;
  console.log("Stock service URL:", url);
  return url;
}
