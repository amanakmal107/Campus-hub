const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

exports.listPosts = asyncHandler(async (req, res) => {
  const { tag, search, communityId, page = 1, limit = 15 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;
  const userId = req.user?.id;

  const conditions = [];
  const params = [];

  if (communityId) {
    params.push(communityId);
    conditions.push(`p.community_id = $${params.length}`);
  } else if (communityId === null || req.query.globalOnly === 'true') {
    conditions.push(`p.community_id IS NULL`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`p.content ILIKE $${params.length}`);
  }

  if (tag) {
    const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
    params.push(JSON.stringify([cleanTag]));
    conditions.push(`p.tags @> $${params.length}::jsonb`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const userLikeJoin = userId
    ? `, EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = '${userId}') as is_liked`
    : ', false as is_liked';

  params.push(limitNum, offset);
  const dataQuery = `
    SELECT p.*, 
           u.name as author_name, 
           u.avatar_url as author_avatar, 
           u.college as author_college,
           u.course as author_course,
           c.name as community_name,
           c.slug as community_slug
           ${userLikeJoin}
    FROM posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countParams = params.slice(0, -2);
  const countQuery = `SELECT COUNT(*) FROM posts p ${where}`;

  const [data, count] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, countParams),
  ]);

  res.json({
    posts: data.rows,
    total: parseInt(count.rows[0].count),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(parseInt(count.rows[0].count) / limitNum),
  });
});

exports.createPost = asyncHandler(async (req, res) => {
  const { content, tags, community_id } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  let imageUrl = null;
  if (req.file) {
    imageUrl = `/uploads/images/${req.file.filename}`;
  }

  let parsedTags = [];
  if (tags) {
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch {
      parsedTags = String(tags)
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);
    }
  }

  // Auto extract hashtags from text if none provided explicitly
  if (parsedTags.length === 0) {
    const extracted = content.match(/#[a-zA-Z0-9_-]+/g);
    if (extracted) {
      parsedTags = extracted.map((t) => t.slice(1).toLowerCase());
    }
  }

  const { rows } = await query(
    `INSERT INTO posts (author_id, community_id, content, image_url, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      req.user.id,
      community_id || null,
      content.trim(),
      imageUrl,
      JSON.stringify(parsedTags),
    ]
  );

  const { rows: enriched } = await query(
    `SELECT p.*, 
            u.name as author_name, 
            u.avatar_url as author_avatar, 
            u.college as author_college,
            u.course as author_course,
            false as is_liked
     FROM posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.id = $1`,
    [rows[0].id]
  );

  res.status(201).json({ post: enriched[0] });
});

exports.getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const userLikeJoin = userId
    ? `, EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = '${userId}') as is_liked`
    : ', false as is_liked';

  const { rows } = await query(
    `SELECT p.*, 
            u.name as author_name, 
            u.avatar_url as author_avatar, 
            u.college as author_college,
            c.name as community_name
            ${userLikeJoin}
     FROM posts p
     JOIN users u ON p.author_id = u.id
     LEFT JOIN communities c ON p.community_id = c.id
     WHERE p.id = $1`,
    [id]
  );

  if (!rows.length) return res.status(404).json({ error: 'Post not found' });
  res.json({ post: rows[0] });
});

exports.updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, tags } = req.body;

  const { rows: existing } = await query('SELECT author_id FROM posts WHERE id = $1', [id]);
  if (!existing.length) return res.status(404).json({ error: 'Post not found' });
  if (existing[0].author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit your own posts' });
  }

  let parsedTags = null;
  if (tags) {
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch {
      parsedTags = String(tags).split(',').map((t) => t.trim().replace(/^#/, ''));
    }
  }

  const { rows } = await query(
    `UPDATE posts SET
       content = COALESCE($1, content),
       tags = COALESCE($2, tags)
     WHERE id = $3
     RETURNING *`,
    [content ? content.trim() : null, parsedTags ? JSON.stringify(parsedTags) : null, id]
  );

  res.json({ post: rows[0] });
});

exports.deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: existing } = await query('SELECT author_id FROM posts WHERE id = $1', [id]);
  if (!existing.length) return res.status(404).json({ error: 'Post not found' });
  if (existing[0].author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own posts' });
  }

  await query('DELETE FROM posts WHERE id = $1', [id]);
  res.json({ message: 'Post deleted successfully' });
});

exports.toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { rows: existing } = await query(
    'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2',
    [id, userId]
  );

  if (existing.length) {
    await query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [id, userId]);
    const { rows: updated } = await query('SELECT like_count FROM posts WHERE id = $1', [id]);
    res.json({ liked: false, like_count: updated[0]?.like_count || 0 });
  } else {
    await query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [id, userId]);
    const { rows: updated } = await query('SELECT like_count FROM posts WHERE id = $1', [id]);
    res.json({ liked: true, like_count: updated[0]?.like_count || 0 });
  }
});

exports.sharePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    'UPDATE posts SET share_count = share_count + 1 WHERE id = $1 RETURNING share_count',
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Post not found' });
  res.json({ share_count: rows[0].share_count });
});

exports.getComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT pc.*, u.name as user_name, u.avatar_url as user_avatar, u.college as user_college
     FROM post_comments pc
     JOIN users u ON pc.user_id = u.id
     WHERE pc.post_id = $1
     ORDER BY pc.created_at ASC`,
    [id]
  );
  res.json({ comments: rows });
});

exports.addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty' });
  }

  const { rows } = await query(
    `INSERT INTO post_comments (post_id, user_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, req.user.id, content.trim()]
  );

  const { rows: enriched } = await query(
    `SELECT pc.*, u.name as user_name, u.avatar_url as user_avatar, u.college as user_college
     FROM post_comments pc
     JOIN users u ON pc.user_id = u.id
     WHERE pc.id = $1`,
    [rows[0].id]
  );

  res.status(201).json({ comment: enriched[0] });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { id, commentId } = req.params;
  const { rows: existing } = await query('SELECT user_id FROM post_comments WHERE id = $1', [commentId]);
  if (!rows.length) return res.status(404).json({ error: 'Comment not found' });
  if (rows[0].user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own comment' });
  }

  await query('DELETE FROM post_comments WHERE id = $1 AND post_id = $2', [commentId, id]);
  res.json({ message: 'Comment deleted successfully' });
});
