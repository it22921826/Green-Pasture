const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    adminResponse: { type: String, trim: true, maxlength: 2000 },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },
    status: { type: String, enum: ['Published', 'Hidden'], default: 'Published' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);
