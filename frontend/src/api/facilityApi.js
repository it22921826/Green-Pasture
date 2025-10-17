// Clean, rebuilt Facilities & Facility Bookings API client
const API_BASE_URL = 'http://localhost:5000/api';

// Helper to safely parse JSON without throwing
async function safeJson(res) { try { return await res.json(); } catch { return null; } }

// ---------------- Facilities ----------------
export const getAllFacilities = async (filters = {}) => {
  const qs = new URLSearchParams();
  if (filters.type) qs.append('type', filters.type);
  if (filters.location) qs.append('location', filters.location);
  if (filters.minPrice) qs.append('minPrice', filters.minPrice);
  if (filters.maxPrice) qs.append('maxPrice', filters.maxPrice);
  const url = `${API_BASE_URL}/facilities${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch facilities');
  const data = await safeJson(res);
  if (data && Array.isArray(data.items)) return data.items; // new wrapped
  if (Array.isArray(data)) return data; // legacy direct list
  return [];
};

export const getFacilityById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/facilities/${id}`);
  if (!res.ok) throw new Error('Failed to fetch facility');
  const data = await safeJson(res);
  return (data && data.item) || data;
};

export const createFacility = async (facilityData, token) => {
  const res = await fetch(`${API_BASE_URL}/facilities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(facilityData)
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to create facility');
  return (data && data.item) || data;
};

export const updateFacility = async (id, facilityData, token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(facilityData)
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to update facility');
  return (data && data.item) || data;
};

export const deleteFacility = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to delete facility');
  return data;
};

// ---------------- Facility Bookings ----------------
export const createFacilityBooking = async (bookingData, token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(bookingData)
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to create booking');
  if (data && data.item) return data.item;      // new wrapped
  if (data && data._id) return data;            // legacy direct
  if (Array.isArray(data) && data.length) return data[0];
  throw new Error('Unexpected booking response format');
};

export const getMyFacilityBookings = async (token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/bookings/my`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to fetch bookings');
  if (data && Array.isArray(data.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

export const getAllFacilityBookings = async (token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/bookings/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to fetch all bookings');
  if (data && data.item && Array.isArray(data.item)) return data.item; // edge variant
  if (data && Array.isArray(data.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

export const updateFacilityBooking = async (id, bookingData, token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(bookingData)
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to update booking');
  return (data && data.item) || data;
};

export const cancelFacilityBooking = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to cancel booking');
  return data;
};

export const deleteFacilityBooking = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/facilities/bookings/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error((data && data.message) || 'Failed to delete booking');
  return data;
};

// Public: get facility availability (blocked date ranges)
export const getFacilityAvailability = async (facilityId) => {
  const res = await fetch(`${API_BASE_URL}/facilities/${facilityId}/availability`);
  if (!res.ok) throw new Error('Failed to fetch facility availability');
  const data = await safeJson(res);
  return data;
};