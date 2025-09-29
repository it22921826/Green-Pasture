import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, deleteGuest } from '../api/userApi';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', preferences: '', documents: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    getProfile(token)
      .then(({ data }) => {
        setUser(data);
        setForm({
          name: data.name,
          phone: data.phone || '',
          address: data.address || '',
          preferences: data.preferences || '',
          documents: data.documents || [],
        });
      })
      .catch(() => setError('Failed to load profile'));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await updateProfile(form, token);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGuest = async () => {
    const guestId = user?._id;
    if (!guestId) {
      alert('Guest ID is missing');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await deleteGuest(guestId, token);
      if (response.status === 200) {
        alert('Guest user deleted successfully');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        const message = response?.data?.message || 'Failed to delete guest user';
        alert(message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to delete guest user';
      alert(message);
    }
  };

  if (!user)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="min-w-80 rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl">
          <h2 className="text-center text-xl font-semibold text-neutral-900">Loading Profile...</h2>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-neutral-100">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900">Profile</h2>
        <div className="mb-6 text-center text-[16px] text-neutral-600">
          <div><strong>Name:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Role:</strong> {user.role}</div>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-center text-sm text-green-700">{success}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="name" className="mb-1 block font-medium">Name</label>
            <input
              name="name"
              id="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="phone" className="mb-1 block font-medium">Phone</label>
            <input
              name="phone"
              id="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="address" className="mb-1 block font-medium">Address</label>
            <input
              name="address"
              id="address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="preferences" className="mb-1 block font-medium">Preferences</label>
            <input
              name="preferences"
              id="preferences"
              value={form.preferences}
              onChange={handleChange}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-3 font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-500"
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </form>
        {user.role === 'Guest' && (
          <button
            onClick={handleDeleteGuest}
            className="mt-5 w-full rounded-md bg-red-600 py-3 font-semibold text-white shadow transition hover:bg-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
