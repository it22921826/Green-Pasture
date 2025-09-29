import React, { useEffect, useState } from 'react';
import { getPublicFeedbacks, createFeedback } from '../api/feedbackApi';
import { decodeToken } from '../utils/authHelper';

const Star = ({ filled, onClick }) => (
  <button type="button" onClick={onClick} className={`text-2xl ${filled ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
);

const Feedback = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const token = localStorage.getItem('token');
  const user = token ? decodeToken(token) : null;

  const load = async () => {
    try {
      setLoading(true);
      const res = await getPublicFeedbacks();
      setList(res.data || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Please log in to submit feedback');
      return;
    }
    try {
      await createFeedback({ rating, comment }, token);
      setComment('');
      setRating(5);
      await load();
      alert('Thank you! Your feedback has been submitted.');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Failed to submit feedback';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback & Ratings</h1>
        <p className="text-gray-600 mb-6">Share your experience and see what others say. Admin responses are shown publicly.</p>

        {/* Feedback form (only registered users) */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave a Review</h2>
          {!user && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded">You must be logged in to submit feedback.</div>
          )}
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} filled={i <= rating} onClick={() => setRating(i)} />
                ))}
                <span className="ml-2 text-sm text-gray-600">{rating} / 5</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Feedback</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Tell us about your stay..."
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!user}
              />
            </div>
            <button
              type="submit"
              disabled={!user}
              className={`px-5 py-2 rounded text-white ${user ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Submit Feedback
            </button>
            {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
          </form>
        </div>

        {/* Public reviews list */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-6">
              {list.map((fb) => (
                <div key={fb._id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900">{fb.user?.name || 'Guest'}</div>
                    <div className="text-yellow-400 text-lg">{'★'.repeat(fb.rating)}<span className="text-gray-300">{'★'.repeat(5 - fb.rating)}</span></div>
                  </div>
                  <p className="mt-2 text-gray-800 whitespace-pre-wrap">{fb.comment}</p>
                  <div className="mt-2 text-xs text-gray-500">{new Date(fb.createdAt).toLocaleString()}</div>
                  {fb.adminResponse && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded p-3">
                      <div className="text-sm text-blue-800"><strong>Admin response:</strong> {fb.adminResponse}</div>
                      <div className="text-xs text-blue-600 mt-1">{fb.respondedBy?.name ? `by ${fb.respondedBy?.name} ` : ''}{fb.respondedAt ? `on ${new Date(fb.respondedAt).toLocaleString()}` : ''}</div>
                    </div>
                  )}
                </div>
              ))}
              {list.length === 0 && <div className="text-gray-500">No reviews yet. Be the first to leave feedback!</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
