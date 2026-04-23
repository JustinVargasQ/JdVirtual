const Order    = require('../models/Order');
const Coupon   = require('../models/Coupon');
const Product  = require('../models/Product');
const Settings = require('../models/Settings');
const { broadcast } = require('../lib/sse');
const { sendOrderNotification, sendCustomerConfirmation, sendCustomerStatusUpdate } = require('../lib/mailer');

/* ---------- Public ---------- */

exports.create = async (req, res, next) => {
  try {
    const {
      customer,
      items,
      subtotal,
      shippingCost: rawShippingCost = 0,
      shippingMethod = 'correos',
      coupon: couponData = null,
    } = req.body;

    if (!customer || !items?.length) {
      return res.status(400).json({ error: 'Datos del pedido incompletos' });
    }

    const settings       = await Settings.findOne({ key: 'main' });
    const autoConfirm    = settings?.autoConfirmOrders !== false; // default true
    const initialStatus  = autoConfirm ? 'confirmado' : 'pendiente';

    // Re-validate coupon server-side — never trust client-sent discount.
    // Atomically claim one use if maxUses has free slots.
    let discount     = 0;
    let freeShipping = false;
    let appliedCode  = null;

    if (couponData?.code) {
      const code = String(couponData.code).toUpperCase();
      const claimed = await Coupon.findOneAndUpdate(
        {
          code,
          isActive: true,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          $expr: {
            $or: [
              { $eq: ['$maxUses', 0] },
              { $lt: ['$usedCount', '$maxUses'] },
            ],
          },
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (claimed && subtotal >= (claimed.minOrder || 0)) {
        discount     = claimed.computeDiscount(subtotal, rawShippingCost);
        freeShipping = claimed.type === 'shipping';
        appliedCode  = claimed.code;
      } else if (claimed) {
        // Claimed a use but subtotal below minOrder — refund the use.
        await Coupon.updateOne({ _id: claimed._id }, { $inc: { usedCount: -1 } });
      }
    }

    const shippingCost = freeShipping ? 0 : rawShippingCost;
    const total        = Math.max(0, subtotal - discount) + shippingCost;

    const order = await Order.create({
      customer,
      items,
      subtotal,
      discount,
      coupon: appliedCode
        ? { code: appliedCode, discount, freeShipping }
        : undefined,
      shippingCost,
      total,
      shippingMethod,
      status:       initialStatus,
      whatsappSent: true,
    });

    // Decrement stock for each item (only if stock is tracked, never below 0)
    await Promise.all(
      items.map((item) =>
        item.productId
          ? Product.findOneAndUpdate(
              { _id: item.productId, stock: { $gt: 0 } },
              { $inc: { stock: -Math.abs(item.qty) } }
            )
          : null
      )
    );

    broadcast('new-order', { orderNumber: order.orderNumber, customer: customer.name });

    // Emails sin bloquear la respuesta
    Settings.findOne({ key: 'main' })
      .then((s) => { if (s?.notificationEmail) sendOrderNotification(order, s.notificationEmail); })
      .catch(() => {});

    sendCustomerConfirmation(order).catch(() => {});

    res.status(201).json({ orderNumber: order.orderNumber, id: order._id });
  } catch (err) {
    console.error('❌ create order error:', err.name, err.message, JSON.stringify(err.errors || ''));
    next(err);
  }
};

exports.getByNumber = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.number });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ orderNumber: order.orderNumber, status: order.status, total: order.total, createdAt: order.createdAt });
  } catch (err) { next(err); }
};

/* ---------- Admin ---------- */

exports.adminGetAll = async (req, res, next) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { orderNumber: rx },
        { 'customer.name': rx },
        { 'customer.phone': rx },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.adminGetOne = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Estado inválido' });

    const before = await Order.findById(req.params.id);
    if (!before) return res.status(404).json({ error: 'Pedido no encontrado' });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // Refund coupon usage if cancelling; re-consume if un-cancelling.
    if (before.coupon?.code && before.status !== status) {
      if (status === 'cancelado' && before.status !== 'cancelado') {
        await Coupon.updateOne(
          { code: before.coupon.code, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } }
        );
      } else if (before.status === 'cancelado' && status !== 'cancelado') {
        await Coupon.updateOne(
          { code: before.coupon.code },
          { $inc: { usedCount: 1 } }
        );
      }
    }

    sendCustomerStatusUpdate(order, status).catch(() => {});

    res.json(order);
  } catch (err) { next(err); }
};

exports.chart = async (req, res, next) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Build array of last 14 days so we can compare this week vs prev week
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      return d;
    });

    const from = days[0];
    const to   = new Date(today); to.setDate(to.getDate() + 1);

    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lt: to }, status: { $ne: 'cancelado' } } },
      {
        $group: {
          _id:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '-06:00' } },
          revenue:  { $sum: '$total' },
          orders:   { $sum: 1 },
        },
      },
    ]);

    const map = Object.fromEntries(rows.map((r) => [r._id, { revenue: r.revenue, orders: r.orders }]));

    const result = days.map((d) => {
      const key = d.toISOString().slice(0, 10);
      return { date: key, revenue: map[key]?.revenue || 0, orders: map[key]?.orders || 0 };
    });

    res.json(result);
  } catch (err) { next(err); }
};

exports.topProducts = async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelado' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id:      '$items.name',
          units:    { $sum: '$items.qty' },
          revenue:  { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 5 },
    ]);

    res.json(rows.map((r) => ({ name: r._id, units: r.units, revenue: r.revenue })));
  } catch (err) { next(err); }
};

exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    const allowed = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];
    if (!allowed.includes(status) || !Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    const result = await Order.updateMany({ _id: { $in: ids } }, { status });
    res.json({ updated: result.modifiedCount });
  } catch (err) { next(err); }
};

exports.updateNotes = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { internalNotes: req.body.notes ?? '' },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ internalNotes: order.internalNotes });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const [totalOrders, todayOrders, weekRevenue, statusCounts] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart }, status: { $ne: 'cancelado' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({
      totalOrders,
      todayOrders,
      weekRevenue: weekRevenue[0]?.total || 0,
      statusCounts: Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count])),
    });
  } catch (err) { next(err); }
};
