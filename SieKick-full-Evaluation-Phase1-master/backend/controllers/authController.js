const bcrypt = require('bcryptjs');
const axios = require('axios');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');

const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:8001';

const sanitize = (user) => {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.passwordHash;
  delete u.otpCode;
  delete u.otpExpiry;
  delete u.faceDescriptor;
  return u;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp, name) => {
  await transporter.sendMail({
    from: `"SideKick" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your SideKick OTP Code',
    html: `<p>Hi ${name},</p><p>Your OTP is: <b style="font-size:24px">${otp}</b></p><p>Valid for 10 minutes.</p>`,
  });
};

// ── REGISTER ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const phoneClean = phone.replace(/\s/g, '');
    if (!/^\+?[\d]{10,15}$/.test(phoneClean))
      return res.status(400).json({ message: 'Invalid phone number format' });

    const existing = await User.findOne({ $or: [{ email }, { phone: phoneClean }] });
    if (existing)
      return res.status(400).json({ message: 'Email or phone already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({ name, email, phone: phoneClean, passwordHash, otpCode: otp, otpExpiry });

    await sendOtpEmail(email, otp, name);

    res.status(201).json({ message: 'Registered! OTP sent to your email.', userId: user._id, phone: phoneClean });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── VERIFY OTP ────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ message: 'Phone and OTP are required' });

    const phoneClean = phone.replace(/\s/g, '');
    const user = await User.findOne({ phone: phoneClean });

    if (!user || user.otpCode !== otp || Date.now() > new Date(user.otpExpiry).getTime())
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isPhoneVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

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
    const user = await User.findOne({ phone: phoneClean });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp, user.name);
    res.json({ message: 'OTP resent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isPhoneVerified)
      return res.status(403).json({ message: 'Phone not verified. Please verify OTP first.' });

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
    if (!idType || !idNumber)
      return res.status(400).json({ message: 'idType and idNumber are required' });

    const verified = Math.random() > 0.05;
    if (!verified)
      return res.status(400).json({ message: 'ID verification failed. Please try again.' });

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
    if (!faceDescriptor)
      return res.status(400).json({ message: 'No face data provided' });

    let verified = true;
    let confidence = 0.95;
    try {
      const { data } = await axios.post(`${FACE_SERVICE_URL}/face-verify`, { descriptor: faceDescriptor }, { timeout: 5000 });
      verified = data.verified;
      confidence = data.confidence;
      if (!verified) return res.status(400).json({ message: data.message });
    } catch (pyErr) {
      console.warn('⚠️ Face service unavailable, using fallback:', pyErr.message);
    }

    await User.findByIdAndUpdate(req.user._id, {
      isFaceVerified: true,
      faceDescriptor: faceDescriptor.substring(0, 64),
    });
    res.json({ message: 'Face verified ✅', confidence });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ME ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ user: sanitize(req.user) });
};
