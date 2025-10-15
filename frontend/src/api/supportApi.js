import axios from 'axios';

const API_URL = 'http://localhost:5000/api/support';

export const createSupport = (data, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return axios.post(`${API_URL}`, data, { headers });
};

export const getSupportAll = (token) => {
  return axios.get(`${API_URL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateSupportStatus = (id, status, token) => {
  return axios.put(`${API_URL}/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getMyRefundStatus = (bookingId, token) => {
  return axios.get(`${API_URL}/my/refund-status/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
