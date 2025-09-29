import React, { useEffect, useState } from "react";
import { updateBooking } from "../api/bookingApi";

const BookingTable = ({ bookings: incoming }) => {
  const [rows, setRows] = useState(incoming || []);
  const [actionId, setActionId] = useState("");

  useEffect(() => {
    setRows(Array.isArray(incoming) ? incoming : []);
  }, [incoming]);

  const cancel = async (id) => {
    try {
      setActionId(`cancel:${id}`);
      const token = localStorage.getItem("token");
      await updateBooking(id, { status: "Cancelled" }, token);
      // Only update the status locally to preserve populated guest/staff objects
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: "Cancelled" } : r)));
    } catch (err) {
      alert(err?.message || "Failed to cancel booking");
    } finally {
      setActionId("");
    }
  };

  return (
    <div className="mt-5 overflow-x-auto">
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
          {rows.map((b, i) => (
            <tr key={b._id} className={i % 2 === 0 ? "bg-neutral-50 hover:bg-blue-50" : "bg-white hover:bg-blue-50"}>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.roomNumber}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.checkIn && new Date(b.checkIn).toLocaleDateString()}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.checkOut && new Date(b.checkOut).toLocaleDateString()}</td>
              <td className={`px-5 py-3 text-sm font-semibold ${statusColorClass(b.status)}`}>{b.status}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.guest?.name || b.guest}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.staff?.name || b.staff}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{b.specialRequests || "-"}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">
                <div className="flex flex-wrap gap-2">
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
  switch (status) {
    case "Confirmed":
      return "text-green-600";
    case "Pending":
      return "text-orange-600";
    case "Cancelled":
      return "text-red-600";
    default:
      return "text-neutral-700";
  }
};

export default BookingTable;