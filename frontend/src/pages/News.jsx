import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Newspaper,
  Bookmark,
  ExternalLink,
  GraduationCap,
  Cpu,
  Briefcase,
  Award,
  Clock,
  Trash2,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'careers', label: 'Careers & Hiring', icon: Briefcase },
  { id: 'scholarships', label: 'Scholarships & Grants', icon: Award },
];

const getCategoryIcon = (category = '') => {
  const cat = String(category).toLowerCase();
  if (cat.includes('tech')) return Cpu;
  if (cat.includes('career')) return Briefcase;
  if (cat.includes('scholarship') || cat.includes('grant')) return Award;
  return GraduationCap;
};

// Robust Article Cover with error fallback
const ArticleCover = ({ src, title, category, source }) => {
  const [hasError, setHasError] = useState(false);
  const Icon = getCategoryIcon(category);

  if (hasError || !src) {
    return (
      <div className="card-image-fallback">
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Icon size={24} color="var(--primary)" />
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {category || source || 'Campus Digest'}
        </span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', backgroundColor: 'var(--bg-surface-hover)' }}>
      <img
        src={src}
        alt=""
        onError={() => setHasError(true)}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.3s ease',
        }}
      />
    </div>
  );
};

export const News = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('education');
  const [viewSavedOnly, setViewSavedOnly] = useState(false);

  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async (cat = activeCategory) => {
    setLoading(true);
    try {
      const res = await api.get('/news', { category: cat });
      setArticles(res.articles || []);
    } catch (err) {
      showToast(err.message || 'Failed to load news', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedArticles = async () => {
    if (!user) return;
    try {
      const res = await api.get('/news/saved');
      setSavedArticles(res.savedArticles || []);
    } catch {
      // quiet
    }
  };

  useEffect(() => {
    if (!viewSavedOnly) {
      fetchNews(activeCategory);
    }
    fetchSavedArticles();
  }, [activeCategory, viewSavedOnly]);

  const handleSaveArticle = async (article) => {
    if (!user) {
      showToast('Please sign in to save articles', 'info');
      return;
    }

    try {
      await api.post('/news/save', {
        article_url: article.url || article.article_url,
        title: article.title,
        description: article.description,
        image_url: article.image_url,
        source: article.source,
        category: article.category,
        published_at: article.published_at,
      });
      showToast('Article saved to your reading list!', 'success');
      fetchSavedArticles();
    } catch (err) {
      showToast(err.message || 'Failed to save article', 'error');
    }
  };

  const handleDeleteSaved = async (savedId) => {
    try {
      await api.delete(`/news/saved/${savedId}`);
      setSavedArticles((prev) => prev.filter((a) => a.id !== savedId));
      showToast('Article removed from saved', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove', 'error');
    }
  };

  const isArticleSaved = (url) => {
    return savedArticles.some((sa) => sa.article_url === url);
  };

  return (
    <div className="page-wrapper">
      {/* Title */}
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
            <Newspaper color="var(--primary)" size={28} />
            Campus News & Opportunities
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Curated updates across higher education, tech advancements, career fairs, and scholarships.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setViewSavedOnly(!viewSavedOnly)}
            className={`btn ${viewSavedOnly ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Bookmark size={16} /> {viewSavedOnly ? 'Browse All News' : `Saved Articles (${savedArticles.length})`}
          </button>
        )}
      </div>

      {/* Category Tabs (if not in Saved View) */}
      {!viewSavedOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: '28px',
          }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', flexShrink: 0, padding: '8px 18px' }}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* News Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : viewSavedOnly ? (
        savedArticles.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved articles yet"
            description="Bookmark relevant grant deadlines, tech breakthroughs, or career advice to revisit here."
            actionText="Browse News"
            onAction={() => setViewSavedOnly(false)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {savedArticles.map((article) => (
              <div
                key={article.id}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <ArticleCover
                  src={article.image_url}
                  title={article.title}
                  category={article.category}
                  source={article.source}
                />
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-primary">{article.source || 'News'}</span>
                      <button
                        onClick={() => handleDeleteSaved(article.id)}
                        className="btn-ghost"
                        style={{ color: 'var(--accent-rose)', padding: '4px' }}
                        title="Remove saved article"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4 }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {article.description}
                    </p>
                  </div>

                  <a
                    href={article.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Read Full Article <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No articles found"
          description="Check back later for fresh university feeds and announcements."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {articles.map((article, idx) => {
            const saved = isArticleSaved(article.url);

            return (
              <div
                key={idx}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
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
                <ArticleCover
                  src={article.image_url}
                  title={article.title}
                  category={article.category}
                  source={article.source}
                />

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-primary">{article.source || 'News'}</span>
                      <button
                        onClick={() => handleSaveArticle(article)}
                        className="btn-ghost"
                        style={{
                          padding: '6px',
                          color: saved ? 'var(--primary)' : 'var(--text-light)',
                        }}
                        title={saved ? 'Saved' : 'Save article'}
                      >
                        <Bookmark size={18} fill={saved ? 'var(--primary)' : 'none'} />
                      </button>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4 }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {article.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      {new Date(article.published_at).toLocaleDateString()}
                    </span>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      Read More <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
