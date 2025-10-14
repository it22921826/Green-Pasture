import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase body size limits to support base64 images from client
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes 
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

// Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes); // Register staff routes
app.use('/api/facilities', facilityRoutes); // Register facility routes
app.use('/api/support', supportRoutes); // Register support routes
app.use('/api/feedback', feedbackRoutes); // Register feedback routes
app.use('/api/rooms', roomRoutes); // Register room routes
app.use('/api', paymentRoutes); // Register payment routes (provides /api/payments/manual)
app.use('/api', invoiceRoutes); // Register invoice routes for /api/invoices

// Simple SSE 
const sseClients = new Set();
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write('event: ping\ndata: connected\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

export const broadcastEvent = (type, payload) => {
  const line = `event: ${type}\ndata: ${JSON.stringify(payload||{})}\n\n`;
  for (const client of sseClients) {
    try { client.write(line); } catch(_){}
  }
};

// Debug: check if MONGO_URI is loaded
console.log("Mongo URI:", process.env.MONGO_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});
app.get('/', (req, res) => {
    res.send('Hotel Management System API is running');
  });