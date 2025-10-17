import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/currency';
import { createFacilityBooking, getAllFacilities, getFacilityAvailability } from '../api/facilityApi';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
// Public facilities view only

const FacilityBooking = ({ embedded = false }) => {
  const [facilities, setFacilities] = useState([]);
  const navigate = useNavigate();
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [bookingMode, setBookingMode] = useState('book'); // 'book' | 'reserve'
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [facilityBlockedRanges, setFacilityBlockedRanges] = useState([]); // for selected facility
  // Filters for user-facing facilities list (location removed)
  const [facilityFilters, setFacilityFilters] = useState({ type: '', minPrice: '', maxPrice: '' });

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
          // Do not auto-select a facility; open the booking modal only when user clicks
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load facilities');
      } finally {
        if (!ignore) setLoadingFacilities(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const fetchFacilitiesWithFilters = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoadingFacilities(true);
      const data = await getAllFacilities({
        type: facilityFilters.type,
        minPrice: facilityFilters.minPrice,
        maxPrice: facilityFilters.maxPrice,
      });
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to apply filters');
    } finally {
      setLoadingFacilities(false);
    }
  };
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
    // Sanitize digit-only targets
    const digitTargets = ['contactInfo.phone', 'contactInfo.emergencyContact'];
    let next = value;
    if (digitTargets.includes(name)) {
      next = value.replace(/[^0-9]/g, '');
    }
    if (name.includes('contactInfo.')) {
      const field = name.split('.')[1];
      setForm(prev => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, [field]: next }
      }));
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: name === 'numberOfGuests' ? Number(next) : (type === 'checkbox' ? checked : next)
      }));
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation
  const validationErrors = [];
  const newFieldErrors = {};
    const now = new Date();
    const selected = facilities.find(f => f._id === selectedFacility);
    const checkInDate = form.checkIn ? new Date(form.checkIn) : null;
    const checkOutDate = form.checkOut ? new Date(form.checkOut) : null;

    if (!selected) validationErrors.push('Please select a facility.');
  if (!form.checkIn) { validationErrors.push('Check-in date is required.'); newFieldErrors.checkIn = 'Required'; }
  if (!form.checkOut) { validationErrors.push('Check-out date is required.'); newFieldErrors.checkOut = 'Required'; }
    if (checkInDate && checkInDate < new Date(now.toDateString())) {
      validationErrors.push('Check-in cannot be in the past.');
    }
    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
      validationErrors.push('Check-out must be after check-in.');
    }
    if (selected && form.numberOfGuests > selected.maxGuests) {
      validationErrors.push(`Number of guests exceeds capacity (max ${selected.maxGuests}).`);
    }
    if (form.numberOfGuests < 1) validationErrors.push('Number of guests must be at least 1.');
    // Basic phone validation (Sri Lanka pattern optional + length 9-15)
    // Contact required
    if (!form.contactInfo.phone) { validationErrors.push('Phone number is required.'); newFieldErrors.phone = 'Required'; }
    if (!form.contactInfo.email) { validationErrors.push('Email is required.'); newFieldErrors.email = 'Required'; }
    if (!form.contactInfo.emergencyContact) { validationErrors.push('Emergency contact is required.'); newFieldErrors.emergencyContact = 'Required'; }
    if (form.contactInfo.phone && !/^[0-9]{9,15}$/.test(form.contactInfo.phone)) {
      validationErrors.push('Phone number must be 9-15 digits.'); newFieldErrors.phone = '9-15 digits'; }
    if (form.contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactInfo.email)) {
      validationErrors.push('Email format is invalid.'); newFieldErrors.email = 'Invalid format'; }
    if (form.contactInfo.emergencyContact && !/^[0-9]{9,15}$/.test(form.contactInfo.emergencyContact)) {
      validationErrors.push('Emergency contact must be 9-15 digits.'); newFieldErrors.emergencyContact = '9-15 digits'; }
    // Optional discount code pattern
    if (form.discountCode && !/^[A-Z0-9]{4,15}$/i.test(form.discountCode)) {
      validationErrors.push('Discount code should be 4-15 alphanumeric characters.');
    }
    // Limit special requests length
    if (form.specialRequests && form.specialRequests.length > 400) {
      validationErrors.push('Special requests must be 400 characters or less.');
    }
    if (validationErrors.length) {
      setError(validationErrors[0]);
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    // Selected already validated above

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
      if (bookingMode === 'reserve') {
        setSuccess('Reservation created successfully!');
        // Keep user on modal; auto-close after a short delay
        setTimeout(() => { setSelectedFacility(''); }, 900);
      } else {
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
      }
      
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

  // Fetch facility availability when selection changes
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!selectedFacility) { setFacilityBlockedRanges([]); return; }
      try {
        const data = await getFacilityAvailability(selectedFacility);
        if (!ignore && data && Array.isArray(data.ranges)) setFacilityBlockedRanges(data.ranges);
      } catch (_) { if (!ignore) setFacilityBlockedRanges([]); }
    })();
    return () => { ignore = true; };
  }, [selectedFacility]);

  const token = localStorage.getItem('token');

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50 py-8'}>
      <div className={embedded ? '' : 'max-w-4xl mx-auto px-4'}>
        {/* User-facing facilities list & booking modal */}
        {(
          true
        ) && (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Header */}
            {!embedded ? (
              <div className="bg-gradient-to-r from-[#000B58] to-[#001050] px-8 py-6">
                <h1 className="text-3xl font-bold text-white text-center">All Facilities</h1>
                <p className="text-white/80 text-center mt-1">Browse facilities and book instantly.</p>
              </div>
            ) : (
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-neutral-900">All Facilities</h2>
              </div>
            )}

            <div className="p-8">
              {/* Filters */}
              <form onSubmit={fetchFacilitiesWithFilters} className="bg-white rounded-lg border border-neutral-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="type" value={facilityFilters.type} onChange={(e)=>setFacilityFilters(prev=>({...prev, type:e.target.value}))} placeholder="Type (e.g., Conference Hall)" className="border rounded px-3 py-2" />
                <input name="minPrice" value={facilityFilters.minPrice} onChange={(e)=>setFacilityFilters(prev=>({...prev, minPrice:e.target.value}))} placeholder="Min Price" className="border rounded px-3 py-2" />
                <input name="maxPrice" value={facilityFilters.maxPrice} onChange={(e)=>setFacilityFilters(prev=>({...prev, maxPrice:e.target.value}))} placeholder="Max Price" className="border rounded px-3 py-2" />
                <div className="md:col-span-3 flex gap-3">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply Filters</button>
                  <button type="button" onClick={()=>{ setFacilityFilters({type:'',minPrice:'',maxPrice:''}); fetchFacilitiesWithFilters(); }} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Reset</button>
                </div>
              </form>

              {loadingFacilities ? (
                <div className="text-center text-gray-600">Loading facilities...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : facilities.length === 0 ? (
                <div className="text-center text-neutral-600">No facilities available.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {facilities.map((f) => (
                    <div key={f._id} className="bg-white rounded-lg border border-neutral-200 shadow hover:shadow-lg transition overflow-hidden">
                      {/* Image or placeholder */}
                      {Array.isArray(f.images) && f.images[0] ? (
                        <img src={f.images[0]} alt={f.name} className="w-full h-36 object-cover" />
                      ) : (
                        <div className="w-full h-36 bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">{f.type || 'Facility'}</div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{f.name}</h3>
                          <span className="text-blue-600 font-bold">{formatCurrency(f.pricePerNight || 0)}</span>
                        </div>
                        <p className="text-gray-600 text-sm">Max {f.maxGuests || 0} guests</p>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400"
                            disabled={!f.isAvailable}
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              if (!token) { navigate('/login'); return; }
                              setBookingMode('reserve'); setSelectedFacility(f._id); setError(''); setSuccess('');
                            }}
                          >
                            Reserve
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={!f.isAvailable}
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              if (!token) { navigate('/login'); return; }
                              setBookingMode('book'); setSelectedFacility(f._id); setError(''); setSuccess('');
                            }}
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking modal for selected facility */}
  {selectedFacility && selectedFacilityData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg max-h-[90vh]">
              <button onClick={()=>setSelectedFacility('')} className="absolute -top-2 -right-2 z-10 rounded-full bg-white px-3 py-1 text-sm shadow">Close</button>
              <div className="rounded-xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="px-6 pt-6">
                  <h3 className="text-xl font-semibold text-neutral-800 mb-1">{bookingMode === 'reserve' ? 'Reserve' : 'Book'}: {selectedFacilityData.name}</h3>
                  <p className="text-sm text-neutral-600 mb-4">Max {selectedFacilityData.maxGuests} guests • {formatCurrency(selectedFacilityData.pricePerNight || 0)} per night</p>
                </div>
                <div className="px-6 pb-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{success}</div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Check-in and Check-out */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-in - Check-out</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange} className={`w-full px-3 py-2 border rounded ${fieldErrors.checkIn ? 'border-red-400' : 'border-gray-300'}`} />
                        <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange} className={`w-full px-3 py-2 border rounded ${fieldErrors.checkOut ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      {(fieldErrors.checkIn || fieldErrors.checkOut) && <p className="text-xs text-red-600 mt-1">{fieldErrors.checkIn || fieldErrors.checkOut}</p>}
                      <div className="mt-3">
                        <AvailabilityCalendar
                          blockedRanges={facilityBlockedRanges}
                          valueStart={form.checkIn}
                          valueEnd={form.checkOut}
                          onChange={({ start, end }) => setForm(prev => ({ ...prev, checkIn: start || '', checkOut: end || '' }))}
                        />
                      </div>
                    </div>

                    {/* Guests and options */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                        <input type="number" name="numberOfGuests" min="1" value={form.numberOfGuests} onChange={handleChange} className="w-full px-3 py-2 border rounded border-gray-300" />
                      </div>
                      <div className="flex items-end gap-2">
                        <input id="flexibleDates" type="checkbox" name="flexibleDates" checked={form.flexibleDates} onChange={handleChange} />
                        <label htmlFor="flexibleDates" className="text-sm">Flexible Dates</label>
                      </div>
                    </div>

                    {/* Discount code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                      <input name="discountCode" value={form.discountCode} onChange={handleChange} className="w-full px-3 py-2 border rounded border-gray-300" placeholder="HERITAGE10 / EARLY20" />
                      {facilityBlockedRanges.length > 0 && (
                        <p className="text-xs text-red-600 mt-1">Some dates are unavailable for this facility.</p>
                      )}
                    </div>

                    {/* Special requests */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                      <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded border-gray-300" placeholder="Any specific needs?" />
                    </div>

                    {/* Contact info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input name="contactInfo.phone" value={form.contactInfo.phone} onChange={handleChange} className={`w-full px-3 py-2 border rounded ${fieldErrors.phone ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input name="contactInfo.email" value={form.contactInfo.email} onChange={handleChange} className={`w-full px-3 py-2 border rounded ${fieldErrors.email ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                        <input name="contactInfo.emergencyContact" value={form.contactInfo.emergencyContact} onChange={handleChange} className={`w-full px-3 py-2 border rounded ${fieldErrors.emergencyContact ? 'border-red-400' : 'border-gray-300'}`} />
                      </div>
                    </div>

                    {/* Pricing summary */}
                    <div className="rounded border border-neutral-200 p-3 text-sm bg-neutral-50">
                      <div className="flex justify-between"><span>Nights</span><span>{pricing.totalNights}</span></div>
                      <div className="flex justify-between"><span>Price/Night</span><span>{formatCurrency(pricing.pricePerNight || 0)}</span></div>
                      <div className="flex justify-between"><span>Total</span><span>{formatCurrency(pricing.totalAmount || 0)}</span></div>
                      <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(pricing.discountAmount || 0)}</span></div>
                      <div className="flex justify-between font-semibold"><span>Final</span><span>{formatCurrency(pricing.finalAmount || 0)}</span></div>
                    </div>

                    {/* Submit */}
                    <div className="pt-1">
                      <button type="submit" disabled={loading} className="w-full bg-[#000B58] hover:bg-[#001050] text-white text-sm font-semibold px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? (bookingMode === 'reserve' ? 'Reserving...' : 'Booking...') : (bookingMode === 'reserve' ? 'Reserve Facility' : 'Book Facility')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default FacilityBooking;