import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import axios from "axios";
import { formatCurrency, CURRENCY_SYMBOL } from "../utils/currency";

const GuestPayment = () => {
  const location = useLocation();
  const navState = location.state || {};
  // Allow query param fallback (e.g., /payment?amount=123&facility=Conf)
  const searchParams = new URLSearchParams(location.search);
  const qsAmount = searchParams.get('amount');
  const qsFacility = searchParams.get('facility');

  const [form, setForm] = useState({
    guestName: navState.guestName || "",
    amount: navState.amount || qsAmount || "",
    paymentProof: null,
    email: navState.email || ""
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If navigation state arrives after initial render (rare), sync it
  useEffect(() => {
    if (navState.amount && !form.amount) {
      setForm(f => ({ ...f, amount: navState.amount }));
    }
  }, [navState.amount]);

  const handleFileChange = (e) => {
    setForm({ ...form, paymentProof: e.target.files[0] });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setSubmitting(true);
    const data = new FormData();
    data.append("customerName", form.guestName);
    data.append("amount", form.amount);
    data.append("email", form.email);
    if (form.paymentProof) data.append("paymentProof", form.paymentProof);

    try {
      const res = await axios.post("/payments/manual", data);
      setMessage(res.data?.message || "Payment proof uploaded successfully ✅");
      // Optional: reset form except read-only fields
      setForm(f => ({ ...f, paymentProof: null }));
    } catch (err) {
      console.error('[Payment] submission error', err.response?.data || err.message);
      const apiMsg = err.response?.data?.message || err.response?.data?.error;
      setMessage(`Payment submission failed ❌${apiMsg ? ' - ' + apiMsg : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow rounded">
  <h2 className="text-2xl font-bold mb-4">Guest Payment {(navState.facilityName || qsFacility) && (<span className="text-sm font-normal text-gray-600">for {navState.facilityName || qsFacility}</span>)} {(!navState.facilityName && !qsFacility && navState.roomNumber) && (<span className="text-sm font-normal text-gray-600">for Room {navState.roomNumber}</span>)} </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label>
          Guest Name:
          <input
            type="text"
            name="guestName"
            value={form.guestName}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </label>

        <label>
          Amount ({CURRENCY_SYMBOL}):
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
            readOnly={!!navState.amount}
          />
          {form.amount && (
            <span className="text-sm text-gray-600">{formatCurrency(form.amount)}</span>
          )}
        </label>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </label>

        <label>
          Upload Receipt (Image or PDF):
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="border p-2 rounded w-full"
            required
          />
        </label>

        <button type="submit" disabled={submitting} className={`bg-blue-500 text-white p-2 rounded ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {submitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>

  {message && <p className="mt-4 font-semibold" data-testid="payment-status">{message}</p>}
    </div>
  );
};

export default GuestPayment;
