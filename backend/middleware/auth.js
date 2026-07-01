const jwt = require('jsonwebtoken');

/**
 * Middleware: verifies the team JWT sent in the Authorization header.
 * Attaches req.team = { teamId, teamName } on success.
 */
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.team = { teamId: decoded.teamId, teamName: decoded.teamName };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = auth;
