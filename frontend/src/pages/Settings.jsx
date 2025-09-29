import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile, changePassword } from '../api/userApi';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [pForm, setPForm] = useState({ name: '', phone: '', address: '', preferences: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [prefs, setPrefs] = useState({ notifications: false, dark: false });
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then(({ data }) => {
        setProfile(data);
        setPForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          preferences: data.preferences || '',
        });
      })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load profile' }));
  }, [token]);

  // Load preferences from localStorage and apply dark mode class
  useEffect(() => {
    const notifications = localStorage.getItem('pref.notifications') === '1';
    const dark = localStorage.getItem('pref.dark') === '1';
    setPrefs({ notifications, dark });
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, []);

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    setMsg({});
    try {
      await updateProfile(pForm, token);
      setMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to update profile' });
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setMsg({});
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setMsg({ type: 'error', text: 'New passwords do not match' });
    }
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, token);
      setMsg({ type: 'success', text: 'Password updated successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to change password' });
    }
  };

  const handlePrefChange = (next) => {
    setPrefs(next);
    localStorage.setItem('pref.notifications', next.notifications ? '1' : '0');
    localStorage.setItem('pref.dark', next.dark ? '1' : '0');
    const root = document.documentElement;
    if (next.dark) root.classList.add('dark');
    else root.classList.remove('dark');
  };

  return (
    <div className="min-h-[80vh] bg-neutral-100 dark:bg-[#181c24] flex justify-center items-start">
      <div className="mt-8 w-full max-w-4xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Settings</h2>

        {msg?.text && (
          <div
            className={
              `mb-4 rounded-lg border px-4 py-2 text-center text-sm ` +
              (msg.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700')
            }
          >
            {msg.text}
          </div>
        )}

        {/* Profile */}
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Profile</h3>
          <form onSubmit={onProfileSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Name</label>
                <input
                  value={pForm.name}
                  onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Phone</label>
                <input
                  value={pForm.phone}
                  onChange={(e) => setPForm({ ...pForm, phone: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Address</label>
                <input
                  value={pForm.address}
                  onChange={(e) => setPForm({ ...pForm, address: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Preferences</label>
                <input
                  value={pForm.preferences}
                  onChange={(e) => setPForm({ ...pForm, preferences: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700">
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="mb-5 rounded-xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Change Password</h3>
          <form onSubmit={onPasswordSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Current Password</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">New Password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700">
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Preferences (local UI toggles) */}
        <div className="mb-2 rounded-xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/50">
          <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Preferences</h3>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={prefs.notifications}
                onChange={(e) => handlePrefChange({ ...prefs, notifications: e.target.checked })}
              />
              Enable notifications
            </label>
            <label className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={prefs.dark}
                onChange={(e) => handlePrefChange({ ...prefs, dark: e.target.checked })}
              />
              Dark mode
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
