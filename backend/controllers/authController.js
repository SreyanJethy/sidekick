const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

const sanitize = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.passwordHash;
  delete u.otpCode;
  delete u.faceDescriptor;
  return u;
};

// ── REGISTER ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const phoneClean = phone.replace(/\s/g, '');
    if (!/^\+?[\d]{10,15}$/.test(phoneClean)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone: phoneClean }] });
    if (existing) {
      return res.status(400).json({ message: 'Email or phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone: phoneClean, passwordHash });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phoneClean, { otp, expiry: Date.now() + 10 * 60 * 1000 });
    console.log(`📱 OTP for ${phoneClean}: ${otp}`);

    res.status(201).json({ message: 'Registered. Check server console for OTP.', userId: user._id, phone: phoneClean });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── VERIFY OTP ────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }
    const phoneClean = phone.replace(/\s/g, '');
    const record = otpStore.get(phoneClean);
    if (!record || record.otp !== otp || Date.now() > record.expiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    otpStore.delete(phoneClean);
    const user = await User.findOneAndUpdate(
      { phone: phoneClean },
      { isPhoneVerified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { accessToken } = generateTokens(user._id);
    res.json({ message: 'Phone verified', accessToken, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── RESEND OTP ────────────────────────────────────────────
exports.resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });
    const phoneClean = phone.replace(/\s/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phoneClean, { otp, expiry: Date.now() + 10 * 60 * 1000 });
    console.log(`📱 Resent OTP for ${phoneClean}: ${otp}`);
    res.json({ message: 'OTP resent. Check server console.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isPhoneVerified) {
      return res.status(403).json({ message: 'Phone not verified. Please verify OTP first.' });
    }
    const { accessToken } = generateTokens(user._id);
    res.json({ accessToken, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── MOCK GOV ID VERIFICATION ──────────────────────────────
exports.verifyGovId = async (req, res) => {
  try {
    const { idType, idNumber } = req.body;
    if (!idType || !idNumber) {
      return res.status(400).json({ message: 'idType and idNumber are required' });
    }
    // Simulate 95% success (in production: integrate DigiLocker/Aadhaar)
    const verified = Math.random() > 0.05;
    if (!verified) {
      return res.status(400).json({ message: 'ID verification failed. Please try again.' });
    }
    await User.findByIdAndUpdate(req.user._id, { isIdVerified: true });
    res.json({ message: 'Government ID verified ✅', idType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── FACE VERIFICATION ─────────────────────────────────────
exports.verifyFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    if (!faceDescriptor) {
      return res.status(400).json({ message: 'No face data provided' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      isFaceVerified: true,
      faceDescriptor: faceDescriptor.substring(0, 64),
    });
    res.json({ message: 'Face verified ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ME ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ user: sanitize(req.user) });
};
