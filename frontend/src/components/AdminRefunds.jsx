import React, { useEffect, useState } from 'react';
import { getSupportAll, updateSupportStatus } from '../api/supportApi';

const AdminRefunds = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await getSupportAll(token);
      const onlyRefunds = (Array.isArray(data) ? data : []).filter(m => (m.subject || '').startsWith('Refund Request for Booking '));
      setItems(onlyRefunds);
      setLoading(false);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load refunds');
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await updateSupportStatus(id, status, token);
      setItems(prev => prev.map(x => x._id === id ? data : x));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to update status');
    }
  };

  const filtered = items.filter(m => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      (m.subject || '').toLowerCase().includes(term) ||
      (m.email || '').toLowerCase().includes(term) ||
      (m.phone || '').toLowerCase().includes(term) ||
      (m.status || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search refunds (subject, email, phone, status)" className="w-full max-w-md rounded border px-3 py-2 text-sm" />
        <button onClick={load} className="rounded bg-neutral-200 px-3 py-2 text-sm hover:bg-neutral-300">Refresh</button>
      </div>
      {loading ? (
        <div className="py-6 text-neutral-600">Loading refunds...</div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-sm text-neutral-500">No refund requests.</td>
                </tr>
              )}
              {filtered.map(m => {
                const bookingId = (m.subject || '').replace('Refund Request for Booking ', '');
                return (
                  <tr key={m._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{bookingId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{m.email || '-'}{m.phone ? ` | ${m.phone}` : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {m.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button onClick={()=>setStatus(m._id, 'Resolved')} className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700" disabled={m.status==='Resolved'}>Approve</button>
                        <button onClick={()=>setStatus(m._id, 'Cancelled')} className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700" disabled={m.status==='Cancelled'}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;