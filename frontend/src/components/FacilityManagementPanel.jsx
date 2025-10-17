import React, { useEffect, useState } from 'react';
import FacilityCreateForm from './FacilityCreateForm';
import { getAllFacilities, deleteFacility } from '../api/facilityApi';
import { decodeToken } from '../utils/authHelper';

const FacilityManagementPanel = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const user = token ? decodeToken(token) : null;
  const role = user?.role || user?.user?.role;

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllFacilities();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const filtered = search.trim()
    ? facilities.filter(f => {
        const term = search.trim().toLowerCase();
        return (
          (f.name || '').toLowerCase().includes(term) ||
          (f.type || '').toLowerCase().includes(term) ||
          (f.location || '').toLowerCase().includes(term)
        );
      })
    : facilities;

  if (!role || !['Admin', 'Staff'].includes(role)) {
    return null;
  }

  return (
    <div>
      {/* Create / Edit form */}
      <FacilityCreateForm onCreated={loadFacilities} onUpdated={loadFacilities} />

      {/* Management table */}
      <div className="border rounded-2xl shadow-sm bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
          <h3 className="text-lg font-semibold text-neutral-900">Facilities Management</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, type, or location"
              className="w-full sm:w-72 rounded border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-[#000B58] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-300"
              >Clear</button>
            )}
          </div>
        </div>
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-neutral-600">Loading facilities...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Night</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-neutral-500">No facilities found.</td>
                  </tr>
                )}
                {filtered.map(f => (
                  <tr key={f._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{f.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{f.type || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{f.location || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">Rs {Number(f.pricePerNight || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{f.isAvailable ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          // Signal FacilityCreateForm to load this for editing
                          window.dispatchEvent(new CustomEvent('facility-edit-request', { detail: f }));
                          // Scroll to top where the form lives
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >Edit</button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={async () => {
                          if (!window.confirm('Delete this facility?')) return;
                          try {
                            await deleteFacility(f._id, token);
                            await loadFacilities();
                          } catch (e) {
                            alert(e.message || 'Failed to delete facility');
                          }
                        }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityManagementPanel;
