const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.get('/unread-count', chatController.getUnreadCount);
router.get('/messages/:userId', chatController.getDirectMessages);
router.get('/community/:communityId', chatController.getCommunityMessages);
router.post('/messages/:userId/read', chatController.markDirectAsRead);

module.exports = router;
