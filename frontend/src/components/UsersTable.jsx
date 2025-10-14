import React, { useEffect, useState } from 'react';
import { getAllUsers, deleteUser as deleteUserApi } from '../api/userApi';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await getAllUsers(token);
      const arr = Array.isArray(data) ? data : [];
      // Show only regular users (role 'Guest') and hide Staff/Admin
      const filtered = arr.filter((u) => String(u.role || '').toLowerCase() === 'guest');
      setUsers(filtered);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (u) => {
    if (!u?._id) return;
    const targetRole = String(u.role || '').toLowerCase();
    // Prevent attempting disallowed deletions client-side
    if (targetRole === 'admin' || targetRole === 'staff') {
      alert('You cannot delete Admin or Staff users.');
      return;
    }
    if (!window.confirm(`Delete user "${u.name || u.email}"?`)) return;
    try {
      await deleteUserApi(u._id, token);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to delete user');
    }
  };

  return (
    <div className="mt-2">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
      {loading ? (
        <div className="my-8 text-center text-[16px] text-neutral-600">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-sm text-neutral-500">No users found.</td>
                </tr>
              )}
              {users.map((u) => {
                const role = u.role || '-';
                const roleLc = String(role).toLowerCase();
                const disabledDelete = roleLc === 'admin' || roleLc === 'staff';
                return (
                  <tr key={u._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{u.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className={`text-red-600 hover:text-red-900 ${disabledDelete ? 'opacity-40 cursor-not-allowed' : ''}`}
                        onClick={() => !disabledDelete && handleDelete(u)}
                        disabled={disabledDelete}
                        title={disabledDelete ? 'Cannot delete Admin or Staff users' : 'Delete user'}
                      >
                        Delete
                      </button>
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

export default UsersTable;
