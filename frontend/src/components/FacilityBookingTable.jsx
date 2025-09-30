import React, { useEffect, useState } from "react";
import { formatCurrency } from '../utils/currency';
import { getAllFacilityBookings, updateFacilityBooking, cancelFacilityBooking } from "../api/facilityApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addBrandedHeader, addGeneratedLine } from '../utils/pdfHeader';

const FacilityBookingTable = ({ bookings: incoming }) => {
	const [bookings, setBookings] = useState(incoming || []);
	const [filtered, setFiltered] = useState(incoming || []);
	const [loading, setLoading] = useState(!incoming);
	const [error, setError] = useState("");
	const [actionId, setActionId] = useState(""); // row-level loading indicator
	const [search, setSearch] = useState("");

	useEffect(() => {
		if (incoming && Array.isArray(incoming)) return; // use provided data
		const token = localStorage.getItem("token");
		if (!token) {
			setError("Not authorized");
			setLoading(false);
			return;
		}
		(async () => {
			try {
				const data = await getAllFacilityBookings(token);
				const base = Array.isArray(data) ? data : [];
				setBookings(base);
			} catch (err) {
				setError(err?.message || "Failed to load facility bookings");
			} finally {
				setLoading(false);
			}
		})();
	}, [incoming]);

	useEffect(() => {
		setFiltered(bookings);
	}, [bookings]);

	useEffect(() => {
		const term = search.trim().toLowerCase();
		if (!term) return setFiltered(bookings);
		setFiltered(bookings.filter(b => {
			const ref = (b.bookingReference || '').toLowerCase();
			const facility = (b.facility?.name || b.facility || '').toString().toLowerCase();
			const type = (b.facility?.type || '').toLowerCase();
			const guest = (b.guest?.name || b.guest || '').toString().toLowerCase();
			const status = (b.status || '').toLowerCase();
			return ref.includes(term) || facility.includes(term) || type.includes(term) || guest.includes(term) || status.includes(term);
		}));
	}, [search, bookings]);

	if (loading) return <div className="my-8 text-center text-[18px] text-neutral-600">Loading facility bookings...</div>;
	if (error)
		return (
			<div className="my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">
				{error}
			</div>
		);
	if (!bookings || bookings.length === 0)
		return <div className="my-4 text-center text-neutral-600">No facility bookings found.</div>;

	const downloadPdf = async () => {
		try {
			const doc = new jsPDF();
			const startY = await addBrandedHeader(doc, 'Facility Bookings Report');
			addGeneratedLine(doc, startY, 'Generated');

			const head = [[
				"Reference",
				"Facility",
				"Type",
				"Location",
				"Check-In",
				"Check-Out",
				"Guests",
				"Status",
				"Guest",
				"Amount",
			]];
			const body = bookings.map((b) => [
				b.bookingReference || "-",
				b.facility?.name || "-",
				b.facility?.type || "-",
				b.facility?.location || "-",
				formatDate(b.checkIn),
				formatDate(b.checkOut),
				b.numberOfGuests ?? "-",
				b.status || "-",
				b.guest?.name || "-",
				typeof b.finalAmount === "number" ? formatCurrency(b.finalAmount) : "-",
			]);

			autoTable(doc, {
				head,
				body,
				styles: { fontSize: 9 },
				headStyles: { fillColor: [0, 11, 88], halign: 'center' },
				startY,
			});

			const date = new Date().toISOString().slice(0, 10);
			doc.save(`facility_bookings_${date}.pdf`);
		} catch (e) {
			console.error("PDF generation failed", e);
			alert("Failed to generate PDF");
		}
	};

	const handleApprove = async (id) => {
		try {
			setActionId(`approve:${id}`);
			const token = localStorage.getItem("token");
			const updated = await updateFacilityBooking(id, { status: "Confirmed" }, token);
			setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...updated } : b)));
		} catch (err) {
			alert(err?.message || "Failed to approve booking");
		} finally {
			setActionId("");
		}
	};

	const handleCancel = async (id) => {
		try {
			setActionId(`cancel:${id}`);
			const token = localStorage.getItem("token");
			await cancelFacilityBooking(id, token);
			setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "Cancelled" } : b)));
		} catch (err) {
			alert(err?.message || "Failed to cancel booking");
		} finally {
			setActionId("");
		}
	};

	return (
		<div className="mt-5 overflow-x-auto">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<input
					type="text"
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder="Search facility bookings (reference, facility, type, guest, status)"
					className="w-full max-w-xl rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-[#000B58] focus:outline-none"
				/>
				<div className="text-xs text-neutral-500">{search ? `${filtered.length} / ${bookings.length} shown` : `${bookings.length} total`}</div>
			</div>
			<div className="mb-3 flex items-center justify-end">
				<button
					type="button"
					onClick={downloadPdf}
					className="rounded bg-[#000B58] px-3 py-2 text-white shadow hover:bg-[#001050]"
					title="Download Facility Bookings PDF"
				>
					⬇️ Download PDF
				</button>
			</div>
			<table className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow">
				<thead>
					<tr className="bg-[#000B58] text-white">
						<th className="px-5 py-3 text-sm font-bold">Reference</th>
						<th className="px-5 py-3 text-sm font-bold">Facility</th>
						<th className="px-5 py-3 text-sm font-bold">Type</th>
						<th className="px-5 py-3 text-sm font-bold">Location</th>
						<th className="px-5 py-3 text-sm font-bold">Check-In</th>
						<th className="px-5 py-3 text-sm font-bold">Check-Out</th>
						<th className="px-5 py-3 text-sm font-bold">Guests</th>
						<th className="px-5 py-3 text-sm font-bold">Status</th>
						<th className="px-5 py-3 text-sm font-bold">Guest</th>
						<th className="px-5 py-3 text-sm font-bold">Amount</th>
						<th className="px-5 py-3 text-sm font-bold">Actions</th>
					</tr>
				</thead>
				<tbody>
					{filtered.map((b, i) => (
						<tr
							key={b._id || b.bookingReference || i}
							className={i % 2 === 0 ? "bg-neutral-50 hover:bg-blue-50" : "bg-white hover:bg-blue-50"}
						>
							<td className="px-5 py-3 text-sm text-neutral-800">{b.bookingReference || "-"}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{b.facility?.name || b.facility || "-"}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{b.facility?.type || "-"}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{b.facility?.location || "-"}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{formatDate(b.checkIn)}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{formatDate(b.checkOut)}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{b.numberOfGuests ?? "-"}</td>
							<td className={`px-5 py-3 text-sm font-semibold ${statusColorClass(b.status)}`}>{b.status}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{b.guest?.name || b.guest || "-"}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">{formatCurrency(b.finalAmount)}</td>
							<td className="px-5 py-3 text-sm text-neutral-800">
								<div className="flex flex-wrap gap-2">
									<button
										type="button"
										onClick={() => handleApprove(b._id)}
										disabled={
											actionId === `approve:${b._id}` || b.status !== "Pending"
										}
										className="rounded bg-green-600 px-3 py-1 text-white shadow disabled:cursor-not-allowed disabled:opacity-60 hover:bg-green-700"
										title={b.status !== "Pending" ? "Only pending bookings can be approved" : "Approve booking"}
									>
										{actionId === `approve:${b._id}` ? "Approving..." : "Approve"}
									</button>
									<button
										type="button"
										onClick={() => handleCancel(b._id)}
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

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");
// Removed local formatCurrency in favor of centralized util

const statusColorClass = (status) => {
	switch (status) {
		case "Confirmed":
			return "text-green-600";
		case "Pending":
			return "text-orange-600";
		case "Cancelled":
			return "text-red-600";
		case "CheckedIn":
			return "text-blue-700";
		case "CheckedOut":
			return "text-neutral-700";
		default:
			return "text-neutral-700";
	}
};

export default FacilityBookingTable;

