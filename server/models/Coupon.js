const { Schema, model } = require('mongoose');

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    type: {
      type: String,
      required: true,
      enum: ['percent', 'fixed', 'shipping'],
      default: 'percent',
    },
    // percent: 0-100 ; fixed: CRC ; shipping: ignored (0)
    value:       { type: Number, default: 0, min: 0 },
    description: { type: String, default: '', trim: true },
    minOrder:    { type: Number, default: 0, min: 0 },
    maxUses:     { type: Number, default: 0, min: 0 }, // 0 = ilimitado
    usedCount:   { type: Number, default: 0, min: 0 },
    isActive:    { type: Boolean, default: true },
    expiresAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

couponSchema.methods.isUsable = function (subtotal = 0) {
  if (!this.isActive) return { ok: false, reason: 'Cupón inactivo' };
  if (this.expiresAt && new Date() > this.expiresAt) return { ok: false, reason: 'Cupón vencido' };
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return { ok: false, reason: 'Cupón agotado' };
  if (this.minOrder > 0 && subtotal < this.minOrder) return { ok: false, reason: `Pedido mínimo de ₡${this.minOrder.toLocaleString('es-CR')}` };
  return { ok: true };
};

couponSchema.methods.computeDiscount = function (subtotal = 0, shippingCost = 0) {
  if (this.type === 'percent') return Math.round(subtotal * (Math.min(this.value, 100) / 100));
  if (this.type === 'fixed')   return Math.min(this.value, subtotal);
  if (this.type === 'shipping') return shippingCost;
  return 0;
};

module.exports = model('Coupon', couponSchema);
