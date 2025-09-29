import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

export const register = (data) => axios.post(`${API_URL}/register`, data);
export const login = (data) => axios.post(`${API_URL}/login`, data);
export const getProfile = (token) => axios.get(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } });
export const updateProfile = (data, token) => axios.put(`${API_URL}/profile`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAllUsers = (token) => axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
export const deleteUser = (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
export const deleteGuest = async (guestId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/delete-guest/${guestId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error) {
    console.error('deleteGuest API error:', error);
    throw error;
  }
};
export const changePassword = (data, token) => axios.put(`${API_URL}/change-password`, data, { headers: { Authorization: `Bearer ${token}` } });
