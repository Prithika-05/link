// src/realtime/socket.rate-limit.js

const attempts = new Map();

const MAX_ATTEMPTS = 30;

const WINDOW_MS = 60 * 1000;

export function allowConnection(ipAddress) {
  const now = Date.now();

  const previousAttempts =
    attempts.get(ipAddress) ?? [];

  const recentAttempts =
    previousAttempts.filter(
      (timestamp) => now - timestamp < WINDOW_MS
    );

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    attempts.set(ipAddress, recentAttempts);
    return false;
  }

  recentAttempts.push(now);

  attempts.set(ipAddress, recentAttempts);

  return true;
}

export function cleanupAttempts() {
  const now = Date.now();

  for (const [ipAddress, timestamps] of attempts) {
    const recentAttempts = timestamps.filter(
      (timestamp) => now - timestamp < WINDOW_MS
    );

    if (recentAttempts.length === 0) {
      attempts.delete(ipAddress);
    } else {
      attempts.set(ipAddress, recentAttempts);
    }
  }
}