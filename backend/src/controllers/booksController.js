const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

exports.listBooks = asyncHandler(async (req, res) => {
  const { search, subject, condition, listing_type, sort = 'newest', page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ["b.status = 'available'"];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(b.title ILIKE $${params.length} OR b.author ILIKE $${params.length} OR b.subject ILIKE $${params.length})`);
  }
  if (subject) {
    params.push(subject);
    conditions.push(`b.subject = $${params.length}`);
  }
  if (condition) {
    params.push(condition);
    conditions.push(`b.condition = $${params.length}`);
  }
  if (listing_type) {
    params.push(listing_type);
    conditions.push(`b.listing_type = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap = {
    newest: 'b.created_at DESC',
    oldest: 'b.created_at ASC',
    price_low: 'b.price ASC NULLS LAST',
    price_high: 'b.price DESC NULLS LAST',
  };
  const orderBy = sortMap[sort] || 'b.created_at DESC';

  params.push(limitNum, offset);
  const dataQuery = `
    SELECT b.*, u.name as owner_name, u.avatar_url as owner_avatar, u.college as owner_college
    FROM books b JOIN users u ON b.owner_id = u.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countParams = params.slice(0, -2);
  const countQuery = `SELECT COUNT(*) FROM books b ${where}`;

  const [data, count] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams),
  ]);

  res.json({
    books: data.rows,
    total: parseInt(count.rows[0].count),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(parseInt(count.rows[0].count) / limitNum),
  });
});

exports.createBook = asyncHandler(async (req, res) => {
  const { title, author, subject, condition, listing_type, price, description } = req.body;

  if (!title || !condition || !listing_type) {
    return res.status(400).json({ error: 'Title, condition and listing type are required' });
  }

  const photos = req.files ? req.files.map(f => `/uploads/images/${f.filename}`) : [];

  const { rows } = await query(
    `INSERT INTO books (owner_id, title, author, subject, condition, listing_type, price, description, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [req.user.id, title, author, subject, condition, listing_type,
     price ? parseFloat(price) : null, description, JSON.stringify(photos)]
  );

  const { rows: bookWithOwner } = await query(
    `SELECT b.*, u.name as owner_name, u.avatar_url as owner_avatar
     FROM books b JOIN users u ON b.owner_id = u.id WHERE b.id = $1`,
    [rows[0].id]
  );

  res.status(201).json({ book: bookWithOwner[0] });
});

exports.getBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT b.*, u.name as owner_name, u.avatar_url as owner_avatar, 
            u.college as owner_college, u.email as owner_email
     FROM books b JOIN users u ON b.owner_id = u.id WHERE b.id = $1`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Book not found' });

  // Get requests count
  const { rows: reqCount } = await query(
    'SELECT COUNT(*) FROM book_requests WHERE book_id = $1',
    [id]
  );

  res.json({ book: { ...rows[0], request_count: parseInt(reqCount[0].count) } });
});

exports.updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await query('SELECT * FROM books WHERE id = $1', [id]);
  if (!existing.length) return res.status(404).json({ error: 'Book not found' });
  if (existing[0].owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this book' });
  }

  const { title, author, subject, condition, listing_type, price, description, status } = req.body;
  const { rows } = await query(
    `UPDATE books SET
       title = COALESCE($1, title),
       author = COALESCE($2, author),
       subject = COALESCE($3, subject),
       condition = COALESCE($4, condition),
       listing_type = COALESCE($5, listing_type),
       price = COALESCE($6, price),
       description = COALESCE($7, description),
       status = COALESCE($8, status)
     WHERE id = $9 RETURNING *`,
    [title, author, subject, condition, listing_type, price, description, status, id]
  );
  res.json({ book: rows[0] });
});

exports.deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT owner_id FROM books WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Book not found' });
  if (rows[0].owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  await query('DELETE FROM books WHERE id = $1', [id]);
  res.json({ message: 'Book deleted successfully' });
});

exports.requestBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const { rows: book } = await query('SELECT * FROM books WHERE id = $1', [id]);
  if (!book.length) return res.status(404).json({ error: 'Book not found' });
  if (book[0].owner_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot request your own book' });
  }
  if (book[0].status !== 'available') {
    return res.status(400).json({ error: 'Book is not available' });
  }

  const { rows } = await query(
    `INSERT INTO book_requests (book_id, requester_id, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [id, req.user.id, message]
  );
  res.status(201).json({ request: rows[0] });
});

exports.handleRequest = asyncHandler(async (req, res) => {
  const { id, reqId } = req.params;
  const { action } = req.body; // 'accepted' or 'declined'

  if (!['accepted', 'declined'].includes(action)) {
    return res.status(400).json({ error: 'Action must be accepted or declined' });
  }

  const { rows: book } = await query('SELECT * FROM books WHERE id = $1', [id]);
  if (!book.length) return res.status(404).json({ error: 'Book not found' });
  if (book[0].owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Only the book owner can handle requests' });
  }

  const { rows } = await query(
    'UPDATE book_requests SET status = $1 WHERE id = $2 AND book_id = $3 RETURNING *',
    [action, reqId, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Request not found' });

  // If accepted, update book status and decline other requests
  if (action === 'accepted') {
    await query('UPDATE books SET status = $1 WHERE id = $2', ['reserved', id]);
    await query(
      'UPDATE book_requests SET status = $1 WHERE book_id = $2 AND id != $3',
      ['declined', id, reqId]
    );
  }

  res.json({ request: rows[0] });
});
