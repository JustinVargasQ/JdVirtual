const { Schema, model } = require('mongoose');

const securityLogSchema = new Schema(
  {
    type:  {
      type: String,
      enum: ['login_fail', 'login_blocked', 'login_ok'],
      required: true,
    },
    ip:    { type: String, required: true },
    email: { type: String },
  },
  {
    timestamps: true,
    // Auto-eliminar registros después de 30 días para no inflar la DB
    expireAfterSeconds: 30 * 24 * 60 * 60,
  }
);

// TTL index sobre createdAt
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = model('SecurityLog', securityLogSchema);
