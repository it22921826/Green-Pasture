import React, { useEffect, useMemo, useState } from 'react';
import { getRooms } from '../api/roomApi';
import { createSupport } from '../api/supportApi';

const RefundForm = ({ booking, onClose, onSubmit }) => {
  const [rooms, setRooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [attachment, setAttachment] = useState(null); // File
  const [attachmentPreview, setAttachmentPreview] = useState(''); // data URL for preview
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const items = await getRooms({});
        setRooms(Array.isArray(items) ? items : []);
      } catch (_) {}
    })();
  }, []);

  const priceInfo = useMemo(() => {
    try {
      const room = rooms.find(r => String(r.roomNumber).trim() === String(booking.roomNumber).trim());
      const price = room && typeof room.price === 'number' ? room.price : null;
      const nights = booking.checkIn && booking.checkOut
        ? Math.max(0, (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000*60*60*24))
        : 0;
      const total = price != null ? price * nights : null;
      const refund = total != null ? Math.round(total * 0.7) : null;
      return { price, nights, total, refund };
    } catch {
      return { price: null, nights: 0, total: null, refund: null };
    }
  }, [rooms, booking]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validators = {
    accountName: (val) => {
      const v = String(val || '').trim();
      if (!v) return 'Account name is required';
      if (!/^[A-Za-z][A-Za-z .'-]{2,49}$/.test(v)) return 'Use 3-50 letters (A-Z) and spaces only';
      return '';
    },
    accountNumber: (val) => {
      const v = String(val || '').trim();
      if (!v) return 'Account number is required';
      if (!/^\d{10,20}$/.test(v)) return 'Account number must be 10-20 digits';
      return '';
    },
    bankName: (val) => {
      const v = String(val || '').trim();
      if (!v) return 'Bank name is required';
      if (!/^[A-Za-z][A-Za-z ]{2,49}$/.test(v)) return 'Use 3-50 letters and spaces only';
      return '';
    },
    branch: (val) => {
      const v = String(val || '').trim();
      if (!v) return 'Branch is required';
      if (!/^[A-Za-z][A-Za-z ]{2,49}$/.test(v)) return 'Use 3-50 letters and spaces only';
      return '';
    },
    contactEmail: (val) => {
      const v = String(val || '').trim();
      if (!v) return 'Contact email is required';
      if (!/\S+@\S+\.\S+/.test(v)) return 'Enter a valid email address';
      return '';
    },
    contactPhone: (val) => {
      const v = String(val || '').trim();
      if (!/^0\d{9}$/.test(v)) return 'Enter a valid phone (10 digits, starts with 0)';
      return '';
    },
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (validators[name]) {
      const msg = validators[name](value);
      if (msg) setErrors(prev => ({ ...prev, [name]: msg }));
    }
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    setAttachment(file || null);
    if (file) {
      // Validate file type and size (max 5 MB)
      const allowed = ['image/jpeg','image/png','image/webp','image/jpg'];
      if (!allowed.includes(file.type)) {
        setErrors(prev => ({ ...prev, attachment: 'Only image files are allowed' }));
        setAttachment(null);
        setAttachmentPreview('');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, attachment: 'Image must be 5MB or smaller' }));
        setAttachment(null);
        setAttachmentPreview('');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setAttachmentPreview(reader.result?.toString() || '');
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, attachment: '' }));
    } else {
      setAttachmentPreview('');
      setErrors(prev => ({ ...prev, attachment: 'Please upload an image' }));
    }
  };

  const validateEmail = (val) => /\S+@\S+\.\S+/.test(String(val || '').trim());
  const validateDigits = (val) => /^\d+$/.test(String(val || '').trim());
  const validateAll = () => {
    const next = {};
    // Strict field validations
    const an = validators.accountName(form.accountName); if (an) next.accountName = an;
    const ano = validators.accountNumber(form.accountNumber); if (ano) next.accountNumber = ano;
    const bn = validators.bankName(form.bankName); if (bn) next.bankName = bn;
    const br = validators.branch(form.branch); if (br) next.branch = br;
    const em = validators.contactEmail(form.contactEmail); if (em) next.contactEmail = em;
    const ph = validators.contactPhone(form.contactPhone); if (ph) next.contactPhone = ph;
    // Attachment is required for submission
    if (!attachmentPreview) next.attachment = 'Please upload an image';
    if (!confirm) next.confirm = 'Please confirm the details are correct';
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const fieldErrors = validateAll();
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        setError('Please fix the highlighted fields.');
        setSubmitting(false);
        return;
      }
      const token = localStorage.getItem('token');
      const subject = `Refund Request for Booking ${booking._id}`;
      // Convert image to base64 (already loaded in attachmentPreview if any)
      const details = [
        `Booking ID: ${booking._id}`,
        `Room: ${booking.roomNumber}`,
        `Check-in: ${booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : '-'}`,
        `Check-out: ${booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : '-'}`,
        priceInfo.price != null ? `Nightly Price: Rs. ${priceInfo.price.toLocaleString()}` : null,
        priceInfo.nights ? `Nights: ${priceInfo.nights}` : null,
        priceInfo.total != null ? `Estimated Total: Rs. ${priceInfo.total.toLocaleString()}` : null,
        priceInfo.refund != null ? `Estimated 70% Refund: Rs. ${priceInfo.refund.toLocaleString()}` : `Note: From the total amount, 70% is refundable.`,
        '',
        'Bank details provided by customer:',
        `Account Name: ${form.accountName}`,
        `Account Number: ${form.accountNumber}`,
        `Bank: ${form.bankName}`,
        `Branch: ${form.branch}`,
        `Contact Email: ${form.contactEmail}`,
        `Contact Phone: ${form.contactPhone}`,
        attachmentPreview ? 'Attachment (base64): ' + attachmentPreview : null
      ].filter(Boolean).join('\n');

      await createSupport({
        name: 'Refund Request',
        email: form.contactEmail || 'refunds@request.local',
        phone: form.contactPhone || '',
        subject,
        message: details
      }, token);
      // After support ticket is created, proceed with actual cancellation via parent callback
      if (onSubmit) {
        await onSubmit({ form, priceInfo });
      }
      setSuccess('Refund request submitted and cancellation processed. We will refund 70% of the total shortly.');
      setTimeout(() => onClose?.(), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit refund request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">Refund form</h3>
          <p className="mt-1 text-sm text-neutral-600">Note: From the total amount, 70% is refundable.</p>
        </div>
        <form onSubmit={submit} className="px-6 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Booking ID</label>
              <input readOnly className="w-full rounded border px-3 py-2 bg-neutral-100" value={booking._id} />
            </div>
            <div>
              <label className="block text-sm font-medium">Room Number</label>
              <input readOnly className="w-full rounded border px-3 py-2 bg-neutral-100" value={booking.roomNumber} />
            </div>
            <div>
              <label className="block text-sm font-medium">Check-In</label>
              <input readOnly className="w-full rounded border px-3 py-2 bg-neutral-100" value={booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : ''} />
            </div>
            <div>
              <label className="block text-sm font-medium">Check-Out</label>
              <input readOnly className="w-full rounded border px-3 py-2 bg-neutral-100" value={booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : ''} />
            </div>
            {priceInfo.total != null && (
              <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Estimated Total</label>
                  <input readOnly className="w-full rounded border px-3 py-2 bg-neutral-100" value={`Rs. ${priceInfo.total.toLocaleString()}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Estimated 70% Refund</label>
                  <input readOnly className="w-full rounded border px-3 py-2 bg-neutral-100" value={`Rs. ${priceInfo.refund.toLocaleString()}`} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Account Name</label>
              <input name="accountName" onChange={handleChange} onBlur={handleBlur} value={form.accountName} className={`w-full rounded border px-3 py-2 ${errors.accountName ? 'border-red-400' : ''}`} placeholder="As per bank records" required aria-invalid={!!errors.accountName} minLength={3} maxLength={50} autoComplete="name" />
              {errors.accountName && <div className="mt-1 text-xs text-red-600">{errors.accountName}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Account Number</label>
              <input name="accountNumber" onChange={(e)=>{ if (/^\d*$/.test(e.target.value)) handleChange(e); }} onBlur={handleBlur} value={form.accountNumber} className={`w-full rounded border px-3 py-2 ${errors.accountNumber ? 'border-red-400' : ''}`} placeholder="1234567890" required aria-invalid={!!errors.accountNumber} inputMode="numeric" pattern="\d*" minLength={10} maxLength={20} autoComplete="off" />
              {errors.accountNumber && <div className="mt-1 text-xs text-red-600">{errors.accountNumber}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Bank Name</label>
              <input name="bankName" onChange={(e)=>{ e.target.value = e.target.value.replace(/[^A-Za-z ]+/g,''); handleChange(e); }} onBlur={handleBlur} value={form.bankName} className={`w-full rounded border px-3 py-2 ${errors.bankName ? 'border-red-400' : ''}`} placeholder="ABC Bank" required aria-invalid={!!errors.bankName} minLength={3} maxLength={50} pattern="[A-Za-z ]+" />
              {errors.bankName && <div className="mt-1 text-xs text-red-600">{errors.bankName}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Branch</label>
              <input name="branch" onChange={(e)=>{ e.target.value = e.target.value.replace(/[^A-Za-z ]+/g,''); handleChange(e); }} onBlur={handleBlur} value={form.branch} className={`w-full rounded border px-3 py-2 ${errors.branch ? 'border-red-400' : ''}`} placeholder="Main Branch" required aria-invalid={!!errors.branch} minLength={3} maxLength={50} pattern="[A-Za-z ]+" />
              {errors.branch && <div className="mt-1 text-xs text-red-600">{errors.branch}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Contact Email</label>
              <input name="contactEmail" type="email" onChange={handleChange} onBlur={handleBlur} value={form.contactEmail} className={`w-full rounded border px-3 py-2 ${errors.contactEmail ? 'border-red-400' : ''}`} placeholder="you@example.com" required aria-invalid={!!errors.contactEmail} autoComplete="email" />
              {errors.contactEmail && <div className="mt-1 text-xs text-red-600">{errors.contactEmail}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium">Contact Phone</label>
              <input name="contactPhone" onChange={(e)=>{ if (/^\d*$/.test(e.target.value)) handleChange(e); }} onBlur={handleBlur} value={form.contactPhone} className={`w-full rounded border px-3 py-2 ${errors.contactPhone ? 'border-red-400' : ''}`} placeholder="0771234567" required aria-invalid={!!errors.contactPhone} inputMode="numeric" pattern="0\d{9}" minLength={10} maxLength={10} autoComplete="tel" />
              {errors.contactPhone && <div className="mt-1 text-xs text-red-600">{errors.contactPhone}</div>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Upload proof (image) <span className="text-red-600">*</span></label>
              <input type="file" accept="image/*" onChange={handleFile} className={`w-full ${errors.attachment ? 'border-red-400' : ''}`} aria-invalid={!!errors.attachment} aria-required="true" />
              {errors.attachment && <div className="mt-1 text-xs text-red-600">{errors.attachment}</div>}
              {attachmentPreview && (
                <div className="mt-2">
                  <img src={attachmentPreview} alt="Attachment preview" className="h-24 rounded border" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2">
            <input id="confirm" type="checkbox" checked={confirm} onChange={(e)=>{ setConfirm(e.target.checked); setErrors(prev=>({ ...prev, confirm: '' })); }} className="mt-1" />
            <label htmlFor="confirm" className="text-sm text-neutral-700">
              I confirm the provided bank details and contact information are correct. I understand that refunds are processed at 70% of the total as per policy.
            </label>
          </div>
          {errors.confirm && <div className="mt-1 text-xs text-red-600">{errors.confirm}</div>}

          {error && <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {success && <div className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

          <div className="mt-5 flex items-center justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} className="rounded bg-neutral-200 px-4 py-2 hover:bg-neutral-300">Close</button>
            <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit refund request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundForm;
