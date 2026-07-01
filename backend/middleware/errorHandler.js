/**
 * Global error handler — must be registered LAST with app.use().
 * Catches any error passed via next(err).
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error.';

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
