const { Schema, model } = require('mongoose');

const loginAttemptSchema = new Schema({
  ip:          { type: String, required: true, unique: true },
  count:       { type: Number, default: 0 },
  lockedUntil: { type: Date,   default: null },
  updatedAt:   { type: Date,   default: Date.now },
});

// Auto-eliminar registros inactivos después de 24h
loginAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

module.exports = model('LoginAttempt', loginAttemptSchema);
