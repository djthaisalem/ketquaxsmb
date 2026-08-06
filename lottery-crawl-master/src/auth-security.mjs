const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 7;

const keyFor = (scope, req) => `${scope}:${req.ip}`;

export function allowLoginAttempt(scope, req, res) {
  const key = keyFor(scope, req);
  const record = attempts.get(key);
  if (!record || record.until <= Date.now()) return true;
  if (record.count < MAX_ATTEMPTS) return true;
  res.status(429).json({ error: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút.' });
  return false;
}

export function recordLoginFailure(scope, req) {
  const key = keyFor(scope, req);
  const previous = attempts.get(key);
  const until = previous?.until > Date.now() ? previous.until : Date.now() + WINDOW_MS;
  attempts.set(key, { count: (previous?.until > Date.now() ? previous.count : 0) + 1, until });
}

export function clearLoginFailures(scope, req) {
  attempts.delete(keyFor(scope, req));
}
