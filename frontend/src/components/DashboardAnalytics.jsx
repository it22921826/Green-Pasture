import React, { useEffect, useState } from 'react';
import { getAllBookings } from '../api/bookingApi';

const DashboardAnalytics = () => {
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, checkedOut: 0, cancelled: 0, guests: 0 });
  useEffect(() => {
    const token = localStorage.getItem('token');
    getAllBookings(token).then(({ data }) => {
      const total = data.length;
      const checkedIn = data.filter(b => b.status === 'CheckedIn').length;
      const checkedOut = data.filter(b => b.status === 'CheckedOut').length;
      const cancelled = data.filter(b => b.status === 'Cancelled').length;
      const guests = new Set(data.map(b => b.guest?._id || b.guest)).size;
      setStats({ total, checkedIn, checkedOut, cancelled, guests });
    });
  }, []);
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Dashboard Analytics</h3>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <li className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">Total Bookings: <strong>{stats.total}</strong></li>
        <li className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">Checked In: <strong className="text-green-700">{stats.checkedIn}</strong></li>
        <li className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">Checked Out: <strong>{stats.checkedOut}</strong></li>
        <li className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">Cancelled: <strong className="text-red-600">{stats.cancelled}</strong></li>
        <li className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">Unique Guests: <strong>{stats.guests}</strong></li>
      </ul>
    </div>
  );
};

export default DashboardAnalytics;
