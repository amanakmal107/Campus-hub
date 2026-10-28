import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getImageUrl } from '../utils/api';
import { Modal } from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import {
  BookMarked,
  Search,
  Filter,
  Plus,
  Send,
  CheckCircle,
  Tag,
  DollarSign,
  HelpCircle,
  ArrowUpDown,
  User,
} from 'lucide-react';

export const Books = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [listingType, setListingType] = useState('');
  const [sort, setSort] = useState('newest');

  // Post Book Modal
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    subject: '',
    condition: 'good',
    listing_type: 'exchange',
    price: '',
    description: '',
  });

  // Selected Book Detail & Request Modal
  const [selectedBook, setSelectedBook] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/books', {
        search: search || undefined,
        condition: condition || undefined,
        listing_type: listingType || undefined,
        sort,
      });
      setBooks(res.books || []);
    } catch (err) {
      showToast(err.message || 'Failed to load books', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, condition, listingType, sort]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      showToast('Book title is required', 'warning');
      return;
    }

    setPosting(true);
    try {
      const res = await api.post('/books', bookForm);
      setBooks((prev) => [res.book, ...prev]);
      setIsPostModalOpen(false);
      setBookForm({
        title: '',
        author: '',
        subject: '',
        condition: 'good',
        listing_type: 'exchange',
        price: '',
        description: '',
      });
      showToast('Textbook listed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to list book', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user) {
      showToast('Please log in to request this book', 'info');
      return;
    }
    if (!selectedBook) return;

    setSubmittingRequest(true);
    try {
      await api.post(`/books/${selectedBook.id}/request`, { message: requestMessage });
      showToast('Request sent to book owner!', 'success');
      setSelectedBook(null);
      setRequestMessage('');
    } catch (err) {
      showToast(err.message || 'Failed to request book', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getBadgeClass = (type) => {
    if (type === 'donate') return 'badge-green';
    if (type === 'exchange') return 'badge-blue';
    return 'badge-amber';
  };

  return (
    <div className="page-wrapper">
      {/* Header and Call to Action */}
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
            <BookMarked color="var(--primary)" size={28} />
            Textbook Exchange
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Exchange, buy, or donate course textbooks directly with students on campus.
          </p>
        </div>

        {user && (
          <button onClick={() => setIsPostModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Post a Book
          </button>
        )}
      </div>

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
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, author, or subject..."
            style={{ width: '100%', paddingLeft: '38px' }}
          />
          <Search
            size={18}
            color="var(--text-light)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Listing Type Filter */}
        <select
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="">All Types</option>
          <option value="exchange">Exchange 🔄</option>
          <option value="sell">For Sale 💰</option>
          <option value="donate">Donation 🎁</option>
        </select>

        {/* Condition Filter */}
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="">All Conditions</option>
          <option value="new">Brand New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No textbooks found"
          description="Try modifying your search keywords or clearing filters."
          actionText={user ? 'List your textbook now' : null}
          onAction={() => setIsPostModalOpen(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {books.map((book) => {
            return (
              <div
                key={book.id}
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
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className={`badge ${getBadgeClass(book.listing_type)}`}>
                      {book.listing_type === 'donate' ? 'Free Gift' : book.listing_type}
                    </span>
                    <span className="badge" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}>
                      {book.condition}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.4 }}>
                    {book.title}
                  </h3>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    By {book.author || 'Unknown Author'}
                  </div>
                  {book.subject && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>
                      📚 {book.subject}
                    </div>
                  )}
                  {book.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {book.description}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {book.owner_avatar ? (
                        <img src={getImageUrl(book.owner_avatar)} alt={book.owner_name} className="avatar avatar-sm" />
                      ) : (
                        <div className="avatar avatar-sm">{book.owner_name?.charAt(0).toUpperCase()}</div>
                      )}
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{book.owner_name}</span>
                    </div>

                    {book.price > 0 ? (
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ${book.price}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {book.listing_type === 'donate' ? 'Free' : 'Exchange'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedBook(book)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%' }}
                  >
                    View Details & Request
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post a Book Modal */}
      <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="List a Course Textbook">
        <form onSubmit={handleCreateBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Textbook Title *
            </label>
            <input
              type="text"
              required
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              placeholder="e.g. Introduction to Algorithms"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Author / Edition
              </label>
              <input
                type="text"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                placeholder="e.g. Cormen, 3rd Ed."
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Subject / Course
              </label>
              <input
                type="text"
                value={bookForm.subject}
                onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                placeholder="e.g. Computer Science"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Listing Type
              </label>
              <select
                value={bookForm.listing_type}
                onChange={(e) => setBookForm({ ...bookForm, listing_type: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="exchange">Exchange (Swap)</option>
                <option value="sell">Sell for Cash</option>
                <option value="donate">Donate (Give Away)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Book Condition
              </label>
              <select
                value={bookForm.condition}
                onChange={(e) => setBookForm({ ...bookForm, condition: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="new">Brand New (Unopened)</option>
                <option value="good">Good (Lightly Used)</option>
                <option value="fair">Fair (Has Highlights)</option>
                <option value="poor">Poor (Heavy Wear)</option>
              </select>
            </div>
          </div>

          {bookForm.listing_type === 'sell' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Asking Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={bookForm.price}
                onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                placeholder="e.g. 25.00"
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              Description & Notes
            </label>
            <textarea
              rows={3}
              value={bookForm.description}
              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              placeholder="Mention highlights, missing pages, or subjects you want in exchange..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsPostModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={posting} className="btn btn-primary">
              {posting ? 'Listing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Book Details & Request Modal */}
      {selectedBook && (
        <Modal
          isOpen={!!selectedBook}
          onClose={() => setSelectedBook(null)}
          title="Textbook Details"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${getBadgeClass(selectedBook.listing_type)}`}>
                {selectedBook.listing_type}
              </span>
              <span className="badge badge-primary">{selectedBook.condition} condition</span>
              <span className="badge badge-green">{selectedBook.status}</span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{selectedBook.title}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Author: <strong>{selectedBook.author || 'N/A'}</strong> • Subject: <strong>{selectedBook.subject || 'N/A'}</strong>
            </div>

            {selectedBook.price > 0 && (
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                Asking Price: ${selectedBook.price}
              </div>
            )}

            {selectedBook.description && (
              <div style={{ background: 'var(--bg-surface-hover)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>{selectedBook.description}</p>
              </div>
            )}

            {/* Owner Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {selectedBook.owner_avatar ? (
                <img src={getImageUrl(selectedBook.owner_avatar)} alt={selectedBook.owner_name} className="avatar avatar-md" />
              ) : (
                <div className="avatar avatar-md">{selectedBook.owner_name?.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedBook.owner_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedBook.owner_college || 'Student'}
                </div>
              </div>
            </div>

            {/* Request Workflow (if not own book) */}
            {user && user.id !== selectedBook.owner_id ? (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                  Send Request to Owner
                </label>
                <textarea
                  rows={2}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Hey, I'd like to get/swap this book. When can we meet on campus?"
                  style={{ width: '100%', marginBottom: '12px', resize: 'none' }}
                />
                <button
                  onClick={handleSendRequest}
                  disabled={submittingRequest}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Send size={16} /> {submittingRequest ? 'Sending request...' : 'Send Request'}
                </button>
              </div>
            ) : user && user.id === selectedBook.owner_id ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '8px 0' }}>
                💡 This is your book listing. You will receive requests when students message or request it.
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '8px 0' }}>
                Please log in to send a request for this book.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
