const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');

exports.getProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT id, name, email, college, course, year, bio, avatar_url, is_online, last_seen, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) {
    return res.status(403).json({ error: 'Cannot update another user\'s profile' });
  }

  const { name, college, course, year, bio } = req.body;
  const { rows } = await query(
    `UPDATE users SET
       name = COALESCE($1, name),
       college = COALESCE($2, college),
       course = COALESCE($3, course),
       year = COALESCE($4, year),
       bio = COALESCE($5, bio)
     WHERE id = $6
     RETURNING id, name, email, college, course, year, bio, avatar_url`,
    [name, college, course, year ? parseInt(year) : null, bio, id]
  );
  res.json({ user: rows[0] });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id) {
    return res.status(403).json({ error: 'Cannot update another user\'s avatar' });
  }
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const avatarUrl = `/uploads/images/${req.file.filename}`;
  const { rows } = await query(
    'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, avatar_url',
    [avatarUrl, id]
  );
  res.json({ user: rows[0] });
});

exports.getUserPosts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `SELECT p.*, u.name as author_name, u.avatar_url as author_avatar,
            u.college as author_college
     FROM posts p JOIN users u ON p.author_id = u.id
     WHERE p.author_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );
  const { rows: count } = await query('SELECT COUNT(*) FROM posts WHERE author_id = $1', [id]);
  res.json({ posts: rows, total: parseInt(count[0].count), page, limit });
});

exports.getUserNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `SELECT n.*, u.name as uploader_name, u.avatar_url as uploader_avatar,
            COUNT(nl.note_id) as like_count
     FROM notes n 
     JOIN users u ON n.uploader_id = u.id
     LEFT JOIN note_likes nl ON n.id = nl.note_id
     WHERE n.uploader_id = $1
     GROUP BY n.id, u.name, u.avatar_url
     ORDER BY n.created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );
  res.json({ notes: rows, page, limit });
});

exports.getUserBooks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT b.*, u.name as owner_name, u.avatar_url as owner_avatar
     FROM books b JOIN users u ON b.owner_id = u.id
     WHERE b.owner_id = $1
     ORDER BY b.created_at DESC`,
    [id]
  );
  res.json({ books: rows });
});
