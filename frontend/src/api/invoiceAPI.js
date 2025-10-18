// client/API/invoiceAPI.js
import axios from "axios";

// Ensure baseURL points to backend; default to localhost:5000
const baseURL = import.meta.env?.VITE_BACKEND_URL || "http://localhost:5000/api";
axios.defaults.baseURL = baseURL;
// Helpful during dev to confirm environment wiring
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("Invoice API baseURL:", baseURL);
}

export const fetchInvoices = async () => {
  const res = await axios.get("/invoices");
  return res.data;
};

export const createInvoice = async (invoiceData) => {
  // Cast numeric fields
  const payload = { 
    ...invoiceData, 
    amount: Number(invoiceData.amount),
    ...(invoiceData.roomNo !== undefined ? { roomNo: Number(invoiceData.roomNo) } : {}),
  };
  const res = await axios.post("/invoices", payload);
  return res.data;
};

export const updateInvoice = async (id, invoiceData) => {
  const payload = { 
    ...invoiceData,
    ...(invoiceData.amount !== undefined ? { amount: Number(invoiceData.amount) } : {}),
    ...(invoiceData.roomNo !== undefined ? { roomNo: Number(invoiceData.roomNo) } : {}),
  };
  const res = await axios.put(`/invoices/${id}`, payload);
  return res.data;
};

export const deleteInvoice = async (id) => {
  const res = await axios.delete(`/invoices/${id}`);
  return res.data;
};

export const approveInvoice = async (id) => {
  const res = await axios.patch(`/invoices/${id}/approve`);
  return res.data;
};

export const getInvoiceProof = async (id) => {
  const res = await axios.get(`/invoices/${id}/proof`);
  return res.data; // { success, proof }
};
