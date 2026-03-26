import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import api from '../utils/api';

export default function MatchPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/matches/suggestions')
      .then(r => setSuggestions(r.data.matches || []))
      .catch(err => {
        const msg = err.response?.data?.message;
        setError(msg || 'Could not load matches.');
      })
      .finally(() => setLoading(false));
  }, []);

  const sendRequest = async (userId) => {
    try {
      await api.post('/matches/request', { receiverId: userId });
      setSent(s => new Set([...s, userId]));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const ScoreBar = ({ label, value, color }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
        <span>{label}</span><span>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );

  return (
    <Layout>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>✨ Your Matches</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Sorted by compatibility</p>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ textAlign: 'center', padding: 40, borderLeft: '3px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
          {error.includes('profile') && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/setup-profile')}>
              Complete Profile →
            </button>
          )}
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 56 }}>🔍</div>
          <p style={{ fontWeight: 700, marginTop: 12 }}>No matches yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Make sure your city and interests are set — or run the seed script to add test users
          </p>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/profile')}>
            Update Profile
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {suggestions.map(({ user, totalScore, interestScore, availabilityScore, distanceScore }) => (
          <div key={user._id} className="card animate-in">
            <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div className="avatar lg" style={{ borderRadius: 16, width: 64, height: 64, fontSize: 26 }}>
                {user.profilePhoto
                  ? <img src={user.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
                  : user.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</span>
                  {user.isIdVerified && <span className="badge badge-verified">✓ ID</span>}
                  {user.isFaceVerified && <span className="badge badge-verified">✓ Face</span>}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  {user.age && `${user.age} · `}{user.vibeTag}
                </p>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', background: 'rgba(108,99,255,0.15)', borderRadius: 20, padding: '4px 12px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                    {Math.round(totalScore)}% Match
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {user.interests?.slice(0, 5).map(i => (
                <span key={i} className="tag" style={{ fontSize: 12 }}>{i}</span>
              ))}
            </div>

            <ScoreBar label="Common Interests" value={interestScore || 0} color="var(--primary)" />
            <ScoreBar label="Availability Match" value={availabilityScore || 0} color="var(--accent)" />
            <ScoreBar label="Nearby" value={distanceScore || 0} color="var(--secondary)" />

            <div style={{ marginTop: 16 }}>
              {sent.has(user._id) ? (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(67,233,123,0.1)', borderRadius: 10, color: 'var(--accent)', fontWeight: 600 }}>
                  ✓ Request Sent!
                </div>
              ) : (
                <button className="btn btn-primary btn-full" onClick={() => sendRequest(user._id)}>
                  👋 Send Companion Request
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
