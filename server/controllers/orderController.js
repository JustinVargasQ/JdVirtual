const Order = require('../models/Order');

/* ---------- Public ---------- */

exports.create = async (req, res, next) => {
  try {
    const { customer, items, subtotal, shippingCost = 0, shippingMethod = 'correos' } = req.body;

    if (!customer || !items?.length) {
      return res.status(400).json({ error: 'Datos del pedido incompletos' });
    }

    const order = await Order.create({
      customer,
      items,
      subtotal,
      shippingCost,
      total: subtotal + shippingCost,
      shippingMethod,
      whatsappSent: true,
    });

    res.status(201).json({ orderNumber: order.orderNumber, id: order._id });
  } catch (err) { next(err); }
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
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

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

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(order);
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
