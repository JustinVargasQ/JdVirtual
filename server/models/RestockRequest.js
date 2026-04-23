const { Schema, model } = require('mongoose');

const restockSchema = new Schema(
  {
    product:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    phone:     { type: String, required: true },
    notified:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

restockSchema.index({ product: 1, phone: 1 }, { unique: true });

module.exports = model('RestockRequest', restockSchema);
