import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getImageUrl } from '../utils/api';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Users,
  MessageSquare,
  Lock,
  Globe,
  UserCheck,
  UserPlus,
  ArrowLeft,
  Send,
  Shield,
  Trash2,
} from 'lucide-react';

export const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'members'

  // Post composer inside community
  const [postContent, setPostContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const [commRes, postsRes, membersRes] = await Promise.all([
        api.get(`/communities/${id}`),
        api.get(`/communities/${id}/posts`),
        api.get(`/communities/${id}/members`),
      ]);
      setCommunity(commRes.community);
      setPosts(postsRes.posts || []);
      setMembers(membersRes.members || []);
    } catch (err) {
      showToast(err.message || 'Failed to load community', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [id]);

  const handleJoinLeave = async () => {
    if (!user) {
      showToast('Please log in to join this community', 'info');
      return;
    }

    try {
      if (community.is_member) {
        await api.delete(`/communities/${community.id}/leave`);
        showToast(`Left ${community.name}`, 'info');
      } else {
        await api.post(`/communities/${community.id}/join`, {});
        showToast(`Joined ${community.name}!`, 'success');
      }
      fetchCommunityData();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setSubmittingPost(true);
    try {
      const res = await api.post('/posts', {
        content: postContent.trim(),
        community_id: community.id,
      });
      setPosts((prev) => [res.post, ...prev]);
      setPostContent('');
      showToast('Posted to community feed!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to post', 'error');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from community?')) return;
    try {
      await api.delete(`/communities/${id}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast('Member removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ maxWidth: '840px' }}>
        <CardSkeleton />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="page-wrapper" style={{ maxWidth: '600px' }}>
        <EmptyState
          icon={Users}
          title="Community not found"
          description="This community may have been removed or you don't have permission to view it."
          actionText="Back to Communities"
          onAction={() => navigate('/communities')}
        />
      </div>
    );
  }

  const isAdmin = user && community.admin_id === user.id;

  return (
    <div className="page-wrapper" style={{ maxWidth: '840px' }}>
      {/* Back Link */}
      <button
        onClick={() => navigate('/communities')}
        className="btn-ghost"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} /> All Communities
      </button>

      {/* Community Banner Card */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span className="badge badge-primary">{community.category || 'general'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {community.is_private ? <Lock size={13} /> : <Globe size={13} />}
            {community.is_private ? 'Private Community' : 'Public Community'}
          </span>
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px' }}>{community.name}</h1>
        <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
          {community.description || 'Welcome to this campus community! Share notes, start discussions, and collaborate.'}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleJoinLeave}
            className={`btn ${community.is_member ? 'btn-secondary' : 'btn-primary'}`}
          >
            {community.is_member ? (
              <>
                <UserCheck size={16} /> Joined Community
              </>
            ) : (
              <>
                <UserPlus size={16} /> Join Community
              </>
            )}
          </button>

          {community.is_member && (
            <Link
              to={`/chat?community=${community.id}`}
              className="btn btn-secondary"
            >
              <MessageSquare size={16} /> Group Chat Room
            </Link>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.86rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} />
            <span>{members.length} members</span>
          </div>
        </div>
      </div>

      {/* Tabs: Community Feed vs Members List */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('feed')}
          style={{
            padding: '10px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'feed' ? 700 : 500,
            color: activeTab === 'feed' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'feed' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          Community Feed ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '10px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'members' ? 700 : 500,
            color: activeTab === 'members' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'members' ? '2px solid var(--primary)' : '2px solid transparent',
          }}
        >
          Members ({members.length})
        </button>
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Post Composer if member */}
          {community.is_member && (
            <form
              onSubmit={handleCreatePost}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <textarea
                rows={2}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={`Share something with ${community.name}...`}
                style={{ width: '100%', marginBottom: '10px', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={submittingPost} className="btn btn-primary btn-sm">
                  <Send size={14} /> {submittingPost ? 'Posting...' : 'Post to Community'}
                </button>
              </div>
            </form>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No posts in this community yet"
              description="Be the first to share an idea, resource, or question in this group."
            />
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  {post.author_avatar ? (
                    <img src={getImageUrl(post.author_avatar)} alt={post.author_name} className="avatar avatar-sm" />
                  ) : (
                    <div className="avatar avatar-sm">{post.author_name?.charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{post.author_name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{post.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {members.map((member) => (
            <div
              key={member.id}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Link
                to={`/profile/${member.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                {member.avatar_url ? (
                  <img src={getImageUrl(member.avatar_url)} alt={member.name} className="avatar avatar-sm" />
                ) : (
                  <div className="avatar avatar-sm">{member.name?.charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{member.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {member.college || member.course || 'Student'}
                  </div>
                </div>
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {member.role === 'admin' ? (
                  <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} /> Admin
                  </span>
                ) : (
                  <span className="badge" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                    Member
                  </span>
                )}

                {/* Admin can remove other members */}
                {isAdmin && member.id !== user.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="btn-ghost"
                    style={{ color: 'var(--accent-rose)', padding: '4px' }}
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
