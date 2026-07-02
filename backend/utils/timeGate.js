/**
 * Server-side time gate utility for Round 2.
 * Tracks active and grace period windows.
 */

const TIME_GATE_ENABLED = process.env.TIME_GATE_ENABLED === 'true';

/**
 * Returns true if the time gate is enabled and the current server time
 * falls outside the 3:45 PM – 5:15 PM window.
 */
const isClosed = () => {
  if (!TIME_GATE_ENABLED) return false;

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour * 60 + minute; // minutes from midnight

  const startVal = 15 * 60 + 45; // 15:45 (3:45 PM)
  const endVal = 17 * 60 + 15;   // 17:15 (5:15 PM)

  return timeVal < startVal || timeVal > endVal;
};

/**
 * Returns true if the time gate is enabled and the current server time
 * falls inside the 5:00 PM – 5:15 PM buffer period.
 */
const isGracePeriod = () => {
  if (!TIME_GATE_ENABLED) return false;

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour * 60 + minute;

  const graceStartVal = 17 * 60 + 0;  // 17:00 (5:00 PM)
  const graceEndVal = 17 * 60 + 15;    // 17:15 (5:15 PM)

  return timeVal >= graceStartVal && timeVal <= graceEndVal;
};

module.exports = {
  isClosed,
  isGracePeriod,
  TIME_GATE_ENABLED
};
