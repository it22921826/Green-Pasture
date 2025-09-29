import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { useParams } from 'react-router-dom';
import { getRoomById } from '../api/roomApi';

const RoomDetails = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getRoomById(id);
        setRoom(data);
      } catch (e) {
        setError(e.message || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Loading...</div>;
  if (error) return <div className="min-h-[60vh] flex items-center justify-center text-red-600">{error}</div>;
  if (!room) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Room {room.roomNumber}</h1>
          <p className="text-gray-600">{room.type} • {formatCurrency(room.price)} • Capacity {room.capacity}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              {(room.photos || []).length > 0 ? (
                room.photos.map((src, idx) => (
                  <img key={idx} src={src} alt={`Room ${room.roomNumber} ${idx+1}`} className="w-full h-48 object-cover rounded" />
                ))
              ) : (
                <div className="col-span-2 h-48 bg-gray-200 rounded flex items-center justify-center text-gray-500">No photos</div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Details</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <div><span className="font-medium">Status:</span> {room.status}</div>
              {room.description && <div><span className="font-medium">Description:</span> {room.description}</div>}
              <div className="mt-2">
                <span className="font-medium">Amenities:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(room.amenities || []).map((a, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
