import axios from 'axios';

// Use absolute URL like other APIs for consistency. Rely on axios.defaults.baseURL override if set.
const API_URL = 'http://localhost:5000/api/staff';

// Fetch all staff members
export const fetchAllStaff = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (err) {
    console.error('[staffApi] fetchAllStaff failed', err?.response?.data || err.message);
    throw err;
  }
};

// Fetch a single staff member by ID
export const fetchStaffById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create a new staff member
export const createStaff = async (staffData) => {
  try {
    const response = await axios.post(API_URL, staffData);
    return response.data;
  } catch (err) {
    console.error('[staffApi] createStaff failed', err?.response?.data || err.message);
    throw err;
  }
};

// Update a staff member by ID
export const updateStaff = async (id, staffData) => {
  const response = await axios.put(`${API_URL}/${id}`, staffData);
  return response.data;
};

// Delete a staff member by ID
export const deleteStaff = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};