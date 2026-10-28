const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.get('/', booksController.listBooks);
router.post('/', authenticate, uploadImage.array('photos', 5), booksController.createBook);
router.get('/:id', booksController.getBook);
router.put('/:id', authenticate, booksController.updateBook);
router.delete('/:id', authenticate, booksController.deleteBook);
router.post('/:id/request', authenticate, booksController.requestBook);
router.put('/:id/request/:reqId', authenticate, booksController.handleRequest);

module.exports = router;
