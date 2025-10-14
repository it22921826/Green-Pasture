import React, { useState, useEffect } from 'react';
import { createFacility, updateFacility } from '../api/facilityApi';
import { decodeToken } from '../utils/authHelper';

const typeOptions = [
  'Hotel','Resort','Villa','Suite','Conference Hall','Spa','Restaurant','Event','Business Center','Executive Lounge','Outdoor Event Space'
];

const FacilityCreateForm = ({ onCreated, onUpdated }) => {
  const token = localStorage.getItem('token');
  const user = token ? decodeToken(token) : null;
  const role = user?.role || user?.user?.role;
  if (!role || !['Admin','Staff'].includes(role)) return null; // Only Staff/Admin

  const [form, setForm] = useState({
    name: '',
    type: 'Conference Hall',
    location: '',
    pricePerNight: '',
    maxGuests: 2,
    description: '',
    amenities: '',
    isAvailable: true
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]); // base64 or URL strings

  // Listen for edit requests dispatched from table
  useEffect(() => {
    const handler = (e) => {
      const f = e.detail;
      if (!f) return;
      setEditId(f._id || null);
      setForm({
        name: f.name || '',
        type: f.type || 'Conference Hall',
        location: f.location || '',
        pricePerNight: f.pricePerNight ?? '',
        maxGuests: f.maxGuests ?? 2,
        description: f.description || '',
        amenities: Array.isArray(f.amenities) ? f.amenities.join(', ') : (f.amenities || ''),
        isAvailable: f.isAvailable !== undefined ? f.isAvailable : true
      });
      setImages(Array.isArray(f.images) ? f.images.slice(0,5) : []);
      setMessage('Editing facility – make changes and Save');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('facility-edit-request', handler);
    return () => window.removeEventListener('facility-edit-request', handler);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.location.trim()) e.location = 'Location required';
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) e.pricePerNight = 'Positive price required';
    if (!form.maxGuests || Number(form.maxGuests) < 1) e.maxGuests = 'Guests >=1';
    if (!form.type) e.type = 'Type required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setMessage('');
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        location: form.location.trim(),
        pricePerNight: Number(form.pricePerNight),
        maxGuests: Number(form.maxGuests),
        description: form.description.trim() || undefined,
        amenities: form.amenities ? form.amenities.split(',').map(a=>a.trim()).filter(Boolean) : [],
        isAvailable: form.isAvailable,
        images: images.slice(0,5)
      };
      if (editId) {
        const updated = await updateFacility(editId, payload, token);
        setMessage('Facility updated');
        onUpdated && onUpdated(updated);
      } else {
        const created = await createFacility(payload, token);
        setMessage('Facility created');
        onCreated && onCreated(created);
      }
      setEditId(null);
      setForm({ name:'', type:'Conference Hall', location:'', pricePerNight:'', maxGuests:2, description:'', amenities:'', isAvailable:true });
      setImages([]);
    } catch (err) {
      setMessage(err.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const maxFiles = 5;
    const remaining = maxFiles - images.length;
    if (remaining <= 0) { setMessage('You can upload up to 5 images'); return; }
    const toRead = files.slice(0, remaining);
    const acceptedTypes = ['image/jpeg','image/png','image/webp','image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const readAsDataURL = (file) => new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
    const next = [];
    for (const file of toRead) {
      if (!acceptedTypes.includes(file.type)) { setMessage('Only JPG, PNG, WEBP images allowed'); continue; }
      if (file.size > maxSize) { setMessage('Each image must be 2MB or less'); continue; }
      try {
        const dataUrl = await readAsDataURL(file);
        next.push(String(dataUrl));
      } catch {
        setMessage('Failed to read one of the images');
      }
    }
    if (next.length) setImages(prev => [...prev, ...next].slice(0, maxFiles));
    e.target.value = '';
  };

  const removeImageAt = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-10 border border-blue-200 rounded-2xl bg-white shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#000B58]">{editId ? 'Edit Facility' : 'Add New Facility'}</h2>
        {editId && (
          <button
            type="button"
            onClick={() => { setEditId(null); setForm({ name:'', type:'Conference Hall', location:'', pricePerNight:'', maxGuests:2, description:'', amenities:'', isAvailable:true }); setMessage('Edit cancelled'); }}
            className="text-xs px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
          >Cancel Edit</button>
        )}
      </div>
      {message && <div className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">{message}</div>}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} className={`w-full rounded border px-3 py-2 text-sm ${errors.name ? 'border-red-400' : 'border-gray-300'}`} placeholder="Grand Ballroom" />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select name="type" value={form.type} onChange={handleChange} className={`w-full rounded border px-3 py-2 text-sm ${errors.type ? 'border-red-400' : 'border-gray-300'}`}>{typeOptions.map(t=> <option key={t} value={t}>{t}</option>)}</select>
          {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium mb-1">Location</label>
          <input name="location" value={form.location} onChange={handleChange} className={`w-full rounded border px-3 py-2 text-sm ${errors.location ? 'border-red-400' : 'border-gray-300'}`} placeholder="Main Wing" />
          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium mb-1">Price Per Night (Rs)</label>
          <input name="pricePerNight" type="number" min="0" value={form.pricePerNight} onChange={handleChange} className={`w-full rounded border px-3 py-2 text-sm ${errors.pricePerNight ? 'border-red-400' : 'border-gray-300'}`} placeholder="75000" />
          {errors.pricePerNight && <p className="text-xs text-red-600 mt-1">{errors.pricePerNight}</p>}
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="block text-sm font-medium mb-1">Max Guests</label>
            <input name="maxGuests" type="number" min="1" value={form.maxGuests} onChange={handleChange} className={`w-full rounded border px-3 py-2 text-sm ${errors.maxGuests ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.maxGuests && <p className="text-xs text-red-600 mt-1">{errors.maxGuests}</p>}
        </div>
        {/* Images upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Images</label>
          <input type="file" accept="image/*" multiple onChange={onFilesSelected} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#000B58] file:text-white hover:file:bg-[#001050]" />
          <p className="text-xs text-neutral-600 mt-1">Up to 5 images. JPG, PNG, or WEBP. Max 2MB each.</p>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((src, idx) => (
                <div key={idx} className="relative group border rounded overflow-hidden">
                  <img src={src} alt={`Facility ${idx+1}`} className="w-full h-24 object-cover" />
                  <button type="button" onClick={() => removeImageAt(idx)} className="absolute top-1 right-1 bg-white/90 text-xs px-1.5 py-0.5 rounded shadow hover:bg-white">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Amenities (comma separated)</label>
          <input name="amenities" value={form.amenities} onChange={handleChange} className="w-full rounded border px-3 py-2 text-sm border-gray-300" placeholder="Projector, Sound System, Stage" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full rounded border px-3 py-2 text-sm border-gray-300" placeholder="Spacious hall ideal for conferences and weddings." />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input id="isAvailable" name="isAvailable" type="checkbox" checked={form.isAvailable} onChange={handleChange} className="h-4 w-4" />
          <label htmlFor="isAvailable" className="text-sm">Available for booking</label>
        </div>
        <div className="col-span-2">
          <button type="submit" disabled={submitting} className="w-full md:w-auto bg-[#000B58] hover:bg-[#001050] text-white text-sm font-semibold px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? (editId ? 'Saving...' : 'Creating...') : (editId ? 'Save Changes' : 'Create Facility')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FacilityCreateForm;