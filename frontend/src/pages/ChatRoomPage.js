import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import api from '../utils/api';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const bottomRef = useRef();
  const typingTimer = useRef();

  useEffect(() => {
    // Load history
    api.get(`/chats/${roomId}`).then(r => {
      setMessages(r.data.messages || []);
      const other = r.data.messages?.[0]?.sender;
      if (other && other._id !== user._id) setOtherUser(other);
    }).catch(() => navigate('/chats'));

    // Socket
    const socket = getSocket();
    socket.emit('join_room', roomId);

    socket.on('new_message', (msg) => {
      if (msg.roomId === roomId) setMessages(prev => [...prev, msg]);
    });

    socket.on('user_typing', ({ isTyping }) => {
      setTyping(isTyping);
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const content = input.trim();
    if (!content) return;
    const socket = getSocket();
    socket.emit('send_message', { roomId, content });
    setInput('');
    clearTimeout(typingTimer.current);
    socket.emit('typing', { roomId, isTyping: false });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = getSocket();
    socket.emit('typing', { roomId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing', { roomId, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <button onClick={() => navigate('/chats')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: 4 }}>←</button>
        <div className="avatar" style={{ width: 38, height: 38, fontSize: 16 }}>{otherUser?.name?.[0] || '?'}</div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{otherUser?.name || 'SideKick'}</p>
          {typing && <p style={{ fontSize: 12, color: 'var(--accent)' }}>typing...</p>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {messages.map((msg) => {
          const isMe = msg.sender?._id === user._id || msg.sender === user._id;
          return (
            <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? 'var(--primary)' : 'var(--bg-elevated)',
                color: 'var(--text)', fontSize: 14, lineHeight: 1.5,
              }}>
                {msg.content}
                <div style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--bg-card)' }}>
        <input className="input" placeholder="Type a message..." value={input}
          onChange={handleInputChange} onKeyDown={handleKeyDown}
          style={{ flex: 1, borderRadius: 24 }} />
        <button className="btn btn-primary" onClick={send} style={{ borderRadius: 24, padding: '12px 18px' }}
          disabled={!input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
}
