const jwt          = require('jsonwebtoken');
const Admin        = require('../models/Admin');
const SecurityLog  = require('../models/SecurityLog');
const LoginAttempt = require('../models/LoginAttempt');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function logEvent(type, ip, email) {
  SecurityLog.create({ type, ip, email }).catch(() => {});
}

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '8h',
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

    /* ── Brute-force lockout persistente en MongoDB ── */
    const attempt = await LoginAttempt.findOne({ ip });

    if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
      const secsLeft = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    /* ── Lookup + verify (timing-safe via bcrypt) ── */
    const admin = await Admin.findOne({ email: sanitizedEmail });
    const valid = admin && (await admin.comparePassword(password));

    if (!valid) {
      const newCount = (attempt?.count || 0) + 1;
      const isBlocked = newCount >= MAX_ATTEMPTS;
      const lockedUntil = isBlocked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null;

      await LoginAttempt.findOneAndUpdate(
        { ip },
        { count: isBlocked ? 0 : newCount, lockedUntil, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      if (isBlocked) {
        console.warn(`🔒 Login bloqueado para IP ${ip} por ${LOCK_MINUTES} min`);
        logEvent('login_blocked', ip, sanitizedEmail);
        return res.status(429).json({
          error: `Demasiados intentos fallidos. Bloqueado por ${LOCK_MINUTES} minutos.`,
        });
      }

      console.warn(`⚠️  Login fallido para "${sanitizedEmail}" desde ${ip} (intento ${newCount})`);
      logEvent('login_fail', ip, sanitizedEmail);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    /* ── Success: limpiar intentos fallidos ── */
    await LoginAttempt.deleteOne({ ip }).catch(() => {});
    console.info(`✅ Login exitoso: ${sanitizedEmail} desde ${ip}`);
    logEvent('login_ok', ip, sanitizedEmail);

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
