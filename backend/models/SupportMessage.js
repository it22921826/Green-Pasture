import mongoose from 'mongoose';

const SupportMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
    status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const SupportMessage = mongoose.model('SupportMessage', SupportMessageSchema);
export default SupportMessage;
