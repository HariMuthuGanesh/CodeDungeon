const express = require('express');
const { body } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const {
  createTeam,
  getAllTeams,
  getAllSubmissions,
  acceptSubmission,
  rejectSubmission,
  createRoom,
  updateRoom,
  getAdminLeaderboard,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes are protected by the admin secret header
router.use(adminAuth);

// ─── Teams ──────────────────────────────────────────────────────────────────
// POST /api/admin/teams
router.post(
  '/teams',
  [
    body('teamName').trim().notEmpty().withMessage('teamName is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('members').optional().isArray().withMessage('members must be an array of strings.'),
  ],
  createTeam
);

// GET /api/admin/teams
router.get('/teams', getAllTeams);

// ─── Submissions ─────────────────────────────────────────────────────────────
// GET /api/admin/submissions?status=pending|accepted|rejected
router.get('/submissions', getAllSubmissions);

// PATCH /api/admin/submissions/:id/accept
router.patch('/submissions/:id/accept', acceptSubmission);

// PATCH /api/admin/submissions/:id/reject
router.patch('/submissions/:id/reject', rejectSubmission);

// ─── Rooms ────────────────────────────────────────────────────────────────────
// POST /api/admin/rooms
router.post(
  '/rooms',
  [
    body('room_order').isInt({ min: 1 }).withMessage('room_order must be a positive integer.'),
    body('title').trim().notEmpty().withMessage('title is required.'),
    body('topic').trim().notEmpty().withMessage('topic is required.'),
    body('difficulty').isIn(['easy', 'medium', 'hard', 'boss']).withMessage('difficulty must be easy|medium|hard|boss.'),
    body('points').isInt({ min: 0 }).withMessage('points must be a non-negative integer.'),
    body('problem_statement').optional().isString(),
  ],
  createRoom
);

// PATCH /api/admin/rooms/:id
router.patch('/rooms/:id', updateRoom);

// ─── Leaderboard ──────────────────────────────────────────────────────────────
// GET /api/admin/leaderboard
router.get('/leaderboard', getAdminLeaderboard);

module.exports = router;
