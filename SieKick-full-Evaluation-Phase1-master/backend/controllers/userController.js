const axios = require('axios');
const User = require('../models/User');
const { Report } = require('../models/index');

const NLP_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8002';

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'age', 'gender', 'bio', 'profilePhoto', 'interests', 'vibeTag', 'availability', 'location', 'safetyContacts'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Auto-generate vibe tag from interests
    if (updates.interests && updates.interests.length > 0 && !updates.vibeTag) {
      try {
        const { data } = await axios.post(`${NLP_URL}/vibe-tag`, { interests: updates.interests }, { timeout: 3000 });
        updates.vibeTag = data.vibeTag;
      } catch (nlpErr) {
        console.warn('⚠️ Vibe tag service unavailable:', nlpErr.message);
      }
    }

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

exports.rateUser = async (req, res) => {
  try {
    const { userId, rating, matchId } = req.body;
    if (!userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'userId and rating (1-5) are required' });
    }
    const { Match } = require('../models/index');
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ requester: req.user._id }, { receiver: req.user._id }],
      status: 'accepted'
    });
    if (!match) return res.status(404).json({ message: 'Match not found' });
    // Store rating on match
    const isRequester = match.requester.toString() === req.user._id.toString();
    if (isRequester) match.requesterRating = rating;
    else match.receiverRating = rating;
    await match.save();
    // Adjust safety score: 5★ = +2, 1★ = -5
    const delta = rating >= 4 ? 2 : rating <= 2 ? -5 : 0;
    if (delta !== 0) await User.findByIdAndUpdate(userId, { $inc: { safetyScore: delta } });
    res.json({ message: 'Rating submitted' });
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
