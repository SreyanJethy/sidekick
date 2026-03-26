const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getChatHistory, getMyRooms } = require('../controllers/eventChatController');

router.get('/rooms', protect, getMyRooms);
router.get('/:roomId', protect, getChatHistory);

module.exports = router;
