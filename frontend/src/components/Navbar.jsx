import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { getImageUrl } from '../utils/api';
import {
  GraduationCap,
  Sun,
  Moon,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="glass-panel"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 800,
          fontSize: '1.25rem',
          letterSpacing: '-0.02em',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.3)',
          }}
        >
          <GraduationCap size={24} />
        </div>
        <span>
          Campus<span style={{ color: 'var(--primary)' }}>Hub</span>
        </span>
      </Link>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="btn-ghost"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDark ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} />}
        </button>

        {user && (
          <>
            {/* Chat Icon with Badge */}
            <Link
              to="/chat"
              aria-label="Real-time Chat"
              className="btn-ghost"
              style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'var(--accent-rose)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Profile Pill / Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {user.avatar_url ? (
                  <img
                    src={getImageUrl(user.avatar_url)}
                    alt={user.name}
                    className="avatar avatar-sm"
                  />
                ) : (
                  <div className="avatar avatar-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {dropdownOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '220px',
                    borderRadius: 'var(--radius-lg)',
                    padding: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {user.college || user.email}
                    </div>
                  </div>

                  <Link
                    to={`/profile/${user.id}`}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      color: 'var(--accent-rose)',
                      transition: 'background var(--transition-fast)',
                      marginTop: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!user && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Join CampusHub
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
