import React, { useEffect, useState } from "react";
import { cancelBooking, setBookingStatus, deleteBooking } from "../api/bookingApi";
import { decodeToken } from "../utils/authHelper";
import RefundForm from './RefundForm';
import BookingForm from "../pages/BookingForm";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addBrandedHeader, addGeneratedLine } from '../utils/pdfHeader';

const BookingTable = ({ bookings: incoming, showStatusControl = true, actionMode = 'cancel' }) => {
  const [rows, setRows] = useState(incoming || []);
  const [filtered, setFiltered] = useState(incoming || []);
  const [actionId, setActionId] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [showRefundFor, setShowRefundFor] = useState(null);
  const [showBookingFor, setShowBookingFor] = useState(null);
  const token = localStorage.getItem('token');
  const user = token ? decodeToken(token) : null;
  const role = user?.role || user?.user?.role || ''; // handle nested user
  

  useEffect(() => {
    const base = Array.isArray(incoming) ? incoming : [];
    setRows(base);
    setSelected(new Set());
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
    // Staff/Admin: cancel directly without refund form
    if (role && ['Staff','Admin'].includes(role)) {
      await performCancel(id);
      return;
    }
    // Guests: show refund form BEFORE cancelling; only proceed on submit
    const booking = rows.find(r => r._id === id);
    if (!booking) return;
    setShowRefundFor(booking);
    // The actual cancellation will be performed in handleRefundSubmit
  };

  const performCancel = async (id) => {
    const token = localStorage.getItem("token");
    setActionId(`cancel:${id}`);
    const prev = rows;
    // Optimistic update after refund form submit
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

  const handleRefundSubmit = async () => {
    if (!showRefundFor) return;
    const id = showRefundFor._id;
    await performCancel(id);
  };

  const remove = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking?')) return;
    const token = localStorage.getItem("token");
    setActionId(`delete:${id}`);
    const prev = rows;
    // Optimistic remove
    setRows(p => p.filter(r => r._id !== id));
    try {
      await deleteBooking(id, token);
    } catch (err) {
      setRows(prev);
      alert(err?.response?.data?.message || err?.message || 'Failed to delete booking');
    } finally {
      setActionId('');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(prev => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map(b => b._id));
    });
  };

  const removeSelected = async () => {
    if (!role || !['Staff','Admin'].includes(role)) return;
    const ids = Array.from(selected);
    if (!ids.length) return alert('No bookings selected');
    if (!window.confirm(`Delete ${ids.length} selected booking(s)? This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in as Staff/Admin to delete bookings.');
      return;
    }
    // Optimistic remove
    const prevRows = rows;
    setRows(p => p.filter(r => !selected.has(r._id)));
    setSelected(new Set());
    // Execute in parallel and handle partial failures
    const results = await Promise.allSettled(ids.map(id => deleteBooking(id, token)));
    const failed = results
      .map((r, i) => ({ r, id: ids[i] }))
      .filter(x => x.r.status === 'rejected');
    if (failed.length > 0) {
      // Restore failed rows
      const failedIds = new Set(failed.map(f => f.id));
      const failedRows = prevRows.filter(r => failedIds.has(r._id));
      setRows(current => [...current, ...failedRows].sort((a,b)=>String(a._id).localeCompare(String(b._id))));
      const firstErr = failed[0].r.reason;
      const msg = firstErr?.response?.data?.message || firstErr?.message || 'Some deletions failed';
      alert(`${failed.length} of ${ids.length} deletion(s) failed: ${msg}`);
    }
  };

  const downloadPdf = async () => {
    try {
      const doc = new jsPDF();
      const startY = await addBrandedHeader(doc, 'Room Bookings Report');
      addGeneratedLine(doc, startY, 'Generated');
      const head = [[ 'Room', 'Check-In', 'Check-Out', 'Status', 'Guest', 'Requests' ]];
      const body = (filtered || []).map(b => [
        b.roomNumber ?? '-',
        b.checkIn ? new Date(b.checkIn).toLocaleDateString() : '-',
        b.checkOut ? new Date(b.checkOut).toLocaleDateString() : '-',
        friendlyStatus(b.status) ?? '-',
        (b.guest && (b.guest.name || b.guest)) || '-',
        b.specialRequests || '-'
      ]);
      autoTable(doc, { head, body, headStyles: { fillColor: [0,11,88], halign: 'center' }, styles: { fontSize: 9 }, startY });
      const date = new Date().toISOString().slice(0,10);
      doc.save(`room_bookings_${date}.pdf`);
    } catch (e) {
      console.error('bookings pdf error', e);
      alert('Failed to generate bookings PDF');
    }
  };

  return (
    <div className="mt-5 overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search bookings (guest, room, status, requests)"
          className="w-full max-w-md rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-[#000B58] focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-500">
            {search ? `${filtered.length} / ${rows.length} shown` : `${rows.length} total`}
          </div>
          <button
            type="button"
            onClick={downloadPdf}
            className="rounded bg-[#000B58] px-3 py-1.5 text-white shadow hover:bg-[#001050]"
            title="Download filtered bookings as PDF"
          >
            ⬇️ PDF
          </button>
          {role && ['Staff','Admin'].includes(role) && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" onChange={toggleSelectAll} checked={selected.size>0 && selected.size===filtered.length} />
                Select All
              </label>
              <button
                type="button"
                onClick={removeSelected}
                disabled={selected.size === 0}
                className="rounded bg-neutral-700 px-3 py-1 text-white shadow disabled:cursor-not-allowed disabled:opacity-60 hover:bg-neutral-800"
                title="Delete selected bookings"
              >
                Delete selected
              </button>
            </div>
          )}
        </div>
      </div>
  <table className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow">
        <thead>
          <tr className="bg-[#000B58] text-white">
            {role && ['Staff','Admin'].includes(role) && (
              <th className="px-5 py-3 text-sm font-bold">Select</th>
            )}
            <th className="px-5 py-3 text-sm font-bold">Room</th>
            <th className="px-5 py-3 text-sm font-bold">Check-In</th>
            <th className="px-5 py-3 text-sm font-bold">Check-Out</th>
            <th className="px-5 py-3 text-sm font-bold">Status</th>
            <th className="px-5 py-3 text-sm font-bold">Guest</th>
            <th className="px-5 py-3 text-sm font-bold">Requests</th>
            <th className="px-5 py-3 text-sm font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((b, i) => (
            <tr key={b._id} className={i % 2 === 0 ? "bg-neutral-50 hover:bg-blue-50" : "bg-white hover:bg-blue-50"}>
              {role && ['Staff','Admin'].includes(role) && (
                <td className="px-5 py-3 text-sm text-neutral-800">
                  <input type="checkbox" checked={selected.has(b._id)} onChange={() => toggleSelect(b._id)} />
                </td>
              )}
              <td className="px-5 py-3 text-sm text-neutral-800">{b.roomNumber}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.checkIn && new Date(b.checkIn).toLocaleDateString()}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.checkOut && new Date(b.checkOut).toLocaleDateString()}</td>
              <td className={`px-5 py-3 text-sm font-semibold ${statusColorClass(b.status)}`}>{friendlyStatus(b.status)}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.guest?.name || b.guest}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.specialRequests || "-"}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">
                <div className="flex flex-wrap gap-2 items-center">
                  {showStatusControl && role && ['Staff','Admin'].includes(role) && b.status !== 'Cancelled' && (
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
                  {actionMode === 'book' ? (
                    <button
                      type="button"
                      onClick={() => setShowBookingFor(b)}
                      className="rounded bg-blue-600 px-3 py-1 text-white shadow hover:bg-blue-700"
                      title="Create a new booking for this room"
                    >
                      Book
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cancel(b._id)}
                      disabled={actionId === `cancel:${b._id}` || b.status === "Cancelled"}
                      className="rounded bg-red-600 px-3 py-1 text-white shadow disabled:cursor-not-allowed disabled:opacity-60 hover:bg-red-700"
                      title={b.status === "Cancelled" ? "Already cancelled" : "Cancel booking"}
                    >
                      {actionId === `cancel:${b._id}` ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                  
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showRefundFor && !(role && ['Staff','Admin'].includes(role)) && (
        <RefundForm
          booking={showRefundFor}
          onClose={() => setShowRefundFor(null)}
          onSubmit={handleRefundSubmit}
        />
      )}
      {showBookingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh]">
            <button
              onClick={() => setShowBookingFor(null)}
              className="absolute -top-2 -right-2 z-10 rounded-full bg-white px-3 py-1 text-sm shadow"
            >
              ✕
            </button>
            <div className="rounded-xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
              <BookingForm
                roomNumber={showBookingFor.roomNumber}
                mode="book"
                onSuccess={() => setShowBookingFor(null)}
                embedded
              />
            </div>
          </div>
        </div>
      )}
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
