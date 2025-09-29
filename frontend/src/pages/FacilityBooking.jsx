import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { createFacilityBooking, getAllFacilities } from '../api/facilityApi';

const FacilityBooking = () => {
  const [facilities, setFacilities] = useState([]);
  const navigate = useNavigate();
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    numberOfGuests: 1,
    discountCode: '',
    flexibleDates: false,
    specialRequests: '',
    contactInfo: {
      phone: '',
      email: '',
      emergencyContact: ''
    }
  });
  const [pricing, setPricing] = useState({
    totalNights: 0,
    pricePerNight: 0,
    totalAmount: 0,
    discountAmount: 0,
    finalAmount: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculatePricing();
  }, [selectedFacility, form.checkIn, form.checkOut, form.discountCode]);

  // Load facilities from backend
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoadingFacilities(true);
        const data = await getAllFacilities();
        if (!ignore) {
          const list = Array.isArray(data) ? data : [];
          const order = [
            'Conference & Meeting Rooms',
            'Ballrooms & Banquet Halls',
            'Business Center',
            'Executive Lounge',
            'Outdoor/Unique Event Spaces'
          ];
          list.sort((a,b) => {
            const ai = order.indexOf(a.name);
            const bi = order.indexOf(b.name);
            if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          });
          setFacilities(list);
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load facilities');
      } finally {
        if (!ignore) setLoadingFacilities(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Auto-select first facility when list loads
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacility) {
      setSelectedFacility(facilities[0]._id);
    }
  }, [facilities, selectedFacility]);

  const calculatePricing = () => {
    if (!selectedFacility || !form.checkIn || !form.checkOut) {
      setPricing({ totalNights: 0, pricePerNight: 0, totalAmount: 0, discountAmount: 0, finalAmount: 0 });
      return;
    }

    const facility = facilities.find(f => f._id === selectedFacility);
    if (!facility) return;

    const checkInDate = new Date(form.checkIn);
    const checkOutDate = new Date(form.checkOut);
    const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (totalNights <= 0) return;

    const pricePerNight = facility.pricePerNight;
    const totalAmount = totalNights * pricePerNight;
    
    let discountAmount = 0;
    if (form.discountCode) {
      if (form.discountCode.toUpperCase() === 'HERITAGE10') {
        discountAmount = totalAmount * 0.1;
      } else if (form.discountCode.toUpperCase() === 'EARLY20') {
        discountAmount = totalAmount * 0.2;
      }
    }
    
    const finalAmount = totalAmount - discountAmount;

    setPricing({
      totalNights,
      pricePerNight,
      totalAmount,
      discountAmount,
      finalAmount
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('contactInfo.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: name === 'numberOfGuests' ? Number(value) : (type === 'checkbox' ? checked : value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

  const selected = facilities.find(f => f._id === selectedFacility);
    if (!selected) {
      setError('Please select a facility.');
      setLoading(false);
      return;
    }

    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError('Check-out date must be after check-in date.');
      setLoading(false);
      return;
    }

    if (!selectedFacility) {
      setError('Please select a facility.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to book a facility.');
        setLoading(false);
        return;
      }
      const bookingData = {
        ...form,
        numberOfGuests: Number(form.numberOfGuests) || 1,
        facilityId: selected._id
      };
      
      const created = await createFacilityBooking(bookingData, token);
      setSuccess('Facility booking created successfully! Redirecting to payment...');

      // Navigate to payment page with booking details for prefill
      setTimeout(() => {
        navigate('/payment', {
          state: {
            bookingId: created?._id,
            facilityName: selected.name,
            amount: pricing.finalAmount,
            totalNights: pricing.totalNights,
            pricePerNight: pricing.pricePerNight
          }
        });
      }, 800);
      
      // Reset form
      setForm(prev => ({
        ...prev,
        discountCode: '',
        specialRequests: ''
      }));
      // Keep selection on first facility (if available)
      if (facilities.length > 0) {
        setSelectedFacility(facilities[0]._id);
      } else {
        setSelectedFacility('');
      }
    } catch (err) {
      setError(err.message || 'Booking failed');
      console.error('Facility booking failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedFacilityData = facilities.find(f => f._id === selectedFacility);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#000B58] to-[#001050] px-8 py-6">
            <h1 className="text-3xl font-bold text-white text-center">
              Book Your Facility
            </h1>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Facility Selection */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Select Facility
                </label>
                {loadingFacilities ? (
                  <div className="text-gray-600">Loading facilities...</div>
                ) : facilities.length === 0 ? (
                  <div className="text-red-600">
                    No facilities available to book. Please contact staff/admin to add facilities.
                  </div>
                ) : (
                  <select
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                    required
                  >
                    {facilities.map((facility) => (
                      <option key={facility._id} value={facility._id}>
                        {facility.name}(Rs.{facility.pricePerNight}, Max {facility.maxGuests} guests)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Check-in and Check-out */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Check-in - Check-out
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    name="checkIn"
                    value={form.checkIn}
                    onChange={handleChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                    required
                  />
                  <input
                    type="date"
                    name="checkOut"
                    value={form.checkOut}
                    onChange={handleChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Number of Guests
                </label>
                <select
                  name="numberOfGuests"
                  value={form.numberOfGuests}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 text-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                  required
                >
                  {[5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200].map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
                {selectedFacilityData && (
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum capacity: {selectedFacilityData.maxGuests} guests
                  </p>
                )}
              </div>

              {/* Discount Code */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Discount Code
                </label>
                <input
                  type="text"
                  name="discountCode"
                  value={form.discountCode}
                  onChange={handleChange}
                  placeholder="Optional discount code (e.g. HERITAGE10)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                />
              </div>

              {/* Flexible Dates */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="flexibleDates"
                  checked={form.flexibleDates}
                  onChange={handleChange}
                  className="h-5 w-5 text-[#000B58] focus:ring-[#000B58] border-gray-300 rounded"
                />
                <label className="ml-3 text-lg text-gray-700">
                  Flexible Dates
                </label>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="tel"
                    name="contactInfo.phone"
                    value={form.contactInfo.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                  />
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={form.contactInfo.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                  />
                </div>
                <input
                  type="tel"
                  name="contactInfo.emergencyContact"
                  value={form.contactInfo.emergencyContact}
                  onChange={handleChange}
                  placeholder="Emergency Contact"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000B58] focus:border-transparent"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Special Requests
                </label>
                <textarea
                  name="specialRequests"
                  value={form.specialRequests}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any special requests or requirements..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Pricing Summary */}
              {pricing.totalNights > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-[#000B58] mb-2">Booking Summary</h3>
                  <div className="space-y-1 text-[#000B58]">
                    <div className="flex justify-between">
                      <span>{pricing.totalNights} night{pricing.totalNights > 1 ? 's' : ''} × {formatCurrency(pricing.pricePerNight)}</span>
                      <span>{formatCurrency(pricing.totalAmount)}</span>
                    </div>
                    {pricing.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(pricing.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t border-blue-300 pt-1">
                      <span>Total</span>
                      <span>{formatCurrency(pricing.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#000B58] hover:bg-[#001050] text-white text-xl font-semibold py-4 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'BOOKING...' : 'BOOK NOW'}
              </button>
            </form>

            {/* Facility Benefits */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Facility Booking Benefits</h2>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#000B58] rounded-full mr-3"></div>
                  Professional event management support
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#000B58] rounded-full mr-3"></div>
                  Modern amenities and equipment included
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#000B58] rounded-full mr-3"></div>
                  Flexible booking and cancellation policies
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-[#000B58] rounded-full mr-3"></div>
                  Catering and additional services available
                </li>
              </ul>

              <div className="mt-6 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 bg-[#000B58] rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityBooking;