import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMyRefundStatus } from '../api/supportApi';

const RefundStatus = () => {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId') || '';
  const [state, setState] = useState({ loading: true });

  const ui = useMemo(() => {
    const raw = state?.data?.status;
    let label = 'Pending';
    let note = '';
    if (raw === 'Resolved') label = 'Approved';
    else if (raw === 'Open') label = 'Pending';
    else if (raw === 'NotRequested') {
      label = 'Pending';
      note = 'No refund request has been submitted yet.';
    }
    const color = label === 'Approved' ? 'text-green-700 bg-green-50 border-green-200' : 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return { label, note, color };
  }, [state]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!bookingId) return setState({ loading: false, error: 'Missing bookingId' });
    (async () => {
      try {
        const { data } = await getMyRefundStatus(bookingId, token);
        setState({ loading: false, data });
      } catch (err) {
        setState({ loading: false, error: err?.response?.data?.message || err?.message || 'Failed to load refund status' });
      }
    })();
  }, [bookingId]);

  return (
    <div className="flex min-h-[70vh] items-start justify-center bg-neutral-100">
      <div className="mt-10 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-center text-2xl font-semibold text-neutral-900">Refund Status</h2>
        <div className="mb-4 text-center text-xs text-neutral-600">Booking ID: {bookingId}</div>
        {state.loading ? (
          <div className="py-6 text-center text-neutral-600">Loading...</div>
        ) : state.error ? (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</div>
        ) : (
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 rounded border px-3 py-1 text-sm ${ui.color}`}>
              <span className="font-medium">Status:</span>
              <span>{ui.label}</span>
            </div>
            {ui.note && (
              <div className="text-xs text-neutral-500">{ui.note}</div>
            )}
            {state.data?.createdAt && (
              <div>
                <span className="font-medium">Requested: </span>
                <span>{new Date(state.data.createdAt).toLocaleString()}</span>
              </div>
            )}
            {state.data?.supportId && (
              <div className="text-xs text-neutral-500">Ticket ID: {state.data.supportId}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundStatus;
