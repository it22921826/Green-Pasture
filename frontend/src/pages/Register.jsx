import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/userApi';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'Guest',
    preferences: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      console.error('Register error:', err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Registration failed');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500/25 to-purple-700 p-5">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-center mb-6 text-2xl font-bold text-neutral-900">Create an Account</h2>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-1 block font-medium">Full Name</label>
            <input
              name="name"
              id="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block font-medium">Email Address</label>
            <input
              name="email"
              id="email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="mb-1 block font-medium">Password</label>
            <div className="relative">
              <input
                name="password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a strong password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer select-none text-lg"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label htmlFor="phone" className="mb-1 block font-medium">Phone Number</label>
            <input
              name="phone"
              id="phone"
              placeholder="e.g. +94 77 123 4567"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address" className="mb-1 block font-medium">Address</label>
            <input
              name="address"
              id="address"
              placeholder="Your home address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Role */}
          <div className="mb-4">
            <label htmlFor="role" className="mb-1 block font-medium">Role</label>
            <select
              name="role"
              id="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            >
              <option value="Guest">Guest</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          {/* Preferences */}
          <div className="mb-4">
            <label htmlFor="preferences" className="mb-1 block font-medium">Preferences</label>
            <textarea
              name="preferences"
              id="preferences"
              placeholder="Any special requests?"
              value={form.preferences}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-5 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
