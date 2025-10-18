import React, { useState, useEffect } from "react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from "../utils/currency";
import { fetchInvoices, deleteInvoice, approveInvoice, getInvoiceProof } from "../api/invoiceAPI";
import logo from '../assets/Logo.png';

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proofOpen, setProofOpen] = useState(false);
  const [proofSrc, setProofSrc] = useState("");
  const [proofType, setProofType] = useState("");
  const [proofFor, setProofFor] = useState(null);
  const [proofCache, setProofCache] = useState({}); // { [invoiceId]: 'available' | 'none' }

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      setError("Failed to load invoices");
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteInvoice(id);
      loadInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      setError("Failed to delete invoice");
    }
  };

  const handleApprove = async (inv) => {
    try {
      // If there is a proof available, encourage viewing before approving
      try {
        const resp = await getInvoiceProof(inv._id);
        if (resp?.success && resp?.proof) {
          // Open modal if not already viewed for this invoice
          if (proofFor !== inv._id) {
            setProofSrc(resp.proof);
            setProofType(resp.contentType || '');
            setProofFor(inv._id);
            setProofOpen(true);
            return; // wait for user to review, then they can click Approve again
          }
        }
      } catch (_) {}
      await approveInvoice(inv._id);
      // optimistic UI: update local list before reload
      setInvoices(prev => prev.map(i => i._id === inv._id ? { ...i, status: 'approved', amountPaid: i.amount, paidAt: new Date().toISOString() } : i));
    } catch (err) {
      console.error('Error approving invoice:', err);
      setError('Failed to approve invoice');
    }
  };

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

  const addHeader = async (doc, title) => {
    let y = 10;
    const logoData = await loadImageDataUrl(logo);
    if (logoData) {
      doc.addImage(logoData, 'PNG', 14, y, 16, 16);
    }
    doc.setFontSize(18);
    doc.setTextColor(0, 11, 88);
    doc.text(title, logoData ? 34 : 14, y + 10);
    doc.setDrawColor(0, 11, 88);
    doc.setLineWidth(0.5);
    doc.line(14, y + 16, 196, y + 16);
    return y + 24; // content start Y
  };

  const downloadSingle = async (inv) => {
    const doc = new jsPDF();
    const startY = await addHeader(doc, `Invoice ${inv.invoiceNumber}`);
    doc.setFontSize(11);
    let y = startY;
    const lineGap = 6;
    const addLine = (text) => { doc.text(text, 14, y); y += lineGap; };
    addLine(`Customer: ${inv.customerName}`);
    addLine(`Email: ${inv.email}`);
    addLine(`Amount: ${formatCurrency(inv.amount)}`);
    addLine(`Status: ${inv.status || 'pending'}`);
    if (inv.roomNo) addLine(`Room No: ${inv.roomNo}`);
    addLine(`Date: ${new Date(inv.createdAt || inv.date).toLocaleString()}`);
    y += 4;
    doc.setDrawColor(200,200,200);
    doc.line(14, y, 196, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(60,60,60);
    doc.text('Thank you for your business!', 14, y);
    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  const downloadAll = async () => {
    if (!invoices.length) return;
    const doc = new jsPDF();
    const startY = await addHeader(doc, 'Invoices Summary');
    doc.setFontSize(10);
    doc.setTextColor(33,33,33);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, startY - 4);

    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.customerName,
      inv.email,
      formatCurrency(inv.amount),
      inv.status || 'pending',
      inv.roomNo ?? '-',
      (inv.createdAt || inv.date) ? new Date(inv.createdAt || inv.date).toLocaleDateString() : '-'
    ]);

    autoTable(doc, {
      startY,
      head: [["Invoice #", "Customer", "Email", "Amount", "Status", "Room", "Date"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 11, 88], halign: 'center' },
      alternateRowStyles: { fillColor: [245,245,245] },
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 28 }, 2: { cellWidth: 36 } }
    });

    doc.save(`invoices-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="mt-5 overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          onClick={downloadAll}
          disabled={!invoices.length}
          className="rounded bg-[#000B58] px-4 py-2 text-sm font-medium text-white shadow disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#001050]"
        >
          ⬇️ Download All (PDF)
        </button>
        {loading && <span className="text-sm text-neutral-500">Loading...</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      <table className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow">
        <thead>
          <tr className="bg-[#000B58] text-white">
            <th className="px-5 py-3 text-sm font-bold">Invoice</th>
            <th className="px-5 py-3 text-sm font-bold">Customer</th>
            <th className="px-5 py-3 text-sm font-bold">Email</th>
            <th className="px-5 py-3 text-sm font-bold">Amount</th>
            <th className="px-5 py-3 text-sm font-bold">Status</th>
            <th className="px-5 py-3 text-sm font-bold">Proof</th>
            <th className="px-5 py-3 text-sm font-bold text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 && !loading && (
            <tr>
              <td colSpan="5" className="px-5 py-6 text-center text-sm text-neutral-500">No invoices found</td>
            </tr>
          )}
          {invoices.map((inv, i) => (
            <tr key={inv._id} className={i % 2 === 0 ? "bg-neutral-50 hover:bg-blue-50" : "bg-white hover:bg-blue-50"}>
              <td className="px-5 py-3 text-sm text-neutral-800">{inv.invoiceNumber}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{inv.customerName}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{inv.email}</td>
              <td className="px-5 py-3 text-sm text-neutral-800">{formatCurrency(inv.amount)}</td>
              <td className="px-5 py-3 text-sm">
                {inv.status === 'approved' || inv.status === 'paid' ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Approved</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                )}
              </td>
              <td className="px-5 py-3 text-sm text-neutral-800">
                {proofCache[inv._id] === 'available' ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Available</span>
                ) : proofCache[inv._id] === 'none' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    No proof
                  </span>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const resp = await getInvoiceProof(inv._id);
                        if (resp?.success && resp?.proof) {
                          setProofSrc(resp.proof);
                          setProofType(resp.contentType || '');
                          setProofFor(inv._id);
                          setProofOpen(true);
                          setProofCache(prev => ({ ...prev, [inv._id]: 'available' }));
                        } else {
                          setProofCache(prev => ({ ...prev, [inv._id]: 'none' }));
                          setError('No payment proof found for this invoice');
                        }
                      } catch (e) {
                        setError('Failed to fetch payment proof');
                      }
                    }}
                    className="rounded bg-neutral-600 px-3 py-1 text-white shadow hover:bg-neutral-700"
                  >View</button>
                )}
              </td>
              <td className="px-5 py-3 text-sm text-neutral-800">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {!(inv.status === 'approved' || inv.status === 'paid') && (
                    <button
                      onClick={() => handleApprove(inv)}
                      className="rounded bg-blue-600 px-3 py-1 text-white shadow hover:bg-blue-700"
                    >Approve</button>
                  )}
                  <button
                    onClick={() => downloadSingle(inv)}
                    className="rounded bg-green-600 px-3 py-1 text-white shadow hover:bg-green-700"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDelete(inv._id)}
                    className="rounded bg-red-600 px-3 py-1 text-white shadow hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {proofOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[min(92vw,720px)] overflow-auto rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Payment Proof {proofFor ? `(#${String(invoices.find(i=>i._id===proofFor)?.invoiceNumber||'')})` : ''}</h3>
              <button onClick={() => setProofOpen(false)} className="rounded bg-neutral-200 px-2 py-1 text-sm hover:bg-neutral-300">Close</button>
            </div>
            {proofSrc ? (
              proofType === 'application/pdf' || (typeof proofSrc === 'string' && proofSrc.toLowerCase().startsWith('data:application/pdf') || proofSrc.toLowerCase().endsWith('.pdf')) ? (
                <div>
                  <object data={proofSrc} type="application/pdf" className="h-[70vh] w-full rounded" aria-label="Payment Proof PDF">
                    <iframe src={proofSrc} className="h-[70vh] w-full" title="Payment Proof PDF" />
                  </object>
                  <div className="mt-2 text-right">
                    <a href={proofSrc} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Open PDF in new tab</a>
                  </div>
                </div>
              ) : (
                <img src={proofSrc} alt="Payment Proof" className="max-h-[70vh] w-full rounded object-contain" />
              )
            ) : (
              <div className="rounded border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">No proof available.</div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setProofOpen(false); setProofFor(null); setProofSrc(''); setProofType(''); }} className="rounded bg-neutral-200 px-3 py-1 text-sm hover:bg-neutral-300">Close</button>
              {proofFor && !(invoices.find(i=>i._id===proofFor)?.status === 'approved' || invoices.find(i=>i._id===proofFor)?.status === 'paid') && (
                <button
                  onClick={async () => {
                    try {
                      await approveInvoice(proofFor);
                      setInvoices(prev => prev.map(i => i._id === proofFor ? { ...i, status: 'approved', amountPaid: i.amount, paidAt: new Date().toISOString() } : i));
                      setProofOpen(false);
                      setProofFor(null);
                      setProofSrc('');
                    } catch (err) {
                      setError('Failed to approve invoice');
                    }
                  }}
                  className="rounded bg-blue-600 px-3 py-1 text-white shadow hover:bg-blue-700"
                >Approve</button>
              )}
            </div>
          </div>
        </div>
      )}
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
    </div>
  );
};

export default Invoice;

