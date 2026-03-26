import React, { useEffect, useState } from 'react';
import Layout from '../components/common/Layout';
import api from '../utils/api';

const CATEGORIES = ['All', 'movie', 'sports', 'food', 'music', 'hangout', 'study'];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('browse');
  const [category, setCategory] = useState('All');
  const [joined, setJoined] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'hangout', date: '', timeSlot: 'evening', city: '', venue: '' });
  const [creating, setCreating] = useState(false);

  const fetchEvents = () => {
    const params = category !== 'All' ? `?category=${category}` : '';
    api.get(`/events${params}`).then(r => setEvents(r.data.events || [])).catch(() => {});
  };

  useEffect(() => {
    fetchEvents();
    api.get('/events/mine').then(r => setMyEvents(r.data.events || [])).catch(() => {});
    setLoading(false);
  }, [category]);

  const joinEvent = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/join`);
      setJoined(j => new Set([...j, eventId]));
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not join event');
    }
  };

  const createEvent = async () => {
    if (!form.title || !form.date) return alert('Title and date are required');
    setCreating(true);
    try {
      await api.post('/events', {
        ...form,
        location: { city: form.city, venue: form.venue },
      });
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'hangout', date: '', timeSlot: 'evening', city: '', venue: '' });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create event');
    } finally { setCreating(false); }
  };

  const EventCard = ({ event, showJoin = true }) => (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <span className="tag" style={{ fontSize: 11, marginBottom: 6, display: 'inline-block' }}>{event.category}</span>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{event.title}</p>
          {event.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{event.description}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        <span>📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span>🕐 {event.timeSlot}</span>
        {event.location?.city && <span>📍 {event.location.city}</span>}
        {event.location?.venue && <span>🏢 {event.location.venue}</span>}
        <span>👥 {event.participants?.length || 0}/{event.maxParticipants}</span>
      </div>
      {event.creator && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 13 }}>{event.creator.name?.[0]}</div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {event.creator.name}</span>
          {event.creator.isIdVerified && <span className="badge badge-verified" style={{ fontSize: 10 }}>✓</span>}
        </div>
      )}
      {showJoin && event.isOpen && (
        <button
          className={`btn ${joined.has(event._id) ? 'btn-secondary' : 'btn-primary'} btn-full`}
          style={{ marginTop: 12 }}
          onClick={() => !joined.has(event._id) && joinEvent(event._id)}
          disabled={joined.has(event._id)}
        >
          {joined.has(event._id) ? '✓ Joined!' : '+ Join Event'}
        </button>
      )}
      {!event.isOpen && (
        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Event is full</div>
      )}
    </div>
  );

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>🎉 Events</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Find things to do together</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 13 }} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ Create'}
        </button>
      </div>

      {showCreate && (
        <div className="card animate-in" style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 14 }}>Create Event</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="input" placeholder="Event title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="input" placeholder="Description (optional)" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {['movie','sports','food','music','hangout','study'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input" value={form.timeSlot} onChange={e => setForm({...form, timeSlot: e.target.value})}>
                {['morning','afternoon','evening','night'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} min={new Date().toISOString().split('T')[0]} />
            <input className="input" placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
            <input className="input" placeholder="Venue (optional)" value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} />
            <button className="btn btn-primary btn-full" onClick={createEvent} disabled={creating}>
              {creating ? <span className="spinner" /> : '🎉 Create Event'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {['browse', 'mine'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
            color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: tab === t ? 700 : 400, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14,
          }}>
            {t === 'browse' ? '🔍 Browse' : '📌 My Events'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {CATEGORIES.map(c => (
              <span key={c} className={`tag ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)} style={{ fontSize: 12, cursor: 'pointer' }}>{c}</span>
            ))}
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ width: 32, height: 32, margin: 'auto' }} /></div>
            : events.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48 }}>🎉</div>
                <p style={{ fontWeight: 700, marginTop: 12 }}>No events found</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Be the first to create one!</p>
              </div>
            ) : events.map(e => <EventCard key={e._id} event={e} />)
          }
        </>
      )}

      {tab === 'mine' && (
        <>
          {myEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-muted)' }}>No events yet. Join or create one!</p>
            </div>
          ) : myEvents.map(e => <EventCard key={e._id} event={e} showJoin={false} />)}
        </>
      )}
    </Layout>
  );
}
