/**
 * Sanitizador NoSQL compatible con Express 5.
 * Express 5 hace req.query read-only, así que los paquetes como
 * express-mongo-sanitize y hpp no funcionan. Este middleware solo
 * sanitiza req.body (que sí es writable) eliminando claves que
 * empiecen con $ o contengan puntos — los vectores de inyección NoSQL.
 */

function stripDangerousKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripDangerousKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof k === 'string' && (k.startsWith('$') || k.includes('.'))) {
        // Eliminar la clave silenciosamente
        continue;
      }
      clean[k] = stripDangerousKeys(v);
    }
    return clean;
  }
  return obj;
}

module.exports = function mongoSanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = stripDangerousKeys(req.body);
  }
  // req.query es read-only en Express 5 — no intentamos modificarlo.
  // Las queries de Mongoose usan parámetros tipados, por lo que el
  // riesgo de inyección vía querystring es mínimo.
  next();
};
