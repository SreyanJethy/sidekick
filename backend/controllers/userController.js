const User = require('../models/User');
const { Report } = require('../models/index');

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'age', 'gender', 'bio', 'profilePhoto', 'interests', 'vibeTag', 'availability', 'location', 'safetyContacts'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name age gender bio profilePhoto interests vibeTag safetyScore isIdVerified isFaceVerified location');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reportUser = async (req, res) => {
  try {
    const { reportedId, reason, description } = req.body;
    await Report.create({ reporter: req.user._id, reported: reportedId, reason, description });
    // Auto-block
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: reportedId } });
    // Decrease safety score of reported user
    await User.findByIdAndUpdate(reportedId, { $inc: { safetyScore: -10 } });
    res.json({ message: 'Report submitted. User blocked.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
