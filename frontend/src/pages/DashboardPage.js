import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/common/Layout';
import api from '../utils/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState({ matches: 0, events: 0 });

  useEffect(() => {
    api.get('/matches/pending').then(r => setPending(r.data.pending || [])).catch(() => {});
    api.get('/matches/active').then(r => setStats(s => ({ ...s, matches: r.data.matches?.length || 0 }))).catch(() => {});
  }, []);

  const respond = async (matchId, action) => {
    await api.put('/matches/respond', { matchId, action });
    setPending(p => p.filter(m => m._id !== matchId));
    if (action === 'accept') setStats(s => ({ ...s, matches: s.matches + 1 }));
  };

  const verificationStatus = [
    { label: 'Phone', done: user?.isPhoneVerified },
    { label: 'Gov ID', done: user?.isIdVerified },
    { label: 'Face', done: user?.isFaceVerified },
  ];
  const allVerified = verificationStatus.every(v => v.done);

  return (
    <Layout>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Hey, {user?.name?.split(' ')[0]} 👋</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {user?.location?.city ? `📍 ${user.location.city}` : 'Set your city in profile'}
        </p>
      </div>

      {/* Verification banner */}
      {!allVerified && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--warning)', background: 'rgba(255,209,102,0.05)' }}>
          <p style={{ fontWeight: 700, marginBottom: 12, color: 'var(--warning)' }}>⚠️ Complete Verification</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {verificationStatus.map(({ label, done }) => (
              <span key={label} className={`badge ${done ? 'badge-verified' : 'badge-pending'}`}>
                {done ? '✓' : '○'} {label}
              </span>
            ))}
          </div>
          <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => navigate('/verify-id')}>
            Complete Now
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '✨', label: 'Active Matches', value: stats.matches, action: () => navigate('/match') },
          { icon: '🎉', label: 'Events Joined', value: stats.events, action: () => navigate('/events') },
        ].map(({ icon, label, value, action }) => (
          <div key={label} className="card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={action}>
            <div style={{ fontSize: 28 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>📩 Companion Requests ({pending.length})</h3>
          {pending.map(match => (
            <div key={match._id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="avatar">{match.requester.name?.[0]}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>{match.requester.name}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{match.requester.vibeTag}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => respond(match._id, 'reject')}>✗</button>
                <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => respond(match._id, 'accept')}>✓</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Quick Actions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: '✨', label: 'Find Companions', sub: 'See your matches', to: '/match', color: 'var(--primary)' },
          { icon: '🎉', label: 'Browse Events', sub: 'Discover activities nearby', to: '/events', color: 'var(--secondary)' },
          { icon: '💬', label: 'Messages', sub: 'Chat with your SideKicks', to: '/chats', color: 'var(--accent)' },
        ].map(({ icon, label, sub, to, color }) => (
          <div key={to} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => navigate(to)}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
            <div>
              <p style={{ fontWeight: 700 }}>{label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sub}</p>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
          </div>
        ))}
      </div>
    </Layout>
  );
}
