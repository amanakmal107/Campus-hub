const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, newsController.getNews);
router.post('/save', authenticate, newsController.saveArticle);
router.get('/saved', authenticate, newsController.getSavedArticles);
router.delete('/saved/:id', authenticate, newsController.deleteSavedArticle);

module.exports = router;
