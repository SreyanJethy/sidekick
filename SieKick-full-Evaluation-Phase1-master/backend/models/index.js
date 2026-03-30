const mongoose = require('mongoose');

// ─── MATCH ───────────────────────────────────────────────
const MatchSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // optional
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' },
  matchScore: Number,
  interestScore: Number,
  distanceScore: Number,
  availabilityScore: Number,
  safetyScore: Number,
  chatRoomId: String,
  requesterRating: { type: Number, min: 1, max: 5 },
  receiverRating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

// ─── EVENT ───────────────────────────────────────────────
const EventSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['movie','sports','food','music','hangout','study','rideshare','drive'] },
  date: { type: Date, required: true },
  timeSlot: String,
  location: {
    city: String,
    venue: String,
    lat: Number,
    lng: Number
  },
  maxParticipants: { type: Number, default: 2, min: 2, max: 20 },
  rideShareDetails: {
    pickupPoint: String,
    dropPoint: String,
    seatsAvailable: Number
  },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isOpen: { type: Boolean, default: true },
  tags: [String],
}, { timestamps: true });

// ─── CHAT MESSAGE ─────────────────────────────────────────
const ChatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ─── REPORT ───────────────────────────────────────────────
const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: {
    type: String,
    enum: ['harassment', 'fake_profile', 'inappropriate_behavior', 'spam', 'no_show', 'other'],
    required: true
  },
  description: String,
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  adminNote: String,
}, { timestamps: true });

module.exports = {
  Match: mongoose.model('Match', MatchSchema),
  Event: mongoose.model('Event', EventSchema),
  ChatMessage: mongoose.model('ChatMessage', ChatMessageSchema),
  Report: mongoose.model('Report', ReportSchema)
};
