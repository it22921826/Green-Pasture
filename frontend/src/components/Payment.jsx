import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { getRooms } from '../api/roomApi';
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
    } else if (!navState.amount && navState.roomNumber) {
      // Fallback: try fetch room list and find price (lightweight reuse)
      (async () => {
        try {
          const all = await getRooms({});
          const found = all.find(r => String(r.roomNumber) === String(navState.roomNumber));
          if (found && !form.amount) {
            // Assume at least 1 night until real total known
            setForm(f => ({ ...f, amount: found.price }));
          }
        } catch (e) {
          console.warn('[Payment] fallback price fetch failed', e.message);
        }
      })();
    }
  }, [navState.amount, navState.roomNumber]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, paymentProof: file });
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
      const stored = res.data?.data?.paymentProof;
      setMessage(res.data?.message || "Payment proof uploaded successfully ✅");
      if (stored) {
        // Optionally show a quick preview if it's a data URI (image)
        try {
          if (stored.startsWith('data:image')) {
            // Create an img preview element below
            setPreview(stored);
          } else if (res.data?.fileUrl) {
            setPreview(res.data.fileUrl);
          }
        } catch {}
      }
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

  const [preview, setPreview] = useState(null);

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
        {form.paymentProof && form.paymentProof.type?.startsWith('image') && (
          <div className="text-sm text-gray-600">
            Preview: <img alt="preview" className="mt-2 max-h-40 rounded border" src={URL.createObjectURL(form.paymentProof)} />
          </div>
        )}
        {preview && (
          <div className="text-sm text-green-700">
            Stored Preview: {preview.startsWith('data:image') ? (
              <img alt="stored" className="mt-2 max-h-40 rounded border" src={preview} />
            ) : (
              <a className="underline" href={preview} target="_blank" rel="noreferrer">View uploaded file</a>
            )}
          </div>
        )}

        <button type="submit" disabled={submitting} className={`bg-blue-500 text-white p-2 rounded ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {submitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>

  {message && <p className="mt-4 font-semibold" data-testid="payment-status">{message}</p>}
    </div>
  );
};

export default GuestPayment;
