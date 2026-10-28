import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getImageUrl } from '../utils/api';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Lightbulb,
  Heart,
  MessageCircle,
  Share2,
  Image,
  Send,
  Sparkles,
  Tag,
  X,
  Trash2,
} from 'lucide-react';

const SUGGESTED_TAGS = ['project-idea', 'startup', 'doubt', 'hackathon', 'ai', 'study-tip'];

export const Feed = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('');

  // Composer State
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [posting, setPosting] = useState(false);

  // Active expanded comments
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: Array }
  const [loadingComments, setLoadingComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const fetchPosts = async (tag = selectedTag) => {
    setLoading(true);
    try {
      const res = await api.get('/posts', { tag: tag || undefined });
      setPosts(res.posts || []);
    } catch (err) {
      showToast(err.message || 'Failed to load feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(selectedTag);
  }, [selectedTag]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) {
      showToast('Write a thought or attach an image to post', 'warning');
      return;
    }

    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await api.post('/posts', formData);
      setPosts((prev) => [res.post, ...prev]);
      setContent('');
      removeSelectedImage();
      showToast('Thought posted to campus feed!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create post', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!user) {
      showToast('Please sign in to like posts', 'info');
      return;
    }

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.is_liked;
          return {
            ...p,
            is_liked: isLiked,
            like_count: isLiked ? p.like_count + 1 : Math.max(0, p.like_count - 1),
          };
        }
        return p;
      })
    );

    try {
      const res = await api.post(`/posts/${postId}/like`, {});
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, is_liked: res.liked, like_count: res.like_count } : p
        )
      );
    } catch {
      // Revert if error
      fetchPosts();
    }
  };

  const handleShare = async (postId) => {
    const postUrl = `${window.location.origin}/#post-${postId}`;
    navigator.clipboard?.writeText(postUrl);
    showToast('Post link copied to clipboard!', 'info');

    try {
      const res = await api.post(`/posts/${postId}/share`, {});
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, share_count: res.share_count } : p))
      );
    } catch (e) {
      // Ignore
    }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => ({ ...prev, [postId]: null }));
      return;
    }

    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setExpandedComments((prev) => ({ ...prev, [postId]: res.comments || [] }));
    } catch (err) {
      showToast('Failed to load comments', 'error');
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text });
      setExpandedComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
      );
    } catch (err) {
      showToast(err.message || 'Failed to add comment', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Post deleted', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete post', 'error');
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '720px' }}>
      {/* Feed Title Banner */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles color="var(--primary)" size={24} />
          Campus Feed & Ideas
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Brainstorm project ideas, ask study doubts, or share tech discoveries with your peers.
        </p>
      </div>

      {/* Post Composer (Visible if logged in) */}
      {user && (
        <div
          className="glass-panel"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '20px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            {user.avatar_url ? (
              <img src={getImageUrl(user.avatar_url)} alt={user.name} className="avatar avatar-md" />
            ) : (
              <div className="avatar avatar-md">{user.name?.charAt(0).toUpperCase()}</div>
            )}
            <div style={{ flex: 1 }}>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a project idea, question, or campus thought... (use #tags!)"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '4px 0',
                  fontSize: '0.98rem',
                  resize: 'none',
                }}
              />

              {/* Image Preview if selected */}
              {imagePreview && (
                <div style={{ position: 'relative', marginTop: '10px', marginBottom: '10px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxHeight: '220px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      width: '100%',
                    }}
                  />
                  <button
                    onClick={removeSelectedImage}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      color: 'white',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Suggested Hashtag Quick Clickers */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0 16px 0' }}>
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setContent((prev) => (prev ? `${prev} #${tag} ` : `#${tag} `))}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      background: 'var(--primary-light)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Composer Action Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.86rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Image size={18} color="var(--primary)" />
                  <span>Attach Image</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                </label>

                <button
                  onClick={handleCreatePost}
                  disabled={posting}
                  className="btn btn-primary btn-sm"
                >
                  {posting ? 'Posting...' : 'Post Thought'}
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter by Topic Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        <button
          onClick={() => setSelectedTag('')}
          className={`btn btn-sm ${!selectedTag ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: 'var(--radius-full)', flexShrink: 0 }}
        >
          All Topics
        </button>
        {SUGGESTED_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
            className={`btn btn-sm ${selectedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', flexShrink: 0 }}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Feed Posts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={selectedTag ? `No posts found under #${selectedTag}` : 'No thoughts posted yet'}
          description="Be the first student to share an idea, project, or doubt with the campus!"
          actionText={selectedTag ? 'View all posts' : null}
          onAction={() => setSelectedTag('')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {posts.map((post) => {
            const isAuthor = user && user.id === post.author_id;
            const parsedTags = Array.isArray(post.tags) ? post.tags : [];

            return (
              <article
                key={post.id}
                id={`post-${post.id}`}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Author Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <Link
                    to={`/profile/${post.author_id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                  >
                    {post.author_avatar ? (
                      <img
                        src={getImageUrl(post.author_avatar)}
                        alt={post.author_name}
                        className="avatar avatar-md"
                      />
                    ) : (
                      <div className="avatar avatar-md">{post.author_name?.charAt(0).toUpperCase()}</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{post.author_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {post.author_college ? `${post.author_college} • ` : ''}
                        {new Date(post.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </Link>

                  {isAuthor && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="btn-ghost"
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--text-light)',
                      }}
                      title="Delete post"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <p style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '14px', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>

                {/* Post Image */}
                {post.image_url && (
                  <div style={{ marginBottom: '14px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <img
                      src={getImageUrl(post.image_url)}
                      alt="Post visual"
                      style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Tags */}
                {parsedTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {parsedTags.map((t, idx) => (
                      <span
                        key={idx}
                        onClick={() => setSelectedTag(t)}
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: 'var(--primary)',
                          cursor: 'pointer',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Like, Comment, Share */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: post.is_liked ? 'var(--accent-rose)' : 'inherit',
                      fontWeight: post.is_liked ? 700 : 500,
                    }}
                  >
                    <Heart
                      size={18}
                      fill={post.is_liked ? 'var(--accent-rose)' : 'none'}
                      color={post.is_liked ? 'var(--accent-rose)' : 'currentColor'}
                    />
                    <span>{post.like_count || 0}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MessageCircle size={18} />
                    <span>{post.comment_count || 0} Comments</span>
                  </button>

                  <button
                    onClick={() => handleShare(post.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Share2 size={18} />
                    <span>{post.share_count || 0} Shares</span>
                  </button>
                </div>

                {/* Expanded Comments Section */}
                {expandedComments[post.id] !== undefined && (
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Add Comment Input */}
                    {user && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder="Write a comment..."
                          style={{ flex: 1, padding: '8px 14px', fontSize: '0.88rem' }}
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Reply
                        </button>
                      </div>
                    )}

                    {/* Comments List */}
                    {loadingComments[post.id] ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading comments...</div>
                    ) : expandedComments[post.id]?.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                        No comments yet. Start the conversation!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {expandedComments[post.id]?.map((comment) => (
                          <div
                            key={comment.id}
                            style={{
                              display: 'flex',
                              gap: '10px',
                              padding: '10px 14px',
                              backgroundColor: 'var(--bg-surface-hover)',
                              borderRadius: 'var(--radius-md)',
                            }}
                          >
                            {comment.user_avatar ? (
                              <img
                                src={getImageUrl(comment.user_avatar)}
                                alt={comment.user_name}
                                className="avatar avatar-sm"
                              />
                            ) : (
                              <div className="avatar avatar-sm">{comment.user_name?.charAt(0).toUpperCase()}</div>
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{comment.user_name}</span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.88rem', marginTop: '2px' }}>{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
