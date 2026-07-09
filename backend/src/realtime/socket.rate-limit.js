const attempts = new Map();

export function allowConnection(ip) {
  const now = Date.now();

  const minute = 60 * 1000;

  const current = attempts.get(ip) || [];

  const recent = current.filter(
    (time) => now - time < minute
  );

  if (recent.length >= 30) {
    return false;
  }

  recent.push(now);

  attempts.set(ip, recent);

  return true;
}