const axios = require('axios');
const { Event, ChatMessage, Match } = require('../models/index');
const User = require('../models/User');
const { sendEventJoinedEmail, sendEventJoinConfirmEmail } = require('../utils/emailNotifications');

const NLP_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8002';

// ═══════════════════════════════════════════
// EVENT CONTROLLER
// ═══════════════════════════════════════════

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, creator: req.user._id });
    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { city, category, page = 1 } = req.query;
    const filter = { isOpen: true, date: { $gte: new Date() } };
    if (city) filter['location.city'] = city;
    if (category) filter.category = category;

    const events = await Event.find(filter)
      .populate('creator', 'name profilePhoto vibeTag isIdVerified')
      .sort({ date: 1 })
      .limit(20)
      .skip((page - 1) * 20);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('creator', 'email name');
    if (!event || !event.isOpen) return res.status(404).json({ message: 'Event not found or closed' });
    if (event.creator._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot join your own event' });
    }
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already joined' });
    }
    event.participants.push(req.user._id);
    if (event.participants.length >= event.maxParticipants) event.isOpen = false;
    await event.save();

    // Email to joiner
    sendEventJoinConfirmEmail(req.user.email, req.user.name, event.title, event.date, event.location?.city);
    // Email to creator
    if (event.creator._id.toString() !== req.user._id.toString()) {
      sendEventJoinedEmail(event.creator.email, event.creator.name, req.user.name, event.title);
    }

    res.json({ event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      $or: [{ creator: req.user._id }, { participants: req.user._id }]
    }).populate('creator participants', 'name profilePhoto');
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, creator: req.user._id });
    if (!event) return res.status(404).json({ message: 'Event not found or not authorized' });
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ═══════════════════════════════════════════
// CHAT CONTROLLER
// ═══════════════════════════════════════════

// ── SEND MESSAGE WITH MODERATION + SENTIMENT ─────────────
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, content } = req.body;
    if (!roomId || !content) return res.status(400).json({ message: 'roomId and content are required' });

    const match = await Match.findOne({
      chatRoomId: roomId,
      $or: [{ requester: req.user._id }, { receiver: req.user._id }],
      status: 'accepted'
    });
    if (!match) return res.status(403).json({ message: 'Access denied' });

    // Run moderation + sentiment in parallel
    let moderation = { flagged: false, action: 'allow' };
    let sentiment = { sentiment: 'neutral', distress_detected: false };
    try {
      const [modRes, sentRes] = await Promise.all([
        axios.post(`${NLP_URL}/moderate`, { message: content }, { timeout: 3000 }),
        axios.post(`${NLP_URL}/sentiment`, { message: content }, { timeout: 3000 }),
      ]);
      moderation = modRes.data;
      sentiment = sentRes.data;
    } catch (nlpErr) {
      console.warn('⚠️ NLP service unavailable:', nlpErr.message);
    }

    if (moderation.action === 'block_and_alert') {
      return res.status(400).json({ message: 'Message blocked: contains harmful content.', flagged: true });
    }

    const msg = await ChatMessage.create({ roomId, sender: req.user._id, content });
    await msg.populate('sender', 'name profilePhoto');

    res.status(201).json({
      message: msg,
      moderation,
      sentiment,
      warned: moderation.action === 'warn_user'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    // Verify user is part of this room (check match)
    const match = await Match.findOne({
      chatRoomId: roomId,
      $or: [{ requester: req.user._id }, { receiver: req.user._id }],
      status: 'accepted'
    });
    if (!match) return res.status(403).json({ message: 'Access denied' });

    const messages = await ChatMessage.find({ roomId })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyRooms = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ requester: req.user._id }, { receiver: req.user._id }],
      status: 'accepted'
    }).populate('requester receiver', 'name profilePhoto vibeTag');

    const rooms = await Promise.all(matches.map(async (m) => {
      const last = await ChatMessage.findOne({ roomId: m.chatRoomId }).sort({ createdAt: -1 });
      const other = m.requester._id.toString() === req.user._id.toString() ? m.receiver : m.requester;
      return { roomId: m.chatRoomId, matchId: m._id, other, lastMessage: last };
    }));
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
