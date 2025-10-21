import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, verifyOtp as apiVerifyOtp, resendOtp as apiResendOtp } from '../api/userApi';
import Hotel from '../assets/Hotel.jpg';
import { User, Mail, Lock, Phone, MapPin, ListChecks, Eye, EyeOff } from 'lucide-react';

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
  const [fieldErrors, setFieldErrors] = useState({ name: '', phone: '' });
  const [step, setStep] = useState('form'); // form | otp
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'name') {
      // Allow letters + spaces only, strip others
      v = v.replace(/[^A-Za-z\s]/g, '');
      if (v.trim().length === 0) {
        setFieldErrors(fe => ({ ...fe, name: 'Name is required and must contain only letters' }));
      } else {
        setFieldErrors(fe => ({ ...fe, name: '' }));
      }
    }
    if (name === 'phone') {
      // Keep only digits
      v = v.replace(/\D/g, '');
      if (!v) {
        setFieldErrors(fe => ({ ...fe, phone: 'Phone is required' }));
      } else if (v.length < 9 || v.length > 15) {
        setFieldErrors(fe => ({ ...fe, phone: 'Phone must be 9-15 digits' }));
      } else {
        setFieldErrors(fe => ({ ...fe, phone: '' }));
      }
    }
    setForm(prev => ({ ...prev, [name]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final validation guard
    const errs = { ...fieldErrors };
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.name && /[^A-Za-z\s]/.test(form.name)) errs.name = 'Name must contain only letters';
  if (!form.phone) errs.phone = 'Phone is required';
  else if (form.phone.length < 9 || form.phone.length > 15) errs.phone = 'Phone must be 9-15 digits';
    setFieldErrors(errs);
    if (errs.name || errs.phone) return; // abort submit
    setLoading(true);
    setError('');
    try {
  const r = await register(form);
  setPendingEmail(form.email);
  setStep('otp');
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

  const submitOtp = async (e) => {
    e.preventDefault();
    try {
      const resp = await apiVerifyOtp(pendingEmail, otp);
      if (resp?.data) {
        navigate('/login');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Verification failed');
    }
  };

  const resend = async () => {
    try {
      await apiResendOtp(pendingEmail);
      alert('OTP resent');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 md:p-10"
      style={{
        backgroundImage: `url(${Hotel})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/25 bg-white/70 backdrop-blur-xl shadow-2xl p-8">
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

  {step === 'form' ? (
  <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-1 block font-medium">Full Name</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </span>
              <input
                name="name"
                id="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
                pattern="[A-Za-z ]+"
                title="Letters and spaces only"
                className={`w-full rounded-md border pl-10 pr-3 py-2 text-[15px] outline-none transition focus:border-blue-500 ${fieldErrors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block font-medium">Email Address</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                name="email"
                id="email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="mb-1 block font-medium">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                name="password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a strong password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 pl-10 pr-9 py-2 text-[15px] outline-none transition focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer select-none text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label htmlFor="phone" className="mb-1 block font-medium">Phone Number</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={18} />
              </span>
              <input
                name="phone"
                id="phone"
                placeholder="Digits only (9-15)"
                value={form.phone}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]{9,15}"
                title="Phone must be 9-15 digits"
                required
                className={`w-full rounded-md border pl-10 pr-3 py-2 text-[15px] outline-none transition focus:border-blue-500 ${fieldErrors.phone ? 'border-red-400 focus:border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
          </div>

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address" className="mb-1 block font-medium">Address</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <MapPin size={18} />
              </span>
              <input
                name="address"
                id="address"
                placeholder="Your home address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              />
            </div>
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
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <ListChecks size={18} />
              </span>
              <textarea
                name="preferences"
                id="preferences"
                placeholder="Any special requests?"
                value={form.preferences}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-[15px] outline-none transition focus:border-blue-500"
              />
            </div>
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
        ) : (
          <form onSubmit={submitOtp}>
            <div className="mb-4 text-center text-sm text-neutral-700">We sent a 6-digit code to {pendingEmail}. Enter it below to verify your account.</div>
            <input value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,''))} maxLength={6} inputMode="numeric" placeholder="Enter OTP" className="mb-3 w-full rounded-md border px-3 py-2 text-[15px] outline-none focus:border-blue-500" />
            <div className="flex items-center justify-between">
              <button type="button" onClick={resend} className="text-sm text-blue-700 hover:underline">Resend OTP</button>
              <div className="flex gap-2">
                <button type="button" onClick={()=>setStep('form')} className="rounded bg-neutral-200 px-4 py-2 hover:bg-neutral-300">Back</button>
                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Verify</button>
              </div>
            </div>
          </form>
        )}

        {/* Login link */}
        {step==='form' && (
          <p className="mt-5 text-center text-sm text-neutral-100">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-100 underline-offset-2 hover:underline">Login here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
