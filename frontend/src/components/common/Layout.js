import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Home' },
  { to: '/match',     icon: '✨', label: 'Match' },
  { to: '/events',    icon: '🎉', label: 'Events' },
  { to: '/chats',     icon: '💬', label: 'Chats' },
  { to: '/profile',   icon: '👤', label: 'Profile' },
];

export default function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Top bar */}
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <span style={{ fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg, #6c63ff, #ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          SideKick
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.isIdVerified && <span className="badge badge-verified">✓ ID</span>}
          {user?.isFaceVerified && <span className="badge badge-verified">✓ Face</span>}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {children}
      </main>

      {/* Bottom nav */}
      <nav style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', bottom: 0 }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '12px 0', textDecoration: 'none', fontSize: 11, fontWeight: 600, gap: 4,
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            borderTop: isActive ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s',
          })}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
