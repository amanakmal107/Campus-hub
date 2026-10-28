import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Compass, BookMarked, FileText, MessageSquare, User } from 'lucide-react';

export const BottomNav = () => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  return (
    <nav
      className="mobile-bottom-nav glass-panel"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <NavLink
        to="/"
        end
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: isActive ? 700 : 500,
        })}
      >
        <Compass size={20} />
        <span>Feed</span>
      </NavLink>

      <NavLink
        to="/books"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: isActive ? 700 : 500,
        })}
      >
        <BookMarked size={20} />
        <span>Books</span>
      </NavLink>

      <NavLink
        to="/notes"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: isActive ? 700 : 500,
        })}
      >
        <FileText size={20} />
        <span>Notes</span>
      </NavLink>

      <NavLink
        to="/chat"
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          position: 'relative',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: isActive ? 700 : 500,
        })}
      >
        <MessageSquare size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-6px',
              backgroundColor: 'var(--accent-rose)',
              color: 'white',
              fontSize: '0.62rem',
              fontWeight: 800,
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount}
          </span>
        )}
        <span>Chat</span>
      </NavLink>

      <NavLink
        to={user ? `/profile/${user.id}` : '/login'}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: isActive ? 700 : 500,
        })}
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
