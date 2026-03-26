const { Event, ChatMessage, Match } = require('../models/index');

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
    const event = await Event.findById(req.params.id);
    if (!event || !event.isOpen) return res.status(404).json({ message: 'Event not found or closed' });
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already joined' });
    }
    event.participants.push(req.user._id);
    if (event.participants.length >= event.maxParticipants) event.isOpen = false;
    await event.save();
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

// ═══════════════════════════════════════════
// CHAT CONTROLLER
// ═══════════════════════════════════════════

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
