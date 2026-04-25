function stripDangerousKeys(obj) {
  if (Array.isArray(obj)) return obj.map(stripDangerousKeys);
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof k === 'string' && (k.startsWith('$') || k.includes('.'))) continue;
      clean[k] = stripDangerousKeys(v);
    }
    return clean;
  }
  return obj;
}

function hasDangerousKeys(obj) {
  if (obj === null || typeof obj !== 'object') return false;
  for (const k of Object.keys(obj)) {
    if (typeof k === 'string' && (k.startsWith('$') || k.includes('.'))) return true;
    if (hasDangerousKeys(obj[k])) return true;
  }
  return false;
}

module.exports = function mongoSanitize(req, res, next) {
  // req.body es writable — limpiar las claves peligrosas
  if (req.body && typeof req.body === 'object') {
    req.body = stripDangerousKeys(req.body);
  }
  // req.query y req.params son read-only en Express 5 — rechazar si contienen
  // operadores NoSQL ($, .) en lugar de intentar modificarlos
  if (hasDangerousKeys(req.query) || hasDangerousKeys(req.params)) {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }
  next();
};
