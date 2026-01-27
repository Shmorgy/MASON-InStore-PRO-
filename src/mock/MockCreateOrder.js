// src/mocks/mockCreateOrder.js

export const mockCreateOrder = async ({
  cartItems,
  total,
  deliveryOption,
  address,
  userId,
  paymentMode = "mock",
}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const timestamp = Date.now();
      const orderId = `mock_${timestamp}`;

      resolve({
        orderId,
        payment: {
          provider: "mock",
          mode: paymentMode,
          status: "paid",
          reference: `mock_ref_${timestamp}`,
          message: "Mock payment successful",
        },
      });
    }, 500); // simulate network + processing delay
  });
};
