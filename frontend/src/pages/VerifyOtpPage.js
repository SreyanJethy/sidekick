import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function VerifyOtpPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const phone = state?.phone || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const submit = async () => {
    const code = otp.join('');
    if (code.length !== 6) return setError('Enter 6-digit OTP');
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp: code });
      login(data.accessToken, data.user);
      navigate('/verify-id');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const resend = async () => {
    await api.post('/auth/resend-otp', { phone });
    setError(''); setOtp(['', '', '', '', '', '']);
    alert('OTP resent!');
  };

  return (
    <div style={{ minHeight: '100vh', maxWidth: 400, margin: '0 auto', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>📱</div>
      <h2 style={{ fontSize: 26, fontWeight: 800 }}>Verify Phone</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
        Enter the 6-digit code sent to<br />
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{phone}</span>
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
        {otp.map((d, i) => (
          <input key={i} ref={el => refs.current[i] = el}
            value={d} onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            maxLength={1} inputMode="numeric"
            style={{
              width: 50, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700,
              background: 'var(--bg-card)', border: `2px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 12, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font)',
            }} />
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger)', marginTop: 16, fontSize: 14 }}>{error}</p>}

      <button className="btn btn-primary" style={{ marginTop: 32, minWidth: 200 }} onClick={submit} disabled={loading}>
        {loading ? <span className="spinner" /> : 'Verify OTP'}
      </button>

      <button onClick={resend} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600 }}>
        Resend OTP
      </button>

      <div style={{ marginTop: 32, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
        💡 In dev mode, check server console for OTP
      </div>
    </div>
  );
}
