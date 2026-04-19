const { Schema, model } = require('mongoose');

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name:      String,
    brand:     String,
    price:     Number,
    qty:       Number,
    image:     String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },   // JD-2024-0001
    customer: {
      name:     { type: String, required: true },
      phone:    { type: String, required: true },
      province: { type: String, required: true },
      address:  { type: String, required: true },
      notes:    { type: String, default: '' },
    },
    items:         [orderItemSchema],
    subtotal:      { type: Number, required: true },
    shippingCost:  { type: Number, default: 0 },
    total:         { type: Number, required: true },
    shippingMethod:{ type: String, enum: ['correos', 'express', 'pickup'], default: 'correos' },
    status: {
      type: String,
      enum: ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'],
      default: 'pendiente',
    },
    whatsappSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    const year  = new Date().getFullYear();
    this.orderNumber = `JD-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });

module.exports = model('Order', orderSchema);
