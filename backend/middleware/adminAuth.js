/**
 * Middleware: verifies the admin secret sent in the x-admin-secret header.
 * This protects all admin routes — no account required, just the secret.
 */
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Forbidden. Invalid admin secret.' });
  }

  next();
};

module.exports = adminAuth;
