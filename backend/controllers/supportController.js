const SupportMessage = require('../models/SupportMessage');

// Create a support message (public - users may or may not be logged in)
exports.createSupportMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const payload = {
      name,
      email,
      phone,
      subject,
      message,
    };
    if (req.user?._id) payload.user = req.user._id;

    const created = await SupportMessage.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error('createSupportMessage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all support messages (admin only)
exports.getAllSupportMessages = async (req, res) => {
  try {
    const items = await SupportMessage.find().sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    console.error('getAllSupportMessages error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update message status (admin only)
exports.updateSupportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Open' or 'Resolved'
    if (!['Open', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const updated = await SupportMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    return res.json(updated);
  } catch (err) {
    console.error('updateSupportStatus error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
