import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  BookMarked,
  FileText,
  Users,
  MessageSquare,
  Newspaper,
  User,
  PlusCircle,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Campus Feed', path: '/', icon: Compass },
    { label: 'Textbook Exchange', path: '/books', icon: BookMarked },
    { label: 'Notes Sharing', path: '/notes', icon: FileText },
    { label: 'Communities', path: '/communities', icon: Users },
    { label: 'Messages & Chat', path: '/chat', icon: MessageSquare },
    { label: 'News & Grants', path: '/news', icon: Newspaper },
  ];

  if (user) {
    navItems.push({ label: 'My Profile', path: `/profile/${user.id}`, icon: User });
  }

  return (
    <aside
      style={{
        width: '260px',
        flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: '68px',
        height: 'calc(100vh - 68px)',
        padding: '24px 16px',
        transition: 'background-color var(--transition-normal)',
      }}
      className="desktop-sidebar"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-light)',
            padding: '0 12px 8px 12px',
          }}
        >
          Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.92rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                transition: 'all var(--transition-fast)',
              })}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {user && (
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
            🎓 Student Portal
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Share your study notes or textbook to help your peers!
          </div>
          <NavLink to="/notes" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
            <PlusCircle size={15} /> Upload Notes
          </NavLink>
        </div>
      )}
    </aside>
  );
};
