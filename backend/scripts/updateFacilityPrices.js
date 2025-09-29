/**
 * One-off script to bulk update facility pricePerNight values.
 * Maps existing (likely lower) prices to new LKR values.
 * Run with: node scripts/updateFacilityPrices.js
 */
// Ensure we load the backend .env even if script is executed from repo root
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Facility = require('../models/Facility');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Missing MONGO_URI in .env');
  process.exit(1);
}

// Mapping logic (explicit):
// Existing pricePerNight values expected: 150, 180, 250, 320, 450
// Desired new LKR values:             45000, 60000, 80000, 120000, 160000
// We map ascending(old)->ascending(new) preserving order.
const PRICE_MAP = {
  150: 45000,
  180: 60000,
  250: 80000,
  320: 120000,
  450: 160000,
};

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected. Fetching facilities...');
  const facilities = await Facility.find();
  if (!facilities.length) {
    console.log('No facilities found. Exiting.');
    return;
  }

  const updates = [];
  for (const f of facilities) {
    const oldPrice = f.pricePerNight;
    if (Object.prototype.hasOwnProperty.call(PRICE_MAP, oldPrice)) {
      const newPrice = PRICE_MAP[oldPrice];
      if (newPrice !== oldPrice) {
        f.pricePerNight = newPrice;
        await f.save();
        updates.push({ name: f.name, oldPrice, newPrice });
      }
    }
  }

  console.log('Updated facilities:');
  if (updates.length === 0) {
    console.log('No facilities matched the expected original price values. They may already be updated.');
  } else {
    updates.forEach(u => console.log(` - ${u.name}: ${u.oldPrice} -> ${u.newPrice}`));
  }
  console.log('Done.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Update error:', err);
  mongoose.disconnect().finally(()=>process.exit(1));
});
