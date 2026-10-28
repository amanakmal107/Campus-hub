const express = require('express');
const router = express.Router();
const communitiesController = require('../controllers/communitiesController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.get('/', optionalAuth, communitiesController.listCommunities);
router.post('/', authenticate, uploadImage.fields([{ name: 'avatar', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), communitiesController.createCommunity);
router.get('/:id', optionalAuth, communitiesController.getCommunity);
router.put('/:id', authenticate, communitiesController.updateCommunity);
router.post('/:id/join', authenticate, communitiesController.joinCommunity);
router.delete('/:id/leave', authenticate, communitiesController.leaveCommunity);
router.get('/:id/members', communitiesController.getMembers);
router.get('/:id/posts', optionalAuth, communitiesController.getCommunityPosts);
router.delete('/:id/members/:userId', authenticate, communitiesController.removeMember);

module.exports = router;
