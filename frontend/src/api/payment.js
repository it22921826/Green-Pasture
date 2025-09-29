import axios from "axios";

// axios defaults.baseURL comes from invoiceAPI setup or VITE_BACKEND_URL

// GET all payments
export const fetchPayments = async () => {
  const res = await axios.get("/payments");
  return res.data;
};

// CREATE a payment
export const createPayment = async (paymentData) => {
  const payload = { ...paymentData, amount: Number(paymentData.amount) };
  const res = await axios.post("/payments", payload);
  return res.data;
};

// UPDATE a payment
export const updatePayment = async (id, paymentData) => {
  const payload = { ...paymentData };
  if (payload.amount !== undefined) payload.amount = Number(payload.amount);
  const res = await axios.put(`/payments/${id}`, payload);
  return res.data;
};

// DELETE a payment
export const deletePayment = async (id) => {
  const res = await axios.delete(`/payments/${id}`);
  return res.data;
};
