import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getImageUrl } from '../utils/api';
import { Modal } from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  User,
  School,
  BookOpen,
  Calendar,
  Camera,
  Edit3,
  MessageSquare,
  FileText,
  BookMarked,
  Lightbulb,
  Heart,
  Download,
} from 'lucide-react';

export const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, updateProfile, updateAvatar } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  const [userPosts, setUserPosts] = useState([]);
  const [userNotes, setUserNotes] = useState([]);
  const [userBooks, setUserBooks] = useState([]);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    college: '',
    course: '',
    year: '1',
    bio: '',
  });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentUser && currentUser.id === id;

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [userRes, postsRes, notesRes, booksRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/users/${id}/posts`),
          api.get(`/users/${id}/notes`),
          api.get(`/users/${id}/books`),
        ]);

        setProfileUser(userRes.user);
        setUserPosts(postsRes.posts || []);
        setUserNotes(notesRes.notes || []);
        setUserBooks(booksRes.books || []);

        setEditForm({
          name: userRes.user.name || '',
          college: userRes.user.college || '',
          course: userRes.user.course || '',
          year: userRes.user.year ? String(userRes.user.year) : '1',
          bio: userRes.user.bio || '',
        });
      } catch (err) {
        showToast(err.message || 'Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, showToast]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await updateAvatar(file);
    if (res.success) {
      setProfileUser((prev) => ({ ...prev, avatar_url: res.avatar_url }));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile(editForm);
    setSaving(false);
    if (res.success) {
      setProfileUser((prev) => ({ ...prev, ...res.user }));
      setIsEditOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ maxWidth: '800px' }}>
        <CardSkeleton />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="page-wrapper" style={{ maxWidth: '600px' }}>
        <EmptyState
          icon={User}
          title="Student Not Found"
          description="The profile you are looking for does not exist or has been removed."
          actionText="Back to Feed"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '900px' }}>
      {/* Profile Header Card */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '28px',
        }}
      >
        {/* Top colored accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {/* Avatar with Upload badge if own profile */}
          <div style={{ position: 'relative' }}>
            {profileUser.avatar_url ? (
              <img
                src={getImageUrl(profileUser.avatar_url)}
                alt={profileUser.name}
                className="avatar avatar-xl"
              />
            ) : (
              <div className="avatar avatar-xl">
                {profileUser.name?.charAt(0).toUpperCase()}
              </div>
            )}

            {isOwnProfile && (
              <label
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '0px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                  border: '2px solid var(--bg-surface)',
                }}
                title="Change avatar photo"
              >
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* User Details */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{profileUser.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span>{profileUser.email}</span>
                  {profileUser.is_online && (
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>
                      Online
                    </span>
                  )}
                </div>
              </div>

              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <Edit3 size={15} /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/chat?user=${profileUser.id}`)}
                  className="btn btn-primary btn-sm"
                >
                  <MessageSquare size={15} /> Message
                </button>
              )}
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', margin: '12px 0 16px 0', lineHeight: 1.6 }}>
                {profileUser.bio}
              </p>
            )}

            {/* Tags / Metadata Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
              {profileUser.college && (
                <span className="badge badge-primary">
                  <School size={13} /> {profileUser.college}
                </span>
              )}
              {profileUser.course && (
                <span className="badge badge-blue">
                  <BookOpen size={13} /> {profileUser.course}
                </span>
              )}
              {profileUser.year && (
                <span className="badge badge-amber">
                  <Calendar size={13} /> Year {profileUser.year}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '24px',
          gap: '24px',
        }}
      >
        <button
          onClick={() => setActiveTab('posts')}
          style={{
            padding: '12px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'posts' ? 700 : 500,
            color: activeTab === 'posts' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'posts' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Lightbulb size={18} /> Thoughts & Ideas ({userPosts.length})
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '12px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'notes' ? 700 : 500,
            color: activeTab === 'notes' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={18} /> Uploaded Notes ({userNotes.length})
        </button>

        <button
          onClick={() => setActiveTab('books')}
          style={{
            padding: '12px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'books' ? 700 : 500,
            color: activeTab === 'books' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'books' ? '2px solid var(--primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BookMarked size={18} /> Textbooks ({userBooks.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {userPosts.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No thoughts posted yet"
              description="Share project ideas, study doubts, or startup concepts with campus."
              actionText={isOwnProfile ? 'Post to Feed' : null}
              onAction={() => navigate('/')}
            />
          ) : (
            userPosts.map((post) => (
              <div
                key={post.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '12px' }}>{post.content}</p>
                {post.image_url && (
                  <img
                    src={getImageUrl(post.image_url)}
                    alt="Post attachment"
                    style={{
                      width: '100%',
                      maxHeight: '320px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '12px',
                    }}
                  />
                )}
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span>❤️ {post.like_count} likes</span>
                  <span>💬 {post.comment_count} comments</span>
                  <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {userNotes.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon={FileText}
                title="No study notes uploaded"
                description="Upload summaries, reference sheets, or lecture notes to assist peers."
                actionText={isOwnProfile ? 'Upload Note' : null}
                onAction={() => navigate('/notes')}
              />
            </div>
          ) : (
            userNotes.map((note) => (
              <div
                key={note.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-primary">{note.file_type.toUpperCase()}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sem {note.semester || '-'}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{note.title}</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    {note.subject}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={14} /> {note.like_count || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={14} /> {note.download_count || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'books' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {userBooks.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon={BookMarked}
                title="No textbooks listed"
                description="List your old course books for sale, exchange, or donation."
                actionText={isOwnProfile ? 'Post a Book' : null}
                onAction={() => navigate('/books')}
              />
            </div>
          ) : (
            userBooks.map((book) => (
              <div
                key={book.id}
                className="glass-panel"
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className={`badge ${book.listing_type === 'donate' ? 'badge-green' : book.listing_type === 'exchange' ? 'badge-blue' : 'badge-amber'}`}>
                    {book.listing_type}
                  </span>
                  <span className={`badge ${book.status === 'available' ? 'badge-green' : 'badge-amber'}`}>
                    {book.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{book.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  By {book.author || 'Unknown'}
                </p>
                {book.price && book.price > 0 && (
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>
                    ${book.price}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Profile">
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                College / University
              </label>
              <input
                type="text"
                value={editForm.college}
                onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Course / Major
              </label>
              <input
                type="text"
                value={editForm.course}
                onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Current Academic Year
            </label>
            <select
              value={editForm.year}
              onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year / Grad</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Student Bio
            </label>
            <textarea
              rows={3}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              placeholder="Tell others what you're working on, learning, or interested in..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
