import axios from 'axios';

const API_URL = 'http://localhost:5000/api/feedback';

export const getPublicFeedbacks = () => {
  return axios.get(`${API_URL}/public`);
};

export const createFeedback = (data, token) => {
  return axios.post(`${API_URL}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getAllFeedbacks = (token) => {
  return axios.get(`${API_URL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const respondToFeedback = (id, adminResponse, token) => {
  return axios.put(`${API_URL}/${id}/respond`, { adminResponse }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
