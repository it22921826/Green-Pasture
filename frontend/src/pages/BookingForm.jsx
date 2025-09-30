import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../api/bookingApi';

const BookingForm = ({ roomNumber: presetRoomNumber = '', roomPrice = null, onSuccess }) => {
  const [form, setForm] = useState({ roomNumber: presetRoomNumber || '', checkIn: '', checkOut: '', specialRequests: '' });
  const [price] = useState(roomPrice); // snapshot provided
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // When parent provides/changes a room number, prefill and lock that field
    if (presetRoomNumber) {
      setForm((prev) => ({ ...prev, roomNumber: presetRoomNumber }));
    }
  }, [presetRoomNumber]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nights = form.checkIn && form.checkOut ? Math.max(0, (new Date(form.checkOut) - new Date(form.checkIn)) / (1000*60*60*24)) : 0;
  const computedAmount = price && nights > 0 ? price * nights : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to book a room.');
      setLoading(false);
      return;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError('Check-out date must be after check-in date.');
      setLoading(false);
      return;
    }
    try {
  const res = await createBooking(form, token);
  const payload = res?.data || res; // Expect { booking, updatedRoom }
  const booking = payload.booking || payload; // fallback if older shape
      setSuccess('Booking created successfully! Redirecting to payment...');
  if (onSuccess) onSuccess(booking, payload.updatedRoom);
      // Use computedAmount if available
      setTimeout(() => {
        navigate('/payment', {
          state: {
            roomNumber: booking.roomNumber,
            bookingId: booking._id,
            amount: computedAmount,
            source: 'room-booking'
          }
        });
      }, 600);
  setForm({ roomNumber: presetRoomNumber || '', checkIn: '', checkOut: '', specialRequests: '' });
    } catch (err) {
      setError('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-neutral-100">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900">Create Booking</h2>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-center text-sm text-green-700">{success}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="roomNumber" className="mb-1 block font-medium">Room Number</label>
            <input
              name="roomNumber"
              id="roomNumber"
              placeholder="Room Number"
              value={form.roomNumber}
              onChange={handleChange}
              required
              readOnly={!!presetRoomNumber}
              className={`w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500 ${presetRoomNumber ? 'bg-neutral-100 cursor-not-allowed' : ''}`}
            />
            {price != null && (
              <p className="mt-1 text-xs text-green-700">Nightly Rate: Rs. {price.toLocaleString()}</p>) }
          </div>
          <div className="mb-5">
            <label htmlFor="checkIn" className="mb-1 block font-medium">Check-In Date</label>
            <input
              name="checkIn"
              id="checkIn"
              type="date"
              value={form.checkIn}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="checkOut" className="mb-1 block font-medium">Check-Out Date</label>
            <input
              name="checkOut"
              id="checkOut"
              type="date"
              value={form.checkOut}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="specialRequests" className="mb-1 block font-medium">Special Requests</label>
            <input
              name="specialRequests"
              id="specialRequests"
              placeholder="Special Requests"
              value={form.specialRequests}
              onChange={handleChange}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>
          {price != null && (
            <div className="mb-5">
              <label className="mb-1 block font-medium">Estimated Total</label>
              <input
                readOnly
                value={nights > 0 ? `Rs. ${computedAmount.toLocaleString()} (${nights} night${nights!==1?'s':''})` : ''}
                placeholder="Select dates to see total"
                className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-[15px] outline-none" />
            </div>
          )}
          <button
            type="submit"
            disabled={loading || (price != null && computedAmount <= 0)}
            className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-500"
          >
            {loading ? 'Booking...' : 'Book'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
