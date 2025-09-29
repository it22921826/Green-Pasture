const API_BASE_URL = 'http://localhost:5000/api';

export const getRooms = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  const res = await fetch(`${API_BASE_URL}/rooms${params.toString() ? `?${params.toString()}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  const json = await res.json();
  // Backward compatibility if server still returns array
  if (Array.isArray(json)) return json; // legacy
  return json.items || [];
};

export const getRoomById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/rooms/${id}`);
  if (!res.ok) throw new Error('Failed to fetch room');
  const json = await res.json();
  if (json && json.item) return json.item; // new structure
  return json; // fallback legacy
};

export const createRoom = async (data, token) => {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'photos' && Array.isArray(v)) {
      v.forEach((file) => form.append('photos', file));
    } else if (v !== undefined && v !== null) {
      form.append(k, v);
    }
  });
  const res = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create room');
  }
  return res.json();
};

export const updateRoom = async (id, data, token) => {
  const form = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'photos' && Array.isArray(v)) {
      v.forEach((file) => form.append('photos', file));
    } else if (v !== undefined && v !== null) {
      form.append(k, v);
    }
  });
  const res = await fetch(`${API_BASE_URL}/rooms/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update room');
  }
  return res.json();
};

export const deleteRoom = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/rooms/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete room');
  }
  return res.json();
};
