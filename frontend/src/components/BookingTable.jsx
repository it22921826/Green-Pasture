import React, { useEffect, useState } from "react";
import { cancelBooking, setBookingStatus } from "../api/bookingApi";
import { decodeToken } from "../utils/authHelper";

const BookingTable = ({ bookings: incoming }) => {
  const [rows, setRows] = useState(incoming || []);
  const [filtered, setFiltered] = useState(incoming || []);
  const [actionId, setActionId] = useState("");
  const [search, setSearch] = useState("");
  const token = localStorage.getItem('token');
  const user = token ? decodeToken(token) : null;
  const role = user?.role || user?.user?.role || ''; // handle nested user

  useEffect(() => {
    const base = Array.isArray(incoming) ? incoming : [];
    setRows(base);
  }, [incoming]);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    if (!term) return setFiltered(rows);
    setFiltered(
      rows.filter(b => {
        const guest = (b.guest?.name || b.guest || '').toString().toLowerCase();
        const staff = (b.staff?.name || b.staff || '').toString().toLowerCase();
        const room = (b.roomNumber ?? '').toString().toLowerCase();
        const status = (b.status || '').toLowerCase();
        const req = (b.specialRequests || '').toLowerCase();
        return guest.includes(term) || staff.includes(term) || room.includes(term) || status.includes(term) || req.includes(term);
      })
    );
  }, [search, rows]);

  const cancel = async (id) => {
    const token = localStorage.getItem("token");
    setActionId(`cancel:${id}`);
    // Optimistic update
    const prev = rows;
    setRows((p) => p.map(r => r._id === id ? { ...r, status: 'Cancelled' } : r));
    try {
      const { data } = await cancelBooking(id, token);
      const roomNumber = data?.booking?.roomNumber || prev.find(r=>r._id===id)?.roomNumber;
      if (roomNumber) {
        window.dispatchEvent(new CustomEvent('room:freed', { detail: { roomNumber } }));
      }
    } catch (err) {
      // Revert on failure
      setRows(prev);
      alert(err?.response?.data?.message || err?.message || 'Failed to cancel booking');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="mt-5 overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search bookings (guest, staff, room, status, requests)"
          className="w-full max-w-md rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-[#000B58] focus:outline-none"
        />
        <div className="text-xs text-neutral-500">
          {search ? `${filtered.length} / ${rows.length} shown` : `${rows.length} total`}
        </div>
      </div>
      <table className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow">
        <thead>
          <tr className="bg-[#000B58] text-white">
            <th className="px-5 py-3 text-sm font-bold">Room</th>
            <th className="px-5 py-3 text-sm font-bold">Check-In</th>
            <th className="px-5 py-3 text-sm font-bold">Check-Out</th>
            <th className="px-5 py-3 text-sm font-bold">Status</th>
            <th className="px-5 py-3 text-sm font-bold">Guest</th>
            <th className="px-5 py-3 text-sm font-bold">Staff</th>
            <th className="px-5 py-3 text-sm font-bold">Requests</th>
            <th className="px-5 py-3 text-sm font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((b, i) => (
            <tr key={b._id} className={i % 2 === 0 ? "bg-neutral-50 hover:bg-blue-50" : "bg-white hover:bg-blue-50"}>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.roomNumber}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.checkIn && new Date(b.checkIn).toLocaleDateString()}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.checkOut && new Date(b.checkOut).toLocaleDateString()}</td>
              <td className={`px-5 py-3 text-sm font-semibold ${statusColorClass(b.status)}`}>{friendlyStatus(b.status)}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.guest?.name || b.guest}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.staff?.name || b.staff}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.specialRequests || "-"}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">
                <div className="flex flex-wrap gap-2 items-center">
                  {role && ['Staff','Admin'].includes(role) && b.status !== 'Cancelled' && (
                    <div className="relative">
                      <select
                        value={mapInternalToUiStatus(b.status)}
                        onChange={async (e) => {
                          const uiVal = e.target.value; // 'Approved' | 'Pending'
                          if (uiVal === 'Cancelled') return;
                          const prev = rows;
                          const newInternal = uiVal === 'Approved' ? 'Booked' : 'PendingPayment';
                          setRows(p => p.map(r => r._id === b._id ? { ...r, status: newInternal } : r));
                          try {
                            await setBookingStatus(b._id, uiVal, token);
                          } catch (err) {
                            setRows(prev);
                            alert(err?.response?.data?.message || err.message || 'Failed to update status');
                          }
                        }}
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs focus:border-[#000B58] focus:outline-none"
                      >
                        <option value="Approved">Approve</option>
                        <option value="Pending">Pending</option>
                        {b.status === 'Cancelled' && <option value="Cancelled">Cancelled</option>}
                      </select>
                    </div>
                  )}
                  <button
                      type="button"
                      onClick={() => cancel(b._id)}
                      disabled={actionId === `cancel:${b._id}` || b.status === "Cancelled"}
                      className="rounded bg-red-600 px-3 py-1 text-white shadow disabled:cursor-not-allowed disabled:opacity-60 hover:bg-red-700"
                      title={b.status === "Cancelled" ? "Already cancelled" : "Cancel booking"}
                    >
                      {actionId === `cancel:${b._id}` ? "Cancelling..." : "Cancel"}
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const statusColorClass = (status) => {
  const internal = status;
  switch (internal) {
    case 'Booked':
    case 'Confirmed':
      return 'text-green-600';
    case 'PendingPayment':
    case 'Pending':
      return 'text-orange-600';
    case 'Cancelled':
      return 'text-red-600';
    default:
      return 'text-neutral-700';
  }
};

const friendlyStatus = (status) => {
  if (status === 'Booked') return 'Approved';
  if (status === 'PendingPayment') return 'Pending';
  return status; // Cancelled or already user-friendly
};

// Map internal statuses to dropdown UI values
const mapInternalToUiStatus = (status) => {
  if (status === 'Booked' || status === 'Confirmed') return 'Approved';
  if (status === 'PendingPayment' || status === 'Pending') return 'Pending';
  if (status === 'Cancelled') return 'Cancelled';
  return 'Pending';
};

export default BookingTable;