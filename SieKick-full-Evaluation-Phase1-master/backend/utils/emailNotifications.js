const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const base = (content) => `
  <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#0F0B21;color:#F1F0F7;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#7C3AED,#2DD4BF);padding:24px;text-align:center">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:white">🤝 SideKick</h1>
    </div>
    <div style="padding:28px">
      ${content}
    </div>
    <div style="padding:16px;text-align:center;color:#6E6893;font-size:12px;border-top:1px solid #2D2653">
      SideKick — Find Your Companion
    </div>
  </div>
`;

const btn = (text, url) =>
  `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#7C3AED,#2DD4BF);color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">${text}</a>`;

const APP_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ── MATCH REQUEST RECEIVED ────────────────────────────────
exports.sendMatchRequestEmail = async (receiverEmail, receiverName, requesterName) => {
  try {
    await transporter.sendMail({
      from: `"SideKick" <${process.env.GMAIL_USER}>`,
      to: receiverEmail,
      subject: `${requesterName} wants to be your SideKick! 🤝`,
      html: base(`
        <h2 style="color:#F1F0F7;margin-top:0">New Companion Request!</h2>
        <p style="color:#A8A3C7">Hey <b style="color:#F1F0F7">${receiverName}</b>,</p>
        <p style="color:#A8A3C7"><b style="color:#2DD4BF">${requesterName}</b> has sent you a companion request on SideKick.</p>
        <p style="color:#A8A3C7">Check their profile and decide if you'd like to connect!</p>
        ${btn('View Request', `${APP_URL}/dashboard`)}
      `),
    });
  } catch (err) {
    console.warn('⚠️ Match request email failed:', err.message);
  }
};

// ── MATCH REQUEST ACCEPTED ────────────────────────────────
exports.sendMatchAcceptedEmail = async (requesterEmail, requesterName, receiverName) => {
  try {
    await transporter.sendMail({
      from: `"SideKick" <${process.env.GMAIL_USER}>`,
      to: requesterEmail,
      subject: `${receiverName} accepted your request! 🎉`,
      html: base(`
        <h2 style="color:#F1F0F7;margin-top:0">You've got a new SideKick!</h2>
        <p style="color:#A8A3C7">Hey <b style="color:#F1F0F7">${requesterName}</b>,</p>
        <p style="color:#A8A3C7">Great news! <b style="color:#2DD4BF">${receiverName}</b> has accepted your companion request.</p>
        <p style="color:#A8A3C7">You can now chat with each other. Start the conversation!</p>
        ${btn('Start Chatting', `${APP_URL}/chats`)}
      `),
    });
  } catch (err) {
    console.warn('⚠️ Match accepted email failed:', err.message);
  }
};

// ── EVENT JOINED (to creator) ─────────────────────────────
exports.sendEventJoinedEmail = async (creatorEmail, creatorName, joinerName, eventTitle) => {
  try {
    await transporter.sendMail({
      from: `"SideKick" <${process.env.GMAIL_USER}>`,
      to: creatorEmail,
      subject: `${joinerName} joined your event "${eventTitle}"! 🎊`,
      html: base(`
        <h2 style="color:#F1F0F7;margin-top:0">Someone joined your event!</h2>
        <p style="color:#A8A3C7">Hey <b style="color:#F1F0F7">${creatorName}</b>,</p>
        <p style="color:#A8A3C7"><b style="color:#2DD4BF">${joinerName}</b> has joined your event <b style="color:#F1F0F7">"${eventTitle}"</b>.</p>
        <p style="color:#A8A3C7">Check your event to see all participants!</p>
        ${btn('View My Events', `${APP_URL}/events`)}
      `),
    });
  } catch (err) {
    console.warn('⚠️ Event joined (creator) email failed:', err.message);
  }
};

// ── EVENT JOIN CONFIRMATION (to joiner) ──────────────────
exports.sendEventJoinConfirmEmail = async (joinerEmail, joinerName, eventTitle, eventDate, eventCity) => {
  try {
    await transporter.sendMail({
      from: `"SideKick" <${process.env.GMAIL_USER}>`,
      to: joinerEmail,
      subject: `You joined "${eventTitle}"! ✅`,
      html: base(`
        <h2 style="color:#F1F0F7;margin-top:0">Event Confirmed!</h2>
        <p style="color:#A8A3C7">Hey <b style="color:#F1F0F7">${joinerName}</b>,</p>
        <p style="color:#A8A3C7">You've successfully joined <b style="color:#2DD4BF">"${eventTitle}"</b>.</p>
        <div style="background:#1A1535;border:1px solid #2D2653;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:4px 0;color:#A8A3C7">📅 <b style="color:#F1F0F7">Date:</b> ${new Date(eventDate).toDateString()}</p>
          ${eventCity ? `<p style="margin:4px 0;color:#A8A3C7">📍 <b style="color:#F1F0F7">City:</b> ${eventCity}</p>` : ''}
        </div>
        ${btn('View My Events', `${APP_URL}/events`)}
      `),
    });
  } catch (err) {
    console.warn('⚠️ Event join confirm email failed:', err.message);
  }
};
