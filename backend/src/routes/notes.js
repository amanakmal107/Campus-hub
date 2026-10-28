const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadNotes } = require('../middleware/upload');

router.get('/top/week', notesController.topThisWeek);
router.get('/', optionalAuth, notesController.listNotes);
router.post('/', authenticate, uploadNotes.single('file'), notesController.uploadNote);
router.get('/:id', optionalAuth, notesController.getNote);
router.delete('/:id', authenticate, notesController.deleteNote);
router.post('/:id/like', authenticate, notesController.toggleLike);
router.post('/:id/bookmark', authenticate, notesController.toggleBookmark);
router.get('/:id/comments', notesController.getComments);
router.post('/:id/comments', authenticate, notesController.addComment);
router.delete('/:id/comments/:commentId', authenticate, notesController.deleteComment);
router.post('/:id/download', optionalAuth, notesController.incrementDownload);

module.exports = router;
