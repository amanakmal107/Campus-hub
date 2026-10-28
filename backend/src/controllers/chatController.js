const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;

  // Find all distinct users with whom current user has exchanged direct messages
  const { rows } = await query(
    `WITH partner_messages AS (
       SELECT 
         CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS partner_id,
         id, content, sender_id, receiver_id, is_read, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END 
           ORDER BY created_at DESC
         ) as rn
       FROM messages
       WHERE (sender_id = $1 OR receiver_id = $1)
         AND community_id IS NULL
     ),
     latest_messages AS (
       SELECT * FROM partner_messages WHERE rn = 1
     ),
     unread_counts AS (
       SELECT sender_id AS partner_id, COUNT(*)::int AS unread_count
       FROM messages
       WHERE receiver_id = $1 AND is_read = FALSE AND community_id IS NULL
       GROUP BY sender_id
     )
     SELECT 
       u.id AS user_id,
       u.name,
       u.avatar_url,
       u.college,
       u.course,
       u.is_online,
       u.last_seen,
       lm.content AS last_message,
       lm.created_at AS last_message_at,
       lm.sender_id AS last_message_sender_id,
       COALESCE(uc.unread_count, 0) AS unread_count
     FROM latest_messages lm
     JOIN users u ON u.id = lm.partner_id
     LEFT JOIN unread_counts uc ON uc.partner_id = u.id
     ORDER BY lm.created_at DESC`,
    [currentUserId]
  );

  res.json({ conversations: rows });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS unread_count
     FROM messages
     WHERE receiver_id = $1 AND is_read = FALSE`,
    [req.user.id]
  );
  res.json({ unreadCount: rows[0]?.unread_count || 0 });
});

exports.getDirectMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = req.params.userId;
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const before = req.query.before; // cursor for pagination

  const params = [currentUserId, targetUserId];
  let cursorCondition = '';

  if (before) {
    params.push(before);
    cursorCondition = `AND created_at < $${params.length}`;
  }

  params.push(limit);

  const { rows } = await query(
    `SELECT m.*,
            s.name as sender_name,
            s.avatar_url as sender_avatar
     FROM messages m
     JOIN users s ON m.sender_id = s.id
     WHERE ((m.sender_id = $1 AND m.receiver_id = $2)
        OR  (m.sender_id = $2 AND m.receiver_id = $1))
       AND m.community_id IS NULL
       ${cursorCondition}
     ORDER BY m.created_at ASC
     LIMIT $${params.length}`,
    params
  );

  // Mark all unread incoming messages from this user as read
  await query(
    `UPDATE messages 
     SET is_read = TRUE 
     WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
    [targetUserId, currentUserId]
  );

  res.json({ messages: rows });
});

exports.getCommunityMessages = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const communityId = req.params.communityId;
  const limit = Math.min(100, parseInt(req.query.limit) || 50);

  // Check community membership or privacy
  const { rows: membership } = await query(
    `SELECT cm.role, c.is_private 
     FROM communities c
     LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = $1
     WHERE c.id = $2`,
    [currentUserId, communityId]
  );

  if (!membership.length) {
    return res.status(404).json({ error: 'Community not found' });
  }

  if (membership[0].is_private && !membership[0].role) {
    return res.status(403).json({ error: 'You must be a member to view private community messages' });
  }

  const { rows } = await query(
    `SELECT m.*,
            u.name as sender_name,
            u.avatar_url as sender_avatar,
            cm.role as sender_role
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     LEFT JOIN community_members cm ON cm.community_id = m.community_id AND cm.user_id = u.id
     WHERE m.community_id = $1
     ORDER BY m.created_at ASC
     LIMIT $2`,
    [communityId, limit]
  );

  res.json({ messages: rows });
});

exports.markDirectAsRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = req.params.userId;

  await query(
    `UPDATE messages 
     SET is_read = TRUE 
     WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
    [targetUserId, currentUserId]
  );

  res.json({ success: true });
});
