const express = require('express');
const { getAllRooms, getRoomById } = require('../controllers/roomsController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms  (protected)
router.get('/', auth, getAllRooms);

// GET /api/rooms/:id  (protected)
router.get('/:id', auth, getRoomById);

module.exports = router;
