import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import api from '../utils/api';

export default function ChatListPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/chats/rooms')
      .then(r => setRooms(r.data.rooms || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>💬 Messages</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Your accepted companion chats
      </p>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 56 }}>💬</div>
          <p style={{ fontWeight: 700, marginTop: 12 }}>No chats yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Accept match requests to start chatting
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => navigate('/match')}
          >
            Find Matches
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rooms.map(room => (
          <div
            key={room.roomId}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
            onClick={() => navigate(`/chat/${room.roomId}`)}
          >
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 20, flexShrink: 0 }}>
              {room.other?.profilePhoto
                ? <img src={room.other.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : room.other?.name?.[0] || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 15 }}>{room.other?.name || 'SideKick'}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {room.lastMessage?.content || 'Start the conversation!'}
              </p>
            </div>
            {room.lastMessage && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {new Date(room.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
