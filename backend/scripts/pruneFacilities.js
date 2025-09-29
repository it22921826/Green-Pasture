// Script to keep only specified event facilities visible
// Usage: node backend/scripts/pruneFacilities.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Facility = require('../models/Facility');

const KEEP = new Map([
  ['Conference & Meeting Rooms', { pricePerNight: 16000, maxGuests: 8 }],
  ['Ballrooms & Banquet Halls', { pricePerNight: 200000, maxGuests: 200 }],
  ['Business Center', { pricePerNight: 50000, maxGuests: 20 }],
  ['Executive Lounge', { pricePerNight: 170000, maxGuests: 160 }],
  ['Outdoor/Unique Event Spaces', { pricePerNight: 90000, maxGuests: 100 }]
]);

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) { console.error('Missing MONGO_URI'); process.exit(1); }
  await mongoose.connect(uri);
  try {
    const all = await Facility.find();
    const report = { updated: [], disabled: [], created: [] };

    // Ensure keepers exist / updated
    for (const [name, meta] of KEEP.entries()) {
      let f = all.find(x => x.name === name);
      if (!f) {
        f = await Facility.create({
          name,
          type: 'Event',
          description: name + ' facility',
          location: 'Sri Lanka',
          amenities: ['WiFi','Parking'],
          images: [],
          pricePerNight: meta.pricePerNight,
          maxGuests: meta.maxGuests,
          isAvailable: true,
          rating: 4.5,
          totalReviews: 0
        });
        report.created.push(name);
      } else {
        let changed = false;
        if (f.pricePerNight !== meta.pricePerNight) { f.pricePerNight = meta.pricePerNight; changed = true; }
        if (f.maxGuests !== meta.maxGuests) { f.maxGuests = meta.maxGuests; changed = true; }
        if (!f.isAvailable) { f.isAvailable = true; changed = true; }
        if (changed) { await f.save(); report.updated.push(name); }
      }
    }

    // Disable all others (soft delete)
    const toDisable = all.filter(x => !KEEP.has(x.name));
    for (const f of toDisable) {
      if (f.isAvailable) { f.isAvailable = false; await f.save(); report.disabled.push(f.name); }
    }

    console.log('Prune complete:', report);
  } catch (e) {
    console.error('Error pruning facilities', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
