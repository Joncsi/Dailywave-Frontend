const express = require('express');
const authenticateToken = require('../middleware/jwtAuth');
const upload = require('../middleware/multer');
const { getAlltopics, getComments, addComment, uploadTopic } = require('../controllers/topicControllers');

const router = express.Router();

router.get('/getAlltopics', authenticateToken, getAlltopics);
router.post('/uploadTopic', authenticateToken, upload.single('topic'), uploadTopic);
router.get('/getComments/:topicId', authenticateToken, getComments);
router.post('/addComment', authenticateToken, addComment);

module.exports = router;