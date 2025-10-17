import React, { useEffect, useState } from 'react';
import BookingTable from '../components/BookingTable';
import { getAllBookings } from '../api/bookingApi';

const Reserved = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    getAllBookings(token)
      .then(({ data }) => {
        // Filter to reservations (PendingPayment)
        const reserved = Array.isArray(data) ? data.filter(b => (b.status === 'PendingPayment' || b.status === 'Pending')) : [];
        setBookings(reserved);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.response?.data?.message || e?.message || 'Failed to load reservations');
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-[80vh] items-start justify-center bg-neutral-100">
      <div className="mt-8 w-full max-w-5xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900">Reserved Bookings</h2>
          <button onClick={() => (window.location.href = '/dashboard')} className="rounded bg-neutral-100 px-3 py-2 text-sm text-neutral-800 shadow hover:bg-neutral-200">← Back to Dashboard</button>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</div>
        )}
        {loading ? (
          <div className="my-8 text-center text-[18px] text-neutral-600">Loading reservations...</div>
        ) : (
          <BookingTable bookings={bookings} showStatusControl={false} />
        )}
      </div>
    </div>
  );
};

export default Reserved;
