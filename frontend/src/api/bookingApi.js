import axios from 'axios';

// Use explicit backend URL to avoid relying on dev-server proxy and port mismatches
const API_URL = 'http://localhost:5000/api/bookings';

export const createBooking = (data, token) => axios.post(API_URL, data, { headers: { Authorization: `Bearer ${token}` } });
export const getMyBookings = (token) => axios.get(`${API_URL}/my`, { headers: { Authorization: `Bearer ${token}` } });
export const getAllBookings = (token) => axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
export const updateBooking = (id, data, token) => axios.put(`${API_URL}/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteBooking = (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
export const cancelBooking = (id, token) => axios.patch(`${API_URL}/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
// Dedicated status update (PATCH /:id/status) expecting body { status: 'Approved' | 'Pending' }
export const setBookingStatus = (id, uiStatus, token) => axios.patch(`${API_URL}/${id}/status`, { status: uiStatus }, { headers: { Authorization: `Bearer ${token}` } });
