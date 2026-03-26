import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.logo}>🤝</div>
        <h1 style={styles.title}>SideKick</h1>
        <p style={styles.sub}>Find your companion for life's moments</p>
      </div>

      <form onSubmit={handle} style={styles.form}>
        {error && <div className="badge badge-danger" style={{padding:'10px 16px',borderRadius:10,marginBottom:16}}>{error}</div>}

        <div style={{marginBottom:16}}>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="you@email.com"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        </div>
        <div style={{marginBottom:24}}>
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
        </div>

        <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Sign In'}
        </button>

        <p style={{textAlign:'center', marginTop:20, color:'var(--text-muted)', fontSize:14}}>
          New here? <Link to="/register" style={{color:'var(--primary)', fontWeight:600}}>Create account</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', maxWidth: 400, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  hero: { textAlign: 'center', marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg, #6c63ff, #ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { color: 'var(--text-muted)', marginTop: 8, fontSize: 16 },
  form: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 },
};
