import Feedback from '../models/Feedback.js';

// Create feedback (registered users only)
export const createFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!req.user?._id) return res.status(401).json({ message: 'Not authorized' });
    if (!rating || !comment) return res.status(400).json({ message: 'Rating and comment are required' });

    const created = await Feedback.create({
      user: req.user._id,
      rating,
      comment,
    });

    const populated = await created.populate('user', 'name email role');
    return res.status(201).json(populated);
  } catch (err) {
    console.error('createFeedback error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get public feedbacks (visible to all users)
export const getPublicFeedbacks = async (req, res) => {
  try {
    const items = await Feedback.find({ status: 'Published' })
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .populate('respondedBy', 'name');
    return res.json(items);
  } catch (err) {
    console.error('getPublicFeedbacks error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: get all feedbacks
export const getAllFeedbacks = async (req, res) => {
  try {
    const items = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('respondedBy', 'name email');
    return res.json(items);
  } catch (err) {
    console.error('getAllFeedbacks error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin: respond to feedback
export const respondToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;
    if (!adminResponse) return res.status(400).json({ message: 'Response is required' });

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { adminResponse, respondedBy: req.user._id, respondedAt: new Date() },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('respondedBy', 'name email');
    if (!updated) return res.status(404).json({ message: 'Feedback not found' });
    return res.json(updated);
  } catch (err) {
    console.error('respondToFeedback error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
