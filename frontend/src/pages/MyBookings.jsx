import React, { useEffect, useState } from 'react';
import { getMyBookings } from '../api/bookingApi';
import BookingTable from '../components/BookingTable';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    getMyBookings(token)
      .then(({ data }) => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load bookings');
        setLoading(false);
      });
  }, []);

  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter(b => new Date(b.date) > new Date()).length;

  return (
    <div className="flex min-h-[80vh] items-start justify-center bg-neutral-100">
      <div className="mt-8 w-full max-w-5xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900">My Bookings</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 text-center shadow-sm">
            <div className="text-[18px] font-semibold text-blue-600">Total Bookings</div>
            <div className="text-[32px] font-bold">{totalBookings}</div>
          </div>

          <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-5 text-center shadow-sm">
            <div className="text-[18px] font-semibold text-yellow-700">Upcoming Bookings</div>
            <div className="text-[32px] font-bold">{upcomingBookings}</div>
          </div>
        </div>

        {loading ? (
          <div className="my-8 text-center text-[18px] text-neutral-600">Loading bookings...</div>
        ) : (
          <BookingTable bookings={bookings} />
        )}
      </div>
    </div>
  );
};

export default MyBookings;
