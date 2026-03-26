const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateProfile, getProfile, blockUser, reportUser } = require('../controllers/userController');

router.put('/profile', protect, updateProfile);
router.get('/:id', protect, getProfile);
router.post('/block', protect, blockUser);
router.post('/report', protect, reportUser);

module.exports = router;
