const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

const FAILED_ATTEMPTS = new Map(); // ip → { count, lockedUntil }
const MAX_ATTEMPTS    = 5;
const LOCK_MINUTES    = 15;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '8h',  // reducido de 7d a 8h
  });

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

exports.login = async (req, res, next) => {
  try {
    const ip = getClientIp(req);

    /* ── Brute-force lockout (en memoria; complementa el rate limiter) ── */
    const record = FAILED_ATTEMPTS.get(ip) || { count: 0, lockedUntil: null };
    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      const secsLeft = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      return res.status(429).json({
        error: `Cuenta temporalmente bloqueada. Intentá en ${secsLeft} segundos.`,
      });
    }

    /* ── Input validation ── */
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.length > 254) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!password || typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ error: 'Contraseña inválida' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(sanitizedEmail)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    /* ── Lookup + verify (timing-safe via bcrypt) ── */
    const admin = await Admin.findOne({ email: sanitizedEmail });
    const valid = admin && (await admin.comparePassword(password));

    if (!valid) {
      // Track failed attempt
      record.count++;
      if (record.count >= MAX_ATTEMPTS) {
        record.lockedUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        record.count = 0;
        FAILED_ATTEMPTS.set(ip, record);
        console.warn(`🔒 Login bloqueado para IP ${ip} por ${LOCK_MINUTES} min`);
        return res.status(429).json({
          error: `Demasiados intentos fallidos. Bloqueado por ${LOCK_MINUTES} minutos.`,
        });
      }
      FAILED_ATTEMPTS.set(ip, record);
      console.warn(`⚠️  Login fallido para "${sanitizedEmail}" desde ${ip} (intento ${record.count})`);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    /* ── Success: reset attempts ── */
    FAILED_ATTEMPTS.delete(ip);
    console.info(`✅ Login exitoso: ${sanitizedEmail} desde ${ip}`);

    res.json({
      token: signToken(admin._id),
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-passwordHash');
    if (!admin) return res.status(404).json({ error: 'Admin no encontrado' });
    res.json(admin);
  } catch (err) { next(err); }
};
