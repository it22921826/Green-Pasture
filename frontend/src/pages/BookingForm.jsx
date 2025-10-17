import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking, getRoomAvailability } from '../api/bookingApi';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

const BookingForm = ({ roomNumber: presetRoomNumber = '', roomPrice = null, mode = 'book', onSuccess, embedded = false }) => {
  const [form, setForm] = useState({ roomNumber: presetRoomNumber || '', checkIn: '', checkOut: '', specialRequests: '' });
  const [price] = useState(roomPrice); // snapshot provided
  // Simple room customization catalog
  const ADDONS = [
    { id: 'birthday', label: 'Birthday Decoration', price: 5000 },
    { id: 'flowers', label: 'Flower Bouquet', price: 2500 },
    { id: 'airport', label: 'Airport Pickup', price: 7000 },
    { id: 'extraBed', label: 'Extra Bed (per night)', pricePerNight: 3000 },
  ];
  const [addons, setAddons] = useState({}); // id -> true/false
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

  // Load availability ranges for the selected room
  const [blockedRanges, setBlockedRanges] = useState([]); // [{start,end}]
  useEffect(() => {
    const rn = form.roomNumber || presetRoomNumber;
    if (!rn) { setBlockedRanges([]); return; }
    let ignore = false;
    (async () => {
      try {
        const data = await getRoomAvailability(rn);
        if (!ignore && data && Array.isArray(data.ranges)) setBlockedRanges(data.ranges);
      } catch (_) { if (!ignore) setBlockedRanges([]); }
    })();
    return () => { ignore = true; };
  }, [form.roomNumber, presetRoomNumber]);

  const isBlocked = (iso) => {
    const d = new Date(iso);
    return blockedRanges.some(r => d >= new Date(r.start) && d < new Date(r.end));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nights = form.checkIn && form.checkOut ? Math.max(0, (new Date(form.checkOut) - new Date(form.checkIn)) / (1000*60*60*24)) : 0;
  const roomBase = price && nights > 0 ? price * nights : 0;
  const addOnsTotal = useMemo(() => {
    const selected = ADDONS.filter(a => addons[a.id]);
    return selected.reduce((sum, a) => sum + (a.pricePerNight ? (a.pricePerNight * nights) : (a.price || 0)), 0);
  }, [addons, nights]);
  const computedAmount = roomBase + addOnsTotal;
  const isReserve = mode === 'reserve';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError(isReserve ? 'Please log in to reserve a room.' : 'Please log in to book a room.');
      setLoading(false);
      return;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError('Check-out date must be after check-in date.');
      setLoading(false);
      return;
    }
    try {
      // Merge selected add-ons into special requests for persistence
      const selectedAddons = ADDONS.filter(a => addons[a.id]);
      const addonsSummary = selectedAddons.length
        ? `Add-ons: ${selectedAddons.map(a => `${a.label}${a.pricePerNight ? ` (x${nights} nights)` : ''}`).join(', ')}`
        : '';
      const requestPayload = {
        ...form,
        specialRequests: [addonsSummary, form.specialRequests].filter(Boolean).join(' | '),
      };
  const res = await createBooking(requestPayload, token);
  const resultPayload = res?.data || res; // Expect { booking, updatedRoom }
  const booking = resultPayload.booking || resultPayload; // fallback if older shape
      if (mode === 'reserve') {
        setSuccess('Reservation created successfully!');
  if (onSuccess) onSuccess(booking, resultPayload.updatedRoom);
      } else {
        setSuccess('Booking created successfully! Redirecting to payment...');
  if (onSuccess) onSuccess(booking, resultPayload.updatedRoom);
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
      }
  setForm({ roomNumber: presetRoomNumber || '', checkIn: '', checkOut: '', specialRequests: '' });
      setAddons({});
    } catch (err) {
      setError('Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const formCard = (
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900">{isReserve ? 'Create Reservation' : 'Create Booking'}</h2>
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
            {form.checkIn && isBlocked(form.checkIn) && (
              <p className="mt-1 text-xs text-red-600">Selected check-in overlaps an unavailable date.</p>
            )}
            {form.checkOut && isBlocked(new Date(new Date(form.checkOut).getTime() - 24*60*60*1000)) && (
              <p className="mt-1 text-xs text-red-600">Selected check-out overlaps an unavailable date.</p>
            )}
          </div>
          <div className="mb-6">
            <label className="mb-1 block font-medium">Availability</label>
            <AvailabilityCalendar
              blockedRanges={blockedRanges}
              valueStart={form.checkIn}
              valueEnd={form.checkOut}
              onChange={({ start, end }) => setForm(prev => ({ ...prev, checkIn: start || '', checkOut: end || '' }))}
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
                value={nights > 0 ? `Rs. ${computedAmount.toLocaleString()} (${nights} night${nights!==1?'s':''}${addOnsTotal>0?` + add-ons`:''})` : ''}
                placeholder="Select dates to see total"
                className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-[15px] outline-none" />
              {addOnsTotal > 0 && (
                <p className="mt-1 text-xs text-neutral-700">Includes add-ons: Rs. {addOnsTotal.toLocaleString()}</p>
              )}
            </div>
          )}
          {/* Room customization options */}
          <div className="mb-6">
            <label className="mb-2 block font-medium">Room Customization</label>
            <div className="grid grid-cols-1 gap-2">
              {ADDONS.map((a) => (
                <label key={a.id} className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2 text-sm">
                  <span>
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={!!addons[a.id]}
                      onChange={(e) => setAddons(prev => ({ ...prev, [a.id]: e.target.checked }))}
                    />
                    {a.label}
                  </span>
                  <span className="text-neutral-700">Rs. {(a.pricePerNight ? (a.pricePerNight * Math.max(1, nights)) : a.price).toLocaleString()}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || (price != null && computedAmount <= 0)}
            className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-500"
          >
            {isReserve ? (loading ? 'Reserving...' : 'Reserve') : (loading ? 'Booking...' : 'Book')}
          </button>
        </form>
      </div>
  );

  if (embedded) return formCard;
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-neutral-100">{formCard}</div>
  );
};

export default BookingForm;
