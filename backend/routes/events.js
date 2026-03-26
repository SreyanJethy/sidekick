const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createEvent, getEvents, joinEvent, getMyEvents } = require('../controllers/eventChatController');

router.get('/', protect, getEvents);
router.post('/', protect, createEvent);
router.post('/:id/join', protect, joinEvent);
router.get('/mine', protect, getMyEvents);

module.exports = router;
