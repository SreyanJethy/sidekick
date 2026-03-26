import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const INTERESTS = ['🎬 Movies','🏏 Cricket','⚽ Football','🍕 Food','🎵 Music','📚 Books','🎮 Gaming','🧗 Adventure','☕ Coffee','🏖️ Travel','💃 Dancing','🖼️ Art'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SLOTS = ['Morning','Afternoon','Evening','Night'];
const VIBES = ['🌟 The Adventurer','🍜 The Foodie','📋 The Planner','🎭 The Socialite','🧘 The Chill One','🚀 The Go-Getter'];

export default function SetupProfilePage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    age: '', gender: '', bio: '', city: '',
    interests: [], vibeTag: '',
    availability: []
  });
  const [loading, setLoading] = useState(false);

  const toggleInterest = (i) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i]
    }));
  };

  const toggleSlot = (day, slot) => {
    setForm(f => {
      const avail = [...f.availability];
      const dayEntry = avail.find(d => d.day === day);
      if (dayEntry) {
        dayEntry.slots = dayEntry.slots.includes(slot)
          ? dayEntry.slots.filter(s => s !== slot)
          : [...dayEntry.slots, slot];
        if (!dayEntry.slots.length) return { ...f, availability: avail.filter(d => d.day !== day) };
        return { ...f, availability: avail };
      }
      return { ...f, availability: [...avail, { day, slots: [slot] }] };
    });
  };

  const isSlotActive = (day, slot) => form.availability.find(d => d.day === day)?.slots.includes(slot);

  const save = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', {
        ...form,
        location: { city: form.city }
      });
      updateUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 24px', minHeight: '100vh' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
        ))}
      </div>

      {step === 1 && (
        <div className="animate-in">
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>About You</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Help people know who you are</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" placeholder="22" min="18" max="60"
                value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="Bhubaneswar, Mumbai, Bangalore..."
                value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
            </div>
            <div>
              <label className="label">Bio (optional)</label>
              <textarea className="input" placeholder="A little about yourself..." rows={3}
                value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                style={{ resize: 'none' }} />
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in">
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Your Vibe & Interests</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>Pick what you're into</p>

          <label className="label" style={{ marginBottom: 12 }}>Your Vibe</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {VIBES.map(v => (
              <span key={v} className={`tag ${form.vibeTag === v ? 'active' : ''}`}
                onClick={() => setForm({...form, vibeTag: v})}>{v}</span>
            ))}
          </div>

          <label className="label" style={{ marginBottom: 12 }}>Interests (pick 3+)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
            {INTERESTS.map(i => (
              <span key={i} className={`tag ${form.interests.includes(i) ? 'active' : ''}`}
                onClick={() => toggleInterest(i)}>{i}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}
              disabled={form.interests.length < 1} style={{ flex: 2 }}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in">
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Availability</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>When are you free to hang out?</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {DAYS.map(day => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{day}</span>
                <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                  {SLOTS.map(slot => (
                    <span key={slot} className={`tag ${isSlotActive(day, slot) ? 'active' : ''}`}
                      onClick={() => toggleSlot(day, slot)} style={{ fontSize: 12, padding: '3px 10px' }}>{slot}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</button>
            <button className="btn btn-primary" onClick={save} disabled={loading} style={{ flex: 2 }}>
              {loading ? <span className="spinner" /> : '🎉 Start Matching!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
