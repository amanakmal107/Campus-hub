import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getImageUrl } from '../utils/api';
import { Modal } from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Users,
  Search,
  Plus,
  Lock,
  Globe,
  UserCheck,
  UserPlus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const Communities = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Create Community Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [commForm, setCommForm] = useState({
    name: '',
    description: '',
    category: 'subject',
    is_private: false,
  });

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communities', {
        search: search || undefined,
        category: category || undefined,
      });
      setCommunities(res.communities || []);
    } catch (err) {
      showToast(err.message || 'Failed to load communities', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCommunities();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleJoinLeave = async (comm, e) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please log in to join communities', 'info');
      return;
    }

    try {
      if (comm.is_member) {
        await api.delete(`/communities/${comm.id}/leave`);
        showToast(`Left ${comm.name}`, 'info');
      } else {
        await api.post(`/communities/${comm.id}/join`, {});
        showToast(`Welcome to ${comm.name}!`, 'success');
      }
      fetchCommunities();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!commForm.name.trim()) {
      showToast('Community name is required', 'warning');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/communities', commForm);
      setIsCreateOpen(false);
      showToast('Community created successfully!', 'success');
      navigate(`/communities/${res.community.id}`);
    } catch (err) {
      showToast(err.message || 'Failed to create community', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="var(--primary)" size={28} />
            Campus Communities & Clubs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Join study groups, tech clubs, and interest societies across your campus.
          </p>
        </div>

        {user && (
          <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Create Community
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities by name or topic..."
            style={{ width: '100%', paddingLeft: '38px' }}
          />
          <Search
            size={18}
            color="var(--text-light)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ minWidth: '160px' }}
        >
          <option value="">All Categories</option>
          <option value="subject">Subject / Academic</option>
          <option value="course">Department / Course</option>
          <option value="club">Club / Society</option>
          <option value="interest">Interest / Hobby</option>
        </select>
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : communities.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No communities found"
          description="Create a new community for your class, club, or favorite hobby!"
          actionText={user ? 'Create a Community' : null}
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {communities.map((comm) => (
            <div
              key={comm.id}
              onClick={() => navigate(`/communities/${comm.id}`)}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge badge-primary">{comm.category || 'general'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {comm.is_private ? <Lock size={13} /> : <Globe size={13} />}
                    {comm.is_private ? 'Private' : 'Public'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>{comm.name}</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {comm.description || 'Welcome to this campus community! Share notes, start discussions, and prep for exams together.'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} />
                  <span>{comm.member_count || 1} members</span>
                </div>

                <button
                  onClick={(e) => handleJoinLeave(comm, e)}
                  className={`btn btn-sm ${comm.is_member ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {comm.is_member ? (
                    <>
                      <UserCheck size={14} /> Joined
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Join
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create a Campus Community">
        <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Community Name *
            </label>
            <input
              type="text"
              required
              value={commForm.name}
              onChange={(e) => setCommForm({ ...commForm, name: e.target.value })}
              placeholder="e.g. AI & Machine Learning Society"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Category
            </label>
            <select
              value={commForm.category}
              onChange={(e) => setCommForm({ ...commForm, category: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="subject">Subject / Study Group</option>
              <option value="course">Department / Course Cohort</option>
              <option value="club">Student Club / Society</option>
              <option value="interest">Interest / Project Team</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Description & Purpose
            </label>
            <textarea
              rows={3}
              value={commForm.description}
              onChange={(e) => setCommForm({ ...commForm, description: e.target.value })}
              placeholder="What is this community about? Who should join?"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={commForm.is_private}
              onChange={(e) => setCommForm({ ...commForm, is_private: e.target.checked })}
              style={{ accentColor: 'var(--primary)' }}
            />
            <div>
              <strong>Make this community private</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Only members will be able to see the feed and group chat.
              </div>
            </div>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
