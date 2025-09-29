import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/Logo.png";
import StaffTable from "../components/StaffTable";
import StaffForm from "../components/StaffForm";
import { fetchAllStaff, createStaff, updateStaff, deleteStaff } from "../api/staffApi";

const StaffManagement = () => {
  const [staffData, setStaffData] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  // Removed date-range filter state

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        const data = await fetchAllStaff();
        setStaffData(data);
      } catch (err) {
        setError("Failed to fetch staff data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, []);

  const handleAddOrUpdateStaff = async (formData) => {
    try {
      setError("");
      setMessage("");
      if (editingStaff) {
        const updatedStaff = await updateStaff(editingStaff._id, formData);
        setStaffData((prev) => prev.map((staff) => (staff._id === updatedStaff._id ? updatedStaff : staff)));
        setMessage("Staff updated successfully ✅");
      } else {
        const newStaff = await createStaff(formData);
        setStaffData((prev) => [...prev, newStaff]);
        setMessage("New staff added successfully ✅");
      }
      setEditingStaff(null);
    } catch (err) {
      setError("Error saving staff data. Please try again.");
    }
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setMessage("");
    setError("");
  };

  const handleDelete = async (id) => {
    try {
      await deleteStaff(id);
      setStaffData((prev) => prev.filter((staff) => staff._id !== id));
      setMessage("Staff deleted successfully ✅");
    } catch (err) {
      setError("Error deleting staff. Please try again.");
    }
  };

  const handleDownloadReport = async () => {
    try {
      const doc = new jsPDF();

      // Optionally load logo as data URL for header
      const loadImageDataUrl = async (src) => {
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };

      const logoDataUrl = await loadImageDataUrl(logo);
      if (logoDataUrl) {
        // x, y, width, height
        doc.addImage(logoDataUrl, 'PNG', 14, 8, 16, 16);
      }

      const title = "Staff Report";
      const dateStr = new Date().toLocaleString();
      doc.setFontSize(18);
      doc.setTextColor(0, 11, 88);
      doc.text(title, 34, 18);
      doc.setDrawColor(0, 11, 88);
      doc.setLineWidth(0.5);
      doc.line(14, 22, 196, 22);
      doc.setTextColor(33, 33, 33);
      doc.setFontSize(11);
      doc.text(`Generated: ${dateStr}`, 14, 28);

      // Always include all staff
      const filtered = staffData;
      doc.text(`Total staff: ${filtered.length}`, 14, 34);

      const headers = [["Name", "Role", "Department", "Salary (Rs)", "Join Date", "Email", "Phone"]];
      const rows = filtered.map((s) => [
        s.name || "-",
        s.role || "-",
        s.department || "-",
        typeof s.salary === "number" ? s.salary.toLocaleString() : (s.salary || "-"),
        s.dateOfJoining ? new Date(s.dateOfJoining).toLocaleDateString() : "-",
        s.email || "-",
        s.phone || "-",
      ]);

      const salaryNums = filtered
        .map((s) => (typeof s.salary === 'number' ? s.salary : parseFloat(s.salary)))
        .filter((n) => !isNaN(n));
      const salarySum = salaryNums.reduce((a, b) => a + b, 0);
      const salaryAvg = salaryNums.length ? salarySum / salaryNums.length : 0;

      autoTable(doc, {
  startY: 40,
        head: headers,
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 11, 88], halign: 'center' },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 22 },
          2: { cellWidth: 26 },
          3: { cellWidth: 24, halign: 'right' },
          4: { cellWidth: 22 },
          5: { cellWidth: 24 },
          6: { cellWidth: 24 },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        foot: [[
          { content: 'Totals', colSpan: 3 },
          { content: salarySum.toLocaleString(), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `Avg: ${salaryAvg.toFixed(2)}`, colSpan: 3, styles: { halign: 'left', fontStyle: 'bold' } },
        ]],
        footStyles: { fillColor: [230, 230, 230] },
        didDrawPage: () => {
          const pageSize = doc.internal.pageSize;
          const pageWidth = pageSize.getWidth();
          const pageHeight = pageSize.getHeight();
          doc.setFontSize(9);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 30, pageHeight - 10);
        },
      });

      const filename = `staff-report-${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(filename);
      setToast("Report downloaded");
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      console.error("PDF generation failed", e);
      setError("Failed to generate report. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Staff Management</h1>
        <button
          type="button"
          onClick={handleDownloadReport}
          disabled={loading || staffData.length === 0}
          className="rounded-lg bg-[#000B58] px-4 py-2 text-white shadow hover:bg-[#001050] disabled:cursor-not-allowed disabled:opacity-60"
          title={staffData.length === 0 ? "No staff data to export" : "Download PDF report"}
        >
          ⬇️ Download PDF Report
        </button>
      </div>

      {error && <p className="mb-3 text-center text-red-600">{error}</p>}
      {message && <p className="mb-3 text-center text-green-600">{message}</p>}

      <div className="mb-5 rounded-xl border border-neutral-200 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">{editingStaff ? "Edit Staff" : "Add New Staff"}</h2>
        <StaffForm onSubmit={handleAddOrUpdateStaff} initialData={editingStaff || {}} onCancel={() => setEditingStaff(null)} />
      </div>

      {loading ? (
        <p className="text-center">Loading staff data...</p>
      ) : (
        <div className="rounded-xl border border-neutral-200 p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Staff List</h2>
          {staffData.length > 0 ? (
            <StaffTable staffData={staffData} onEdit={handleEdit} onDelete={handleDelete} />
          ) : (
            <p className="text-center">No staff members found.</p>
          )}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[1000] rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
