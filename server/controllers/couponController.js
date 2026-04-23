const Coupon = require('../models/Coupon');
const Order  = require('../models/Order');

const normalize = (code) => String(code || '').trim().toUpperCase();

/* ---------- Public ---------- */

exports.validate = async (req, res, next) => {
  try {
    const code         = normalize(req.body.code);
    const subtotal     = Number(req.body.subtotal) || 0;
    const shippingCost = Number(req.body.shippingCost) || 0;

    if (!code) return res.status(400).json({ error: 'Código requerido' });

    const coupon = await Coupon.findOne({ code });
    if (!coupon) return res.status(404).json({ error: 'Cupón no encontrado' });

    const { ok, reason } = coupon.isUsable(subtotal);
    if (!ok) return res.status(400).json({ error: reason });

    const discount = coupon.computeDiscount(subtotal, shippingCost);

    res.json({
      code:        coupon.code,
      type:        coupon.type,
      value:       coupon.value,
      description: coupon.description,
      discount,
      freeShipping: coupon.type === 'shipping',
    });
  } catch (err) { next(err); }
};

/* ---------- Admin ---------- */

exports.adminGetAll = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ coupons });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const body = { ...req.body, code: normalize(req.body.code) };
    const coupon = await Coupon.create(body);
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe un cupón con ese código' });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.code) body.code = normalize(body.code);
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ error: 'Cupón no encontrado' });
    res.json(coupon);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe un cupón con ese código' });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Cupón no encontrado' });
    res.json({ message: 'Cupón eliminado' });
  } catch (err) { next(err); }
};

exports.getUses = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Cupón no encontrado' });

    const orders = await Order.find({ 'coupon.code': coupon.code })
      .select('orderNumber customer.name customer.phone coupon subtotal discount shippingCost total createdAt status')
      .sort({ createdAt: -1 });

    res.json({ code: coupon.code, orders });
  } catch (err) { next(err); }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Cupón no encontrado' });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (err) { next(err); }
};
