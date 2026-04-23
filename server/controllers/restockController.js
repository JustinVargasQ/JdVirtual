const RestockRequest = require('../models/RestockRequest');
const Product        = require('../models/Product');

exports.request = async (req, res, next) => {
  try {
    const { productId, phone } = req.body;
    if (!productId || !phone) return res.status(400).json({ error: 'Datos incompletos' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    await RestockRequest.findOneAndUpdate(
      { product: productId, phone },
      { product: productId, productName: product.name, phone, notified: false },
      { upsert: true, new: true }
    );
    await Product.findByIdAndUpdate(productId, { $inc: { restockRequests: 1 } });

    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.adminGetAll = async (req, res, next) => {
  try {
    const requests = await RestockRequest.find()
      .populate('product', 'name images stock')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) { next(err); }
};

exports.markNotified = async (req, res, next) => {
  try {
    const r = await RestockRequest.findByIdAndUpdate(
      req.params.id, { notified: true }, { new: true }
    );
    if (!r) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json(r);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await RestockRequest.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
};
