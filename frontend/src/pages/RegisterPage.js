import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/verify-otp', { state: { phone: form.phone } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Arjun Sharma' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@email.com' },
    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
  ];

  return (
    <div style={{ minHeight: '100vh', maxWidth: 420, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 48 }}>🤝</span>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>Join SideKick</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Create your verified profile</p>
      </div>

      <form onSubmit={handle} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div className="badge badge-danger" style={{padding:'10px 16px',borderRadius:10}}>{error}</div>}

        {fields.map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input className="input" type={type} placeholder={placeholder}
              value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} required />
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account →'}
          </button>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          📱 An OTP will be sent to your phone for verification
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </form>
    </div>
  );
}
