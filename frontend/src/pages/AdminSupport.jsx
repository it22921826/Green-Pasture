import React, { useEffect, useState } from 'react';
import { getSupportAll, updateSupportStatus } from '../api/supportApi';

const AdminSupport = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getSupportAll(token);
      setItems(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load support messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleResolve = async (id, current) => {
    try {
      await updateSupportStatus(id, current === 'Resolved' ? 'Open' : 'Resolved', token);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) return <div className="p-6">Loading support messages...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Support Messages</h2>
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((it) => (
              <tr key={it._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(it.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">{it.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.phone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.subject}</td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">{it.message}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    it.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {it.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className={`px-3 py-1 rounded ${it.status === 'Resolved' ? 'bg-gray-100 text-gray-700' : 'bg-green-600 text-white'}`}
                    onClick={() => toggleResolve(it._id, it.status)}
                  >
                    {it.status === 'Resolved' ? 'Reopen' : 'Resolve'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSupport;
