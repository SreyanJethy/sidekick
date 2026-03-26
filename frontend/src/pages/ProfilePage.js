import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const INTERESTS = ['🎬 Movies','🏏 Cricket','⚽ Football','🍕 Food','🎵 Music','📚 Books','🎮 Gaming','🧗 Adventure','☕ Coffee','🏖️ Travel','💃 Dancing','🖼️ Art'];

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bio: user?.bio || '',
    city: user?.location?.city || '',
    interests: user?.interests || [],
    vibeTag: user?.vibeTag || '',
  });
  const [saving, setSaving] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const toggleInterest = (i) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i]
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        bio: form.bio,
        location: { city: form.city },
        interests: form.interests,
        vibeTag: form.vibeTag,
      });
      updateUser(data.user);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const verifications = [
    { icon: '📱', label: 'Phone', done: user?.isPhoneVerified },
    { icon: '🪪', label: 'Gov ID', done: user?.isIdVerified },
    { icon: '🤳', label: 'Face Scan', done: user?.isFaceVerified },
  ];

  return (
    <Layout>
      {/* Profile header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
        <div className="avatar lg" style={{ width: 90, height: 90, fontSize: 36, borderRadius: 24, border: '3px solid var(--primary)' }}>
          {user?.name?.[0]}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 14 }}>{user?.name}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          {user?.vibeTag || 'No vibe set'} · {user?.location?.city || 'No city'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {verifications.map(({ icon, label, done }) => (
            <span key={label} className={`badge ${done ? 'badge-verified' : 'badge-pending'}`}>
              {icon} {done ? '✓' : '○'} {label}
            </span>
          ))}
        </div>
      </div>

      {/* Safety score */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(67,233,123,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🛡️</div>
        <div>
          <p style={{ fontWeight: 700 }}>Safety Score</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{user?.safetyScore ?? 100}/100</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ width: 60, height: 60, position: 'relative' }}>
            <svg viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--accent)" strokeWidth="6"
                strokeDasharray={`${(user?.safetyScore ?? 100) * 1.634} 163.4`}
                strokeLinecap="round" transform="rotate(-90 30 30)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Edit / View */}
      {!editing ? (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontWeight: 700 }}>About</p>
              <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font)' }}>Edit</button>
            </div>
            <p style={{ color: user?.bio ? 'var(--text)' : 'var(--text-muted)', fontSize: 14 }}>{user?.bio || 'No bio yet. Tap Edit to add one.'}</p>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>Interests</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {user?.interests?.length
                ? user.interests.map(i => <span key={i} className="tag active">{i}</span>)
                : <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No interests added</p>}
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginBottom: 16 }}>Edit Profile</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Bio</label>
              <textarea className="input" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell others about yourself..." style={{ resize: 'none' }} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Your city" />
            </div>
            <div>
              <label className="label">Interests</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {INTERESTS.map(i => (
                  <span key={i} className={`tag ${form.interests.includes(i) ? 'active' : ''}`} onClick={() => toggleInterest(i)}>{i}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!user?.isIdVerified && (
          <button className="btn btn-secondary btn-full" onClick={() => navigate('/verify-id')}>
            🪪 Complete Verification
          </button>
        )}
        <button className="btn btn-secondary btn-full" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          Sign Out
        </button>
      </div>
    </Layout>
  );
}
