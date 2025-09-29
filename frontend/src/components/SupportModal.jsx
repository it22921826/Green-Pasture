import React, { useState, useEffect, useMemo } from 'react';
import { createSupport } from '../api/supportApi';
import { decodeToken } from '../utils/authHelper';

const SupportModal = ({ open, onClose }) => {
  const token = localStorage.getItem('token');
  // Memoize decoded user so the reference doesn't change on every render
  const user = useMemo(() => (token ? decodeToken(token) : null), [token]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    // Avoid unnecessary state updates if values are already set
    setForm((f) => {
      const name = user.name || '';
      const email = user.email || '';
      if (f.name === name && f.email === email) return f;
      return { ...f, name, email };
    });
  }, [user]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createSupport(form, token);
      setSuccess('Message sent successfully. Our reception will contact you shortly.');
      setForm({ name: user?.name || '', email: user?.email || '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Support - Reception</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✖</button>
        </div>

        {success && <div className="mb-3 p-3 rounded bg-green-50 text-green-700">{success}</div>}
        {error && <div className="mb-3 p-3 rounded bg-red-50 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Your name</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Your mail</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Subject</label>
            <input name="subject" value={form.subject} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Your message (optional)</label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={4} className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button disabled={loading} type="submit" className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-60">
              {loading ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportModal;
