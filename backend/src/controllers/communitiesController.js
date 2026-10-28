const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

exports.listCommunities = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * limitNum;
  const userId = req.user?.id;

  const conditions = [];
  const params = [];

  // Public communities or communities the user is in
  if (userId) {
    conditions.push(`(c.is_private = FALSE OR EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = '${userId}'))`);
  } else {
    conditions.push('c.is_private = FALSE');
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(c.name ILIKE $${params.length} OR c.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`c.category = $${params.length}`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const userJoin = userId ? `, EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = '${userId}') as is_member` : ', false as is_member';

  params.push(limitNum, offset);
  const { rows } = await query(`
    SELECT c.*, u.name as admin_name, u.avatar_url as admin_avatar
           ${userJoin}
    FROM communities c JOIN users u ON c.admin_id = u.id
    ${where}
    ORDER BY c.member_count DESC, c.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  const countParams = params.slice(0, -2);
  const { rows: count } = await query(`SELECT COUNT(*) FROM communities c ${where}`, countParams);

  res.json({
    communities: rows,
    total: parseInt(count[0].count),
    page: pageNum,
    limit: limitNum,
  });
});

exports.createCommunity = asyncHandler(async (req, res) => {
  const { name, description, category, is_private } = req.body;
  if (!name) return res.status(400).json({ error: 'Community name is required' });

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const avatarUrl = req.files?.avatar?.[0] ? `/uploads/images/${req.files.avatar[0].filename}` : null;
  const bannerUrl = req.files?.banner?.[0] ? `/uploads/images/${req.files.banner[0].filename}` : null;

  const client = await require('../db').getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO communities (name, slug, description, category, is_private, avatar_url, banner_url, admin_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name.trim(), slug, description, category, is_private === 'true' || is_private === true,
       avatarUrl, bannerUrl, req.user.id]
    );

    await client.query(
      'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)',
      [rows[0].id, req.user.id, 'admin']
    );

    await client.query('COMMIT');
    res.status(201).json({ community: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

exports.getCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const userJoin = userId ? `, EXISTS(SELECT 1 FROM community_members WHERE community_id = c.id AND user_id = '${userId}') as is_member,
    (SELECT role FROM community_members WHERE community_id = c.id AND user_id = '${userId}') as user_role` : ', false as is_member, null as user_role';

  const { rows } = await query(`
    SELECT c.*, u.name as admin_name, u.avatar_url as admin_avatar
           ${userJoin}
    FROM communities c JOIN users u ON c.admin_id = u.id
    WHERE c.id = $1
  `, [id]);

  if (!rows.length) return res.status(404).json({ error: 'Community not found' });

  const community = rows[0];
  if (community.is_private && !community.is_member && req.user?.id !== community.admin_id) {
    return res.status(403).json({ error: 'This is a private community' });
  }

  res.json({ community });
});

exports.updateCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: community } = await query('SELECT * FROM communities WHERE id = $1', [id]);
  if (!community.length) return res.status(404).json({ error: 'Community not found' });
  if (community[0].admin_id !== req.user.id) {
    return res.status(403).json({ error: 'Only admin can update this community' });
  }

  const { name, description, category, is_private } = req.body;
  const { rows } = await query(
    `UPDATE communities SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       category = COALESCE($3, category),
       is_private = COALESCE($4, is_private)
     WHERE id = $5 RETURNING *`,
    [name, description, category, is_private, id]
  );
  res.json({ community: rows[0] });
});

exports.joinCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: community } = await query('SELECT * FROM communities WHERE id = $1', [id]);
  if (!community.length) return res.status(404).json({ error: 'Community not found' });
  if (community[0].is_private) {
    return res.status(403).json({ error: 'Cannot join a private community without an invite' });
  }

  const { rows: existing } = await query(
    'SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2',
    [id, req.user.id]
  );
  if (existing.length) return res.status(409).json({ error: 'Already a member' });

  await query(
    'INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, $3)',
    [id, req.user.id, 'member']
  );
  res.json({ message: 'Joined community successfully' });
});

exports.leaveCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: community } = await query('SELECT * FROM communities WHERE id = $1', [id]);
  if (!community.length) return res.status(404).json({ error: 'Community not found' });
  if (community[0].admin_id === req.user.id) {
    return res.status(400).json({ error: 'Admin cannot leave the community. Transfer ownership or delete it.' });
  }

  await query(
    'DELETE FROM community_members WHERE community_id = $1 AND user_id = $2',
    [id, req.user.id]
  );
  res.json({ message: 'Left community' });
});

exports.getMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    `SELECT u.id, u.name, u.avatar_url, u.college, u.course, cm.role, cm.joined_at
     FROM community_members cm JOIN users u ON cm.user_id = u.id
     WHERE cm.community_id = $1
     ORDER BY cm.role DESC, cm.joined_at ASC`,
    [id]
  );
  res.json({ members: rows });
});

exports.getCommunityPosts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `SELECT p.*, u.name as author_name, u.avatar_url as author_avatar, u.college as author_college
     FROM posts p JOIN users u ON p.author_id = u.id
     WHERE p.community_id = $1
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, limit, offset]
  );
  const { rows: count } = await query('SELECT COUNT(*) FROM posts WHERE community_id = $1', [id]);
  res.json({ posts: rows, total: parseInt(count[0].count), page, limit });
});

exports.removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { rows: community } = await query('SELECT admin_id FROM communities WHERE id = $1', [id]);
  if (!community.length) return res.status(404).json({ error: 'Community not found' });
  if (community[0].admin_id !== req.user.id) {
    return res.status(403).json({ error: 'Only admin can remove members' });
  }
  if (userId === community[0].admin_id) {
    return res.status(400).json({ error: 'Cannot remove admin' });
  }
  await query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [id, userId]);
  res.json({ message: 'Member removed' });
});
