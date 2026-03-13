const express = require('express');
const router = express.Router();
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom, checkAvailability, getRoomTypes } = require('../controllers/roomController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/availability', checkAvailability);
router.get('/types', getRoomTypes);
router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/', authorize('admin', 'manager'), createRoom);
router.put('/:id', authorize('admin', 'manager', 'receptionist'), updateRoom);
router.delete('/:id', authorize('admin'), deleteRoom);

module.exports = router;
