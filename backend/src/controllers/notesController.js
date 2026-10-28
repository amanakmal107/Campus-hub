const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

exports.listNotes = asyncHandler(async (req, res) => {
  const { search, subject, semester, tag, sort = 'newest', page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;
  const userId = req.user?.id;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(n.title ILIKE $${params.length} OR n.subject ILIKE $${params.length} OR n.description ILIKE $${params.length})`);
  }
  if (subject) {
    params.push(subject);
    conditions.push(`n.subject = $${params.length}`);
  }
  if (semester) {
    params.push(parseInt(semester));
    conditions.push(`n.semester = $${params.length}`);
  }
  if (tag) {
    params.push(JSON.stringify([tag]));
    conditions.push(`n.tags @> $${params.length}::jsonb`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap = {
    newest: 'n.created_at DESC',
    popular: 'like_count DESC',
    downloads: 'n.download_count DESC',
  };
  const orderBy = sortMap[sort] || 'n.created_at DESC';

  const userLikeJoin = userId ? `, EXISTS(SELECT 1 FROM note_likes WHERE note_id = n.id AND user_id = '${userId}') as is_liked` : ', false as is_liked';
  const userBookmarkJoin = userId ? `, EXISTS(SELECT 1 FROM note_bookmarks WHERE note_id = n.id AND user_id = '${userId}') as is_bookmarked` : ', false as is_bookmarked';

  params.push(limitNum, offset);
  const dataQuery = `
    SELECT n.*, u.name as uploader_name, u.avatar_url as uploader_avatar, u.college as uploader_college,
           COUNT(nl.note_id)::int as like_count
           ${userLikeJoin}
           ${userBookmarkJoin}
    FROM notes n
    JOIN users u ON n.uploader_id = u.id
    LEFT JOIN note_likes nl ON n.id = nl.note_id
    ${where}
    GROUP BY n.id, u.name, u.avatar_url, u.college
    ORDER BY ${orderBy}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countParams = params.slice(0, -2);
  const countQuery = `SELECT COUNT(DISTINCT n.id) FROM notes n ${where}`;

  const [data, count] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams),
  ]);

  res.json({
    notes: data.rows,
    total: parseInt(count.rows[0].count),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(parseInt(count.rows[0].count) / limitNum),
  });
});

exports.topThisWeek = asyncHandler(async (req, res) => {
  const { rows } = await query(`
    SELECT n.*, u.name as uploader_name, u.avatar_url as uploader_avatar,
           COUNT(nl.note_id)::int as like_count
    FROM notes n
    JOIN users u ON n.uploader_id = u.id
    LEFT JOIN note_likes nl ON n.id = nl.note_id AND nl.created_at > NOW() - INTERVAL '7 days'
    WHERE n.created_at > NOW() - INTERVAL '30 days'
    GROUP BY n.id, u.name, u.avatar_url
    ORDER BY like_count DESC, n.download_count DESC
    LIMIT 5
  `);
  res.json({ notes: rows });
});

exports.uploadNote = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });

  const { title, subject, semester, description, tags } = req.body;
  if (!title || !subject) {
    return res.status(400).json({ error: 'Title and subject are required' });
  }

  const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
  const fileUrl = `/uploads/notes/${req.file.filename}`;
  let parsedTags = [];
  try {
    parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (Array.isArray(tags) ? tags : []);
  } catch {
    parsedTags = tags ? [tags] : [];
  }

  const { rows } = await query(
    `INSERT INTO notes (uploader_id, title, subject, semester, description, file_url, file_type, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [req.user.id, title, subject, semester ? parseInt(semester) : null,
     description, fileUrl, fileType, JSON.stringify(parsedTags)]
  );

  const { rows: enriched } = await query(
    `SELECT n.*, u.name as uploader_name, u.avatar_url as uploader_avatar
     FROM notes n JOIN users u ON n.uploader_id = u.id WHERE n.id = $1`,
    [rows[0].id]
  );

  res.status(201).json({ note: enriched[0] });
});

exports.getNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const userLikeJoin = userId ? `, EXISTS(SELECT 1 FROM note_likes WHERE note_id = n.id AND user_id = '${userId}') as is_liked` : ', false as is_liked';
  const userBookmarkJoin = userId ? `, EXISTS(SELECT 1 FROM note_bookmarks WHERE note_id = n.id AND user_id = '${userId}') as is_bookmarked` : ', false as is_bookmarked';

  const { rows } = await query(`
    SELECT n.*, u.name as uploader_name, u.avatar_url as uploader_avatar, u.college as uploader_college,
           COUNT(nl.note_id)::int as like_count
           ${userLikeJoin}
           ${userBookmarkJoin}
    FROM notes n
    JOIN users u ON n.uploader_id = u.id
    LEFT JOIN note_likes nl ON n.id = nl.note_id
    WHERE n.id = $1
    GROUP BY n.id, u.name, u.avatar_url, u.college
  `, [id]);

  if (!rows.length) return res.status(404).json({ error: 'Note not found' });
  res.json({ note: rows[0] });
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT uploader_id FROM notes WHERE id = $1', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Note not found' });
  if (rows[0].uploader_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  await query('DELETE FROM notes WHERE id = $1', [id]);
  res.json({ message: 'Note deleted' });
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { rows: existing } = await query(
    'SELECT 1 FROM note_likes WHERE note_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existing.length) {
    await query('DELETE FROM note_likes WHERE note_id = $1 AND user_id = $2', [id, userId]);
    res.json({ liked: false });
  } else {
    await query('INSERT INTO note_likes (note_id, user_id) VALUES ($1, $2)', [id, userId]);
    res.json({ liked: true });
  }
});

exports.toggleBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { rows: existing } = await query(
    'SELECT 1 FROM note_bookmarks WHERE note_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existing.length) {
    await query('DELETE FROM note_bookmarks WHERE note_id = $1 AND user_id = $2', [id, userId]);
    res.json({ bookmarked: false });
  } else {
    await query('INSERT INTO note_bookmarks (note_id, user_id) VALUES ($1, $2)', [id, userId]);
    res.json({ bookmarked: true });
  }
});

exports.getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT nc.*, u.name as user_name, u.avatar_url as user_avatar
     FROM note_comments nc JOIN users u ON nc.user_id = u.id
     WHERE nc.note_id = $1 ORDER BY nc.created_at ASC`,
    [id]
  );
  res.json({ comments: rows });
});

exports.addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment content required' });

  const { rows } = await query(
    `INSERT INTO note_comments (note_id, user_id, content)
     VALUES ($1, $2, $3) RETURNING *`,
    [id, req.user.id, content.trim()]
  );
  const { rows: enriched } = await query(
    `SELECT nc.*, u.name as user_name, u.avatar_url as user_avatar
     FROM note_comments nc JOIN users u ON nc.user_id = u.id WHERE nc.id = $1`,
    [rows[0].id]
  );
  res.status(201).json({ comment: enriched[0] });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { rows } = await query('SELECT user_id FROM note_comments WHERE id = $1', [commentId]);
  if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
  if (rows[0].user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  await query('DELETE FROM note_comments WHERE id = $1', [commentId]);
  res.json({ message: 'Comment deleted' });
});

exports.incrementDownload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await query('UPDATE notes SET download_count = download_count + 1 WHERE id = $1', [id]);
  res.json({ message: 'Download counted' });
});
