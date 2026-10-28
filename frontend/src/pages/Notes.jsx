import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getImageUrl } from '../utils/api';
import { Modal } from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  FileText,
  Search,
  Upload,
  Download,
  Heart,
  Bookmark,
  MessageSquare,
  Sparkles,
  Tag,
  Eye,
  Plus,
} from 'lucide-react';

export const Notes = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notes, setNotes] = useState([]);
  const [topNotes, setTopNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [sort, setSort] = useState('newest');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: '',
    semester: '1',
    description: '',
    tags: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Note Comments Modal
  const [activeNoteForComments, setActiveNoteForComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const [notesRes, topRes] = await Promise.all([
        api.get('/notes', {
          search: search || undefined,
          subject: subject || undefined,
          semester: semester || undefined,
          sort,
        }),
        api.get('/notes/top/week'),
      ]);
      setNotes(notesRes.notes || []);
      setTopNotes(topRes.notes || []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, subject, semester, sort]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a PDF or image file', 'warning');
      return;
    }
    if (!uploadForm.title.trim() || !uploadForm.subject.trim()) {
      showToast('Title and Subject are required', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title.trim());
      formData.append('subject', uploadForm.subject.trim());
      formData.append('semester', uploadForm.semester);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);

      const res = await api.post('/notes', formData);
      setNotes((prev) => [res.note, ...prev]);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadForm({ title: '', subject: '', semester: '1', description: '', tags: '' });
      showToast('Study notes uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to upload notes', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleLike = async (noteId) => {
    if (!user) {
      showToast('Please sign in to like notes', 'info');
      return;
    }

    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === noteId) {
          const isLiked = !n.is_liked;
          return {
            ...n,
            is_liked: isLiked,
            like_count: isLiked ? n.like_count + 1 : Math.max(0, n.like_count - 1),
          };
        }
        return n;
      })
    );

    try {
      await api.post(`/notes/${noteId}/like`, {});
    } catch {
      fetchNotes();
    }
  };

  const handleToggleBookmark = async (noteId) => {
    if (!user) {
      showToast('Please sign in to bookmark notes', 'info');
      return;
    }

    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, is_bookmarked: !n.is_bookmarked } : n))
    );

    try {
      const res = await api.post(`/notes/${noteId}/bookmark`, {});
      showToast(res.bookmarked ? 'Note saved to bookmarks' : 'Note removed from bookmarks', 'info');
    } catch {
      fetchNotes();
    }
  };

  const handleDownload = async (note) => {
    try {
      await api.post(`/notes/${note.id}/download`, {});
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, download_count: n.download_count + 1 } : n))
      );
    } catch (e) {
      // quiet
    }
    // Open file in new tab
    window.open(getImageUrl(note.file_url), '_blank');
  };

  const openComments = async (note) => {
    setActiveNoteForComments(note);
    try {
      const res = await api.get(`/notes/${note.id}/comments`);
      setComments(res.comments || []);
    } catch {
      setComments([]);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeNoteForComments) return;
    try {
      const res = await api.post(`/notes/${activeNoteForComments.id}/comments`, {
        content: commentText.trim(),
      });
      setComments((prev) => [...prev, res.comment]);
      setCommentText('');
    } catch (err) {
      showToast(err.message || 'Failed to post comment', 'error');
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
            <FileText color="var(--primary)" size={28} />
            Notes & Study Guides
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Download lecture notes, formula cheat sheets, and solved previous papers.
          </p>
        </div>

        {user && (
          <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
            <Upload size={18} /> Upload Notes
          </button>
        )}
      </div>

      {/* Top Notes This Week Spotlight */}
      {topNotes.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles color="var(--accent-orange)" size={20} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Top Notes This Week</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {topNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-primary">Trending 🔥</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{note.subject}</span>
                  </div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '6px' }}>{note.title}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>By {note.uploader_name}</span>
                  <button onClick={() => handleDownload(note)} className="btn btn-primary btn-sm">
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
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
            placeholder="Search notes by title, topic, or keyword..."
            style={{ width: '100%', paddingLeft: '38px' }}
          />
          <Search
            size={18}
            color="var(--text-light)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="">All Semesters</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
          <option value="3">Semester 3</option>
          <option value="4">Semester 4</option>
          <option value="5">Semester 5</option>
          <option value="6">Semester 6</option>
          <option value="7">Semester 7</option>
          <option value="8">Semester 8</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="newest">Newest First</option>
          <option value="popular">Most Liked</option>
          <option value="downloads">Most Downloaded</option>
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes found"
          description="Be the first to share notes for this subject and assist your campus peers."
          actionText={user ? 'Upload your notes' : null}
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px' }}>
          {notes.map((note) => {
            const parsedTags = Array.isArray(note.tags) ? note.tags : [];

            return (
              <div
                key={note.id}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="badge badge-primary">{note.file_type.toUpperCase()}</span>
                    {note.semester && (
                      <span className="badge" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                        Sem {note.semester}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', lineHeight: 1.4 }}>
                    {note.title}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}>
                    {note.subject}
                  </div>
                  {note.description && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {note.description}
                    </p>
                  )}

                  {parsedTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                      {parsedTags.map((t, idx) => (
                        <span key={idx} style={{ fontSize: '0.72rem', color: 'var(--text-light)', background: 'var(--bg-surface-hover)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {note.uploader_avatar ? (
                        <img src={getImageUrl(note.uploader_avatar)} alt={note.uploader_name} className="avatar avatar-sm" />
                      ) : (
                        <div className="avatar avatar-sm">{note.uploader_name?.charAt(0).toUpperCase()}</div>
                      )}
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{note.uploader_name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleToggleLike(note.id)}
                        className="btn-ghost"
                        style={{ padding: '4px', color: note.is_liked ? 'var(--accent-rose)' : 'var(--text-muted)' }}
                        title="Like note"
                      >
                        <Heart size={16} fill={note.is_liked ? 'var(--accent-rose)' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleToggleBookmark(note.id)}
                        className="btn-ghost"
                        style={{ padding: '4px', color: note.is_bookmarked ? 'var(--primary)' : 'var(--text-muted)' }}
                        title="Bookmark"
                      >
                        <Bookmark size={16} fill={note.is_bookmarked ? 'var(--primary)' : 'none'} />
                      </button>
                      <button
                        onClick={() => openComments(note)}
                        className="btn-ghost"
                        style={{ padding: '4px', color: 'var(--text-muted)' }}
                        title="Comments"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(note)}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    <Download size={14} /> Download File ({note.download_count || 0})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Notes Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Study Material">
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Note Title *
            </label>
            <input
              type="text"
              required
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="e.g. Dynamic Programming Complete Notes"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Subject *
              </label>
              <input
                type="text"
                required
                value={uploadForm.subject}
                onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                placeholder="e.g. Data Structures"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Semester
              </label>
              <select
                value={uploadForm.semester}
                onChange={(e) => setUploadForm({ ...uploadForm, semester: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              PDF or Image File *
            </label>
            <input
              type="file"
              required
              accept=".pdf,image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
              placeholder="algorithms, exams, cheat-sheet"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={3}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="What does this document cover? Mention topics, professors, or exam years..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsUploadOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="btn btn-primary">
              {uploading ? 'Uploading...' : 'Publish Notes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Comments Modal */}
      {activeNoteForComments && (
        <Modal
          isOpen={!!activeNoteForComments}
          onClose={() => setActiveNoteForComments(null)}
          title={`Discussion: ${activeNoteForComments.title}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {user && (
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask a question about these notes..."
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Send
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px 0' }}>
                  No comments yet.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ background: 'var(--bg-surface-hover)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '0.86rem' }}>{c.user_name}</strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.88rem' }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
