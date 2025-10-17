import React, { useMemo, useState } from 'react';

// Simple, dependency-free calendar with blocked ranges and range selection
// Props:
// - blockedRanges: [{ start: Date|string, end: Date|string }] end is exclusive
// - valueStart: ISO string (YYYY-MM-DD)
// - valueEnd: ISO string (YYYY-MM-DD)
// - onChange: ({ start: ISO|null, end: ISO|null })
export default function AvailabilityCalendar({ blockedRanges = [], valueStart = '', valueEnd = '', onChange }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const normDate = (d) => {
    const dt = new Date(d);
    dt.setHours(0,0,0,0);
    return dt;
  };
  const toISO = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const parsedBlocked = useMemo(() => blockedRanges.map(r => ({ start: normDate(r.start), end: normDate(r.end) })), [blockedRanges]);
  const isBlocked = (date) => parsedBlocked.some(r => date >= r.start && date < r.end);

  const startSel = valueStart ? normDate(valueStart) : null;
  const endSel = valueEnd ? normDate(valueEnd) : null;
  const inSelected = (date) => startSel && endSel && date >= startSel && date <= endSel;

  const daysInMonth = (y,m) => new Date(y, m+1, 0).getDate();
  const startOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const firstWeekday = startOfMonth.getDay(); // 0=Sun
  const count = daysInMonth(cursor.getFullYear(), cursor.getMonth());

  const handleDayClick = (d) => {
    if (isBlocked(d)) return; // ignore
    if (!startSel || (startSel && endSel)) {
      onChange?.({ start: toISO(d), end: '' });
      return;
    }
    // choose end
    if (d <= startSel) {
      onChange?.({ start: toISO(d), end: '' });
    } else {
      // ensure no blocked day in [startSel, d)
      let cur = new Date(startSel);
      let ok = true;
      while (cur < d) {
        if (isBlocked(cur)) { ok = false; break; }
        cur.setDate(cur.getDate()+1);
      }
      if (!ok) return; // ignore invalid range over blocked dates
      onChange?.({ start: toISO(startSel), end: toISO(d) });
    }
  };

  const go = (delta) => {
    const next = new Date(cursor);
    next.setMonth(cursor.getMonth()+delta);
    setCursor(next);
  };

  const weeks = [];
  let week = new Array(firstWeekday).fill(null);
  for (let day=1; day<=count; day++) {
    week.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-lg border border-neutral-200 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200" onClick={()=>go(-1)}>{'<'}</button>
        <div className="font-semibold">{monthLabel}</div>
        <button type="button" className="px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200" onClick={()=>go(1)}>{'>'}</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-600 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-rows-6 gap-1">
        {weeks.map((w,i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {w.map((d, j) => {
              if (!d) return <div key={j} className="h-8" />;
              const blocked = isBlocked(d);
              const selected = (startSel && d.getTime() === startSel.getTime()) || (endSel && d.getTime() === endSel.getTime());
              const inSel = inSelected(d);
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => handleDayClick(d)}
                  className={`h-8 rounded text-xs ${blocked ? 'bg-red-100 text-red-500 cursor-not-allowed' : inSel ? 'bg-blue-100 text-blue-700' : 'bg-white hover:bg-neutral-100'} ${selected ? 'ring-2 ring-blue-500' : ''}`}
                  disabled={blocked}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-neutral-600">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-200" /> Booked</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-200" /> Selected</span>
      </div>
    </div>
  );
}
