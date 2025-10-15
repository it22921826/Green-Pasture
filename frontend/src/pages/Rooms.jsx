import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { decodeToken } from '../utils/authHelper';
import BookingForm from './BookingForm';
import { getRooms } from '../api/roomApi';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const user = token ? decodeToken(token) : null;
  const role = (user?.role || user?.user?.role || '').toLowerCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ type: '', status: '', minPrice: '', maxPrice: '' });

  const fetchRooms = async () => {
    try {
      setLoading(true);
  const data = await getRooms(filters);
  setRooms(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        // initial load without relying on external dependencies
  const data = await getRooms({});
        if (!isMounted) return;
  setRooms(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!isMounted) return;
        setError(e.message || 'Failed to load rooms');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();
    const handleFreed = (e) => {
      const rn = String(e.detail?.roomNumber || '').trim();
      if (!rn) return;
      setRooms(prev => prev.map(r => (String(r.roomNumber).trim() === rn ? { ...r, status: 'Available' } : r)));
      // Light refetch after short delay to ensure backend persisted state
      setTimeout(() => { fetchRooms(); }, 600);
    };
    window.addEventListener('room:freed', handleFreed);
    return () => { isMounted = false; window.removeEventListener('room:freed', handleFreed); };
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const [selectedRoom, setSelectedRoom] = useState(null);

  const closeForm = () => setSelectedRoom(null);

  // Optimistic update when booking succeeds
  const handleBookingSuccess = (booking, updatedRoom) => {
    const bookedNumber = (booking && booking.roomNumber ? String(booking.roomNumber) : '').trim();
    console.log('[BookingSuccess] booking:', booking);
    console.log('[BookingSuccess] updatedRoom:', updatedRoom);
    const updateFn = (r => {
      const rn = (r.roomNumber || '').trim();
      if (updatedRoom && updatedRoom._id && r._id === updatedRoom._id) return { ...r, status: updatedRoom.status };
      // Do not globally flip status to 'Booked'; availability is date-based
      if (bookedNumber && rn === bookedNumber) return r;
      return r;
    });
    setRooms(prev => prev.map(updateFn));
    closeForm();
    // Always refetch quickly to sync and override any stale copy
    setTimeout(() => { fetchRooms(); }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">All Rooms</h1>
          <p className="text-gray-600">Browse all rooms and filter by type, price, and status.</p>
        </div>

        <form onSubmit={applyFilters} className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select name="type" value={filters.type} onChange={handleFilterChange} className="border rounded px-3 py-2">
            <option value="">All Types</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="border rounded px-3 py-2">
            <option value="">Any Status</option>
            <option value="Available">Available</option>
            <option value="Booked">Booked</option>
            <option value="Maintenance">Maintenance</option>
          </select>
          <input name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min Price" className="border rounded px-3 py-2" />
          <input name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max Price" className="border rounded px-3 py-2" />
          <div className="md:col-span-4 flex gap-3">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply Filters</button>
            <button type="button" onClick={() => { setFilters({ type: '', status: '', minPrice: '', maxPrice: '' }); fetchRooms(); }} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Reset</button>
          </div>
        </form>

        {loading ? (
          <div className="text-center text-gray-600">Loading rooms...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room._id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                <Link to={`/rooms/${room._id}`} className="block">
                  {room.photos && room.photos[0] ? (
                    // photos are served from /uploads
                    <img src={room.photos[0]} alt={`Room ${room.roomNumber}`} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">No photo</div>
                  )}
                </Link>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
                    <span className="text-blue-600 font-bold">{formatCurrency(room.price)}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{room.type}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(room.amenities || []).slice(0, 3).map((a, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{a}</span>
                    ))}
                    {(room.amenities || []).length > 3 && (
                      <span className="text-xs text-gray-500">+{room.amenities.length - 3} more</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    {role !== 'staff' && role !== 'admin' && (
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                        onClick={() => setSelectedRoom(room)}
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-full max-w-lg">
              <button onClick={closeForm} className="absolute -top-2 -right-2 z-10 rounded-full bg-white px-3 py-1 text-sm shadow">Close</button>
              <div className="rounded-xl bg-white shadow-2xl">
                <BookingForm roomNumber={selectedRoom.roomNumber} roomPrice={selectedRoom.price} onSuccess={handleBookingSuccess} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rooms;
