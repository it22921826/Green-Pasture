import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addBrandedHeader, addGeneratedLine } from '../utils/pdfHeader';
import { getAllBookings } from '../api/bookingApi';
import BookingTable from '../components/BookingTable';
import AdminRefunds from '../components/AdminRefunds';
import FacilityBookingTable from '../components/FacilityBookingTable';
import Invoice from '../components/Invoice';
import UsersTable from '../components/UsersTable';
import FacilityManagementPanel from '../components/FacilityManagementPanel';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/roomApi';

const StaffDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomForm, setRoomForm] = useState({ roomNumber: '', type: 'Single', price: '', amenities: '', status: 'Available', photos: [], description: '', capacity: 2 });
  const [removePhotos, setRemovePhotos] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'reserved' | 'facility' | 'rooms' | 'invoices' | 'users' | 'refunds' | 'manageFacilities'

  useEffect(() => {
    const token = localStorage.getItem('token');
    getAllBookings(token)
      .then(({ data }) => {
        setBookings(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load bookings');
        setLoading(false);
      });
    // Load rooms for management
    getRooms().then((data)=> setRooms(data || [])).catch(()=>{});
  }, []);

  // Dashboard metrics
  const totalBookings = bookings.length;
  const todayBookings = (bookings || []).filter(b => {
    const todayStr = new Date().toDateString();
    const createdStr = b?.createdAt ? new Date(b.createdAt).toDateString() : null;
    const checkInStr = b?.checkIn ? new Date(b.checkIn).toDateString() : null;
    // Count if the booking was created today OR has a check-in today
    return createdStr === todayStr || checkInStr === todayStr;
  }).length;
  const MAX_ROOMS = 50;
  const atRoomLimit = (rooms?.length || 0) >= MAX_ROOMS;
  const filteredRooms = roomSearch.trim()
    ? rooms.filter(r => {
        const term = roomSearch.trim().toLowerCase();
        return (
          (r.roomNumber?.toString() || '').toLowerCase().includes(term) ||
          (r.type || '').toLowerCase().includes(term) ||
          (r.status || '').toLowerCase().includes(term) ||
          (Array.isArray(r.amenities) ? r.amenities.join(',') : r.amenities || '')
            .toString()
            .toLowerCase()
            .includes(term)
        );
      })
    : rooms;

  // Note: Bookings PDF export button removed per request.

  const downloadRoomsPdf = async () => {
    try {
      const doc = new jsPDF();
      const startY = await addBrandedHeader(doc, 'Rooms Inventory Report');
      addGeneratedLine(doc, startY, 'Generated');

      const head = [[ 'Room', 'Type', 'Price', 'Status', 'Capacity' ]];
  const body = (filteredRooms || []).map(r => [
        r.roomNumber ?? '-',
        r.type ?? '-',
  typeof r.price === 'number' ? formatCurrency(r.price) : r.price ?? '-',
        r.status ?? '-',
        r.capacity ?? '-'
      ]);
      autoTable(doc, { head, body, headStyles: { fillColor: [0,11,88], halign: 'center' }, styles: { fontSize: 9 }, startY });
      const date = new Date().toISOString().slice(0,10);
      doc.save(`rooms_${date}.pdf`);
    } catch (e) {
      console.error('rooms pdf error', e);
      alert('Failed to generate rooms PDF');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-start justify-center bg-neutral-100">
      <div className="mt-8 w-full max-w-5xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900">Staff/Admin Dashboard</h2>
        {/* Section toggle buttons */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'bookings' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('facility')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'facility' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
          >
            Facility Bookings
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'rooms' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
          >
            Manage Rooms
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'invoices' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'users' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
            title="View users"
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'refunds' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
            title="Manage refund requests"
          >
            Refunds
          </button>
          <button
            onClick={() => setActiveTab('reserved')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'reserved' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
            title="View reserved (pending) room bookings"
          >
            Reserved
          </button>
          {/* Facilities management within dashboard */}
          <button
            onClick={() => setActiveTab('manageFacilities')}
            className={`rounded px-4 py-2 text-sm font-medium shadow ${activeTab === 'manageFacilities' ? 'bg-[#000B58] text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}
            title="Manage Facilities"
          >
            Manage Facilities
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</div>
        )}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 text-center shadow-sm">
            <div className="text-[18px] font-semibold text-blue-600">Total Bookings</div>
            <div className="text-[32px] font-bold">{totalBookings}</div>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-5 text-center shadow-sm">
            <div className="text-[18px] font-semibold text-green-700">Today's Bookings</div>
            <div className="text-[32px] font-bold">{todayBookings}</div>
          </div>
        </div>
        {activeTab === 'bookings' && (
          <>
            {loading ? (
              <div className="my-8 text-center text-[18px] text-neutral-600">Loading bookings...</div>
            ) : (
              <BookingTable bookings={bookings} />
            )}
          </>
        )}

        {activeTab === 'reserved' && (
          <>
            <div className="mb-2 flex items-center justify-start">
              <h3 className="text-xl font-semibold text-neutral-900">Reserved Bookings</h3>
            </div>
            {loading ? (
              <div className="my-8 text-center text-[18px] text-neutral-600">Loading reservations...</div>
            ) : (
              <BookingTable bookings={(bookings || []).filter(b => (b.status === 'PendingPayment' || b.status === 'Pending'))} showStatusControl={false} />
            )}
          </>
        )}

        {/* Facility bookings table for Staff/Admin */}
        {activeTab === 'facility' && (
          <div className="mt-10">
            <h3 className="mb-4 text-xl font-semibold text-neutral-900">Facility Bookings</h3>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <FacilityBookingTable />
            </div>
          </div>
        )}

        {activeTab === 'manageFacilities' && (
          <div className="mt-10 space-y-6">
            <h3 className="text-xl font-semibold text-neutral-900">Manage Facilities</h3>
            {/* Management Panel: create/edit/delete + table */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <FacilityManagementPanel />
            </div>
          </div>
        )}

        {/* Invoices management */}
        {activeTab === 'invoices' && (
          <div className="mt-10">
            <h3 className="mb-4 text-xl font-semibold text-neutral-900">Manage Invoices</h3>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <Invoice />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="mt-10">
            <h3 className="mb-4 text-xl font-semibold text-neutral-900">Users</h3>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <UsersTable />
            </div>
          </div>
        )}

        {/* Refund management for Staff/Admin */}
        {activeTab === 'refunds' && (
          <div className="mt-10">
            <h3 className="mb-4 text-xl font-semibold text-neutral-900">Refund Requests</h3>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <AdminRefunds />
            </div>
          </div>
        )}

        {/* Rooms management for Staff/Admin */}
        {activeTab === 'rooms' && (
          <div className="mt-10">
            <h3 className="mb-4 text-xl font-semibold text-neutral-900">Manage Rooms</h3>
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex w-full max-w-md items-center gap-2">
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={e => setRoomSearch(e.target.value)}
                    placeholder="Search rooms (number, type, status, amenities)"
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-[#000B58] focus:outline-none"
                  />
                  {roomSearch && (
                    <button
                      type="button"
                      onClick={() => setRoomSearch('')}
                      className="rounded bg-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-400"
                    >Clear</button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500">
                    {roomSearch ? `${filteredRooms.length} / ${rooms.length} rooms` : `${rooms.length} rooms`}
                  </span>
                  <button onClick={downloadRoomsPdf} className="rounded bg-[#000B58] px-3 py-2 text-white shadow hover:bg-[#001050]">⬇️ PDF</button>
                </div>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (!editingRoom && atRoomLimit) {
                      alert(`Room limit reached (${MAX_ROOMS}). Delete a room before adding a new one.`);
                      return;
                    }
                    const token = localStorage.getItem('token');
                    // Client-side validation: require at least one photo
                    const keptExistingCount = (editingRoom && Array.isArray(editingRoom.photos))
                      ? editingRoom.photos.filter(src => !removePhotos.includes(src)).length
                      : 0;
                    const newUploadCount = Array.isArray(roomForm.photos) ? roomForm.photos.length : 0;
                    const totalAfter = keptExistingCount + newUploadCount;
                    if (totalAfter <= 0) {
                      alert('Please add at least one photo');
                      return;
                    }
                    const payload = {
                      roomNumber: roomForm.roomNumber,
                      type: roomForm.type,
                      price: roomForm.price,
                      amenities: roomForm.amenities ? JSON.stringify(roomForm.amenities.split(',').map(s=>s.trim()).filter(Boolean)) : '[]',
                      status: roomForm.status,
                      description: roomForm.description,
                      capacity: roomForm.capacity,
                      photos: roomForm.photos,
                      removePhotos: JSON.stringify(removePhotos),
                    };
                    if (editingRoom) {
                      await updateRoom(editingRoom._id, payload, token);
                    } else {
                      await createRoom(payload, token);
                    }
                    const refreshed = await getRooms();
                    setRooms(refreshed || []);
                    setEditingRoom(null);
                    setRoomForm({ roomNumber: '', type: 'Single', price: '', amenities: '', status: 'Available', photos: [], description: '', capacity: 2 });
                    setRemovePhotos([]);
                  } catch (err) {
                    alert(err.message || 'Failed to save room');
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <input value={roomForm.roomNumber} onChange={(e)=>setRoomForm({...roomForm, roomNumber:e.target.value})} placeholder="Room Number" className="border rounded px-3 py-2" required />
                <select value={roomForm.type} onChange={(e)=>setRoomForm({...roomForm, type:e.target.value})} className="border rounded px-3 py-2">
                  <option>Single</option>
                  <option>Double</option>
                  <option>Suite</option>
                </select>
                <input type="number" min="0" value={roomForm.price} onChange={(e)=>setRoomForm({...roomForm, price:e.target.value})} placeholder="Price" className="border rounded px-3 py-2" required />
                <input value={roomForm.amenities} onChange={(e)=>setRoomForm({...roomForm, amenities:e.target.value})} placeholder="Amenities (comma separated)" className="border rounded px-3 py-2 md:col-span-2" />
                <select value={roomForm.status} onChange={(e)=>setRoomForm({...roomForm, status:e.target.value})} className="border rounded px-3 py-2">
                  <option>Available</option>
                  <option>Booked</option>
                  <option>Maintenance</option>
                </select>
                <input type="number" min="1" value={roomForm.capacity} onChange={(e)=>setRoomForm({...roomForm, capacity:e.target.value})} placeholder="Capacity" className="border rounded px-3 py-2" />
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={(e)=>{
                    const incoming = Array.from(e.target.files);
                    const current = Array.from(roomForm.photos || []);
                    const keptExisting = (editingRoom && Array.isArray(editingRoom.photos)) ? editingRoom.photos.filter(src => !removePhotos.includes(src)).length : 0;
                    const maxNewAllowed = Math.max(0, 5 - keptExisting);
                    const allowedIncoming = incoming.slice(0, Math.max(0, maxNewAllowed - current.length));
                    const merged = [...current, ...allowedIncoming];
                    setRoomForm({...roomForm, photos: merged});
                  }} 
                  className="border rounded px-3 py-2 md:col-span-2" 
                  disabled={(editingRoom && Array.isArray(editingRoom.photos) ? editingRoom.photos.filter(src => !removePhotos.includes(src)).length : 0) + (roomForm.photos?.length || 0) >= 5}
                />
                <div className="md:col-span-3 text-xs text-gray-500">
                  {(() => {
                    const keptExisting = (editingRoom && Array.isArray(editingRoom.photos)) ? editingRoom.photos.filter(src => !removePhotos.includes(src)).length : 0;
                    const current = Array.from(roomForm.photos || []);
                    const remaining = Math.max(0, 5 - keptExisting - current.length);
                    return `${remaining} photo${remaining === 1 ? '' : 's'} remaining`;
                  })()}
                </div>
                {roomForm.photos && roomForm.photos.length > 0 && (
                  <div className="md:col-span-3 mt-2 flex flex-wrap gap-2">
                    {Array.from(roomForm.photos).map((file, index) => (
                      <div key={index} className="relative h-16 w-16 rounded overflow-hidden border border-gray-200">
                        <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const list = Array.from(roomForm.photos);
                            list.splice(index, 1);
                            setRoomForm({ ...roomForm, photos: list });
                          }}
                          className="absolute -top-2 -right-2 bg-white/90 text-red-600 rounded-full shadow p-1"
                          title="Remove"
                        >
                          ✂️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editingRoom && Array.isArray(editingRoom.photos) && editingRoom.photos.length > 0 && (
                  <div className="md:col-span-3 mt-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">Existing Photos</div>
                    <div className="flex flex-wrap gap-2">
                      {editingRoom.photos.map((src, i) => (
                        <div key={i} className="relative h-16 w-16 rounded overflow-hidden border border-gray-200">
                          <img src={src} alt={`Existing ${i}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setRemovePhotos((prev) => prev.includes(src) ? prev.filter(p => p !== src) : [...prev, src]);
                            }}
                            className={`absolute -top-2 -right-2 rounded-full shadow p-1 ${removePhotos.includes(src) ? 'bg-red-600 text-white' : 'bg-white/90 text-red-600'}`}
                            title={removePhotos.includes(src) ? 'Undo remove' : 'Remove photo'}
                          >
                            ✂️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <textarea value={roomForm.description} onChange={(e)=>setRoomForm({...roomForm, description:e.target.value})} placeholder="Description" className="border rounded px-3 py-2 md:col-span-3" />
                <div className="md:col-span-3 flex gap-3 items-center">
                  <button type="submit" disabled={!editingRoom && atRoomLimit} className={`px-4 py-2 rounded text-white ${(!editingRoom && atRoomLimit) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{editingRoom ? 'Update Room' : 'Add Room'}</button>
                  {!editingRoom && atRoomLimit && (
                    <span className="text-sm text-red-600">Maximum of {MAX_ROOMS} rooms reached.</span>
                  )}
                  {editingRoom && (
                    <button type="button" onClick={()=>{setEditingRoom(null); setRoomForm({ roomNumber: '', type: 'Single', price: '', amenities: '', status: 'Available', photos: [], description: '', capacity: 2 }); setRemovePhotos([]);}} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                  )}
                </div>
              </form>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRooms.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-6 text-center text-sm text-neutral-500">No rooms match your search.</td>
                      </tr>
                    )}
                    {filteredRooms.map((r) => (
                      <tr key={r._id || r.roomNumber}>
                        <td className="px-6 py-4 whitespace-nowrap">Room {r.roomNumber ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{r.type ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{typeof r.price === 'number' ? formatCurrency(r.price) : (r.price ?? '-')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{r.status ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                          <button className="text-blue-600 hover:text-blue-900" onClick={()=>{setEditingRoom(r); setRoomForm({ roomNumber: r.roomNumber || '', type: r.type || 'Single', price: r.price || '', amenities: (r.amenities||[]).join(','), status: r.status || 'Available', photos: [], description: r.description || '', capacity: r.capacity || 2 }); setRemovePhotos([]);}}>Edit</button>
                          <button className="text-red-600 hover:text-red-900" onClick={async()=>{ if(!window.confirm('Delete this room?')) return; try{ const token = localStorage.getItem('token'); await deleteRoom(r._id, token); const refreshed = await getRooms(); setRooms(refreshed||[]);}catch(err){ alert(err.message||'Failed to delete'); } }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
