// src/realtime/socket.rate-limit.js

const attempts = new Map();

const MAX_ATTEMPTS = 30;

const WINDOW_MS = 60 * 1000;

/**
 * Allow or reject a new connection attempt.
 *
 * @param {string} ipAddress
 * @returns {boolean}
 */
export function allowConnection(ipAddress) {
  const now = Date.now();

  const timestamps =
    attempts.get(ipAddress) ?? [];

  const recentAttempts =
    timestamps.filter(
      (timestamp) =>
        now - timestamp < WINDOW_MS
    );

  if (
    recentAttempts.length >=
    MAX_ATTEMPTS
  ) {
    attempts.set(
      ipAddress,
      recentAttempts
    );

    return false;
  }

  recentAttempts.push(now);

  attempts.set(
    ipAddress,
    recentAttempts
  );

  return true;
}

/**
 * Remove expired attempts.
 */
export function cleanupAttempts() {
  const now = Date.now();

  for (const [
    ipAddress,
    timestamps,
  ] of attempts) {
    const recentAttempts =
      timestamps.filter(
        (timestamp) =>
          now - timestamp <
          WINDOW_MS
      );

    if (recentAttempts.length === 0) {
      attempts.delete(ipAddress);
    } else {
      attempts.set(
        ipAddress,
        recentAttempts
      );
    }
  }
}

/**
 * Reset attempts for an IP.
 *
 * Useful for tests.
 */
export function resetAttempts(
  ipAddress
) {
  attempts.delete(ipAddress);
}

/**
 * Get current attempt count.
 *
 * Useful for monitoring/testing.
 */
export function getAttemptCount(
  ipAddress
) {
  return (
    attempts.get(ipAddress)?.length ??
    0
  );
}

/**
 * Automatically clean expired entries.
 */
let cleanupTimer = null;

export function startCleanup() {
  if (cleanupTimer) {
    return;
  }

  cleanupTimer = setInterval(
    cleanupAttempts,
    WINDOW_MS
  );

  cleanupTimer.unref?.();
}

/**
 * Stop cleanup timer.
 */
export function stopCleanup() {
  if (!cleanupTimer) {
    return;
  }

  clearInterval(cleanupTimer);

  cleanupTimer = null;
}