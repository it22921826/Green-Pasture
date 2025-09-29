import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import formatCurrency, { CURRENCY_SYMBOL } from "../utils/currency";
import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "../API/invoiceAPI";

const InvoiceCRUD = () => {
  const { currency } = useAppContext();

  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    amount: "",
    roomNo: "",
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      setError("Failed to load invoices");
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editId) {
        await updateInvoice(editId, formData);
        setEditId(null);
      } else {
        await createInvoice(formData);
      }
      setFormData({ customerName: "", email: "", amount: "" });
      loadInvoices();
    } catch (err) {
      const serverMsg =
        err?.response?.data?.error || err?.response?.data?.message;
      console.error("Error saving invoice:", err?.response?.data || err.message);
      setError(serverMsg || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (invoice) => {
    setFormData({
      customerName: invoice.customerName,
      email: invoice.email || "",
      amount: invoice.amount,
    });
    setEditId(invoice._id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteInvoice(id);
      loadInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      setError("Failed to delete invoice");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500/25 to-purple-700 p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">
          Invoice Management ({CURRENCY_SYMBOL})
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Create, update, and manage your invoices easily
        </p>

        
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

       
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-medium">Customer Name</label>
            <input
              type="text"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Email</label>
            <input
              type="email"
              placeholder="Customer Email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Amount</label>
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">Room No:</label>
            <input
              type="number"
              placeholder="Room No"
              value={formData.roomNo}
              onChange={(e) =>
                setFormData({ ...formData, roomNo: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-md bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {loading ? "Saving..." : editId ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 font-medium">Invoice Number</th>
                <th className="p-3 font-medium">Customer Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Amount (Rs)</th>
                <th className="p-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="text-center p-4 text-neutral-500">
                    No invoices found
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{inv.invoiceNumber}</td>
                  <td className="p-3">{inv.customerName}</td>
                  <td className="p-3">{inv.email}</td>
                  <td className="p-3">{formatCurrency(inv.amount)}</td>
                  <td className="p-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(inv)}
                      className="rounded bg-yellow-500 px-3 py-1 text-white transition hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inv._id)}
                      className="rounded bg-red-500 px-3 py-1 text-white transition hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCRUD;
