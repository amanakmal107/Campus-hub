const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.get('/:id', userController.getProfile);
router.put('/:id', authenticate, userController.updateProfile);
router.post('/:id/avatar', authenticate, uploadImage.single('avatar'), userController.uploadAvatar);
router.get('/:id/posts', userController.getUserPosts);
router.get('/:id/notes', userController.getUserNotes);
router.get('/:id/books', userController.getUserBooks);

module.exports = router;
