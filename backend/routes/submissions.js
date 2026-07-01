const express = require('express');
const { body } = require('express-validator');
const { createSubmission, getMySubmissions } = require('../controllers/submissionsController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/submissions  (protected)
router.post(
  '/',
  auth,
  [
    body('roomId').notEmpty().isUUID().withMessage('A valid room ID is required.'),
  ],
  createSubmission
);

// GET /api/submissions/mine  (protected)
router.get('/mine', auth, getMySubmissions);

module.exports = router;
