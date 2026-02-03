import { projectID } from "../../firebase";

export default function getStockServiceUrl() {
  const functionName = "processPaymentSuccess";
  const region = "us-central1";

  return `https://${region}-${projectID}.cloudfunctions.net/${functionName}`;
}
