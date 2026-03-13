// routes/guests.js
const express = require('express');
const router = express.Router();
const { getGuests, getGuest, createGuest, updateGuest } = require('../controllers/guestController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
router.get('/', getGuests);
router.get('/:id', getGuest);
router.post('/', createGuest);
router.put('/:id', updateGuest);
module.exports = router;
