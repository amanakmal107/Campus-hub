const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('./db');

let io;
const onlineUsers = new Map(); // userId -> socketId

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${userId}`);

    // Track online status
    onlineUsers.set(userId, socket.id);
    await query('UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE id = $1', [userId]);
    io.emit('user:online', { userId });

    // Join community rooms the user belongs to
    socket.on('join:communities', async () => {
      const { rows } = await query(
        'SELECT community_id FROM community_members WHERE user_id = $1',
        [userId]
      );
      rows.forEach(r => socket.join(`community:${r.community_id}`));
    });

    // DM message
    socket.on('message:send', async (data) => {
      const { receiverId, content } = data;
      if (!content?.trim()) return;

      try {
        const { rows } = await query(
          `INSERT INTO messages (sender_id, receiver_id, content) 
           VALUES ($1, $2, $3) RETURNING *`,
          [userId, receiverId, content.trim()]
        );
        const message = rows[0];

        // Enrich with sender info
        const { rows: users } = await query(
          'SELECT id, name, avatar_url FROM users WHERE id = $1',
          [userId]
        );
        const enriched = { ...message, sender: users[0] };

        // Send to both participants
        socket.emit('message:new', enriched);
        const receiverSocket = onlineUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit('message:new', enriched);
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Community group message
    socket.on('community:message', async (data) => {
      const { communityId, content } = data;
      if (!content?.trim()) return;

      try {
        // Verify membership
        const { rows: membership } = await query(
          'SELECT 1 FROM community_members WHERE community_id = $1 AND user_id = $2',
          [communityId, userId]
        );
        if (!membership.length) return socket.emit('error', { message: 'Not a member' });

        const { rows } = await query(
          `INSERT INTO messages (sender_id, community_id, content) 
           VALUES ($1, $2, $3) RETURNING *`,
          [userId, communityId, content.trim()]
        );
        const { rows: users } = await query(
          'SELECT id, name, avatar_url FROM users WHERE id = $1',
          [userId]
        );
        const enriched = { ...rows[0], sender: users[0] };

        io.to(`community:${communityId}`).emit('community:message', enriched);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data) => {
      const { receiverId } = data;
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('typing:start', { userId });
      }
    });

    socket.on('typing:stop', (data) => {
      const { receiverId } = data;
      const receiverSocket = onlineUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('typing:stop', { userId });
      }
    });

    // Mark messages as read
    socket.on('messages:read', async (data) => {
      const { senderId } = data;
      await query(
        `UPDATE messages SET is_read = TRUE 
         WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
        [senderId, userId]
      );
      const senderSocket = onlineUsers.get(senderId);
      if (senderSocket) {
        io.to(senderSocket).emit('messages:read', { by: userId });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${userId}`);
      onlineUsers.delete(userId);
      await query(
        'UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = $1',
        [userId]
      );
      io.emit('user:offline', { userId });
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO, onlineUsers };
