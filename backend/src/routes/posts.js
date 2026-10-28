const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.get('/', optionalAuth, postsController.listPosts);
router.post('/', authenticate, uploadImage.single('image'), postsController.createPost);
router.get('/:id', optionalAuth, postsController.getPost);
router.put('/:id', authenticate, postsController.updatePost);
router.delete('/:id', authenticate, postsController.deletePost);
router.post('/:id/like', authenticate, postsController.toggleLike);
router.post('/:id/share', authenticate, postsController.sharePost);
router.get('/:id/comments', postsController.getComments);
router.post('/:id/comments', authenticate, postsController.addComment);
router.delete('/:id/comments/:commentId', authenticate, postsController.deleteComment);

module.exports = router;
