// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, register, changePassword, getMe } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', authenticate, authorize('admin'), register);
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getMe);

module.exports = router;
