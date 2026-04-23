const Product = require('../models/Product');
const Order   = require('../models/Order');

/* ---------- Public ---------- */

exports.getAll = async (req, res, next) => {
  try {
    const { cat, brand, q, featured, limit = 50, page = 1 } = req.query;
    const filter = { isActive: true };

    if (cat && cat !== 'todos') filter.category = cat;
    if (brand) filter.brand = brand;
    if (featured === 'true') filter.badge = { $ne: '' };
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const cats = await Product.distinct('category', { isActive: true });
    res.json(['todos', ...cats.sort()]);
  } catch (err) { next(err); }
};

exports.topSellers = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 4, 12);
    const since = new Date();
    since.setDate(since.getDate() - 60); // last 60 days

    const rows = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelado' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', units: { $sum: '$items.qty' } } },
      { $sort: { units: -1 } },
      { $limit: limit * 2 }, // fetch extra in case some are inactive
    ]);

    const ids = rows.map((r) => r._id).filter(Boolean);
    const products = await Product.find({ _id: { $in: ids }, isActive: true }).limit(limit);

    // Sort by order of top-sellers ranking
    const sorted = ids
      .map((id) => products.find((p) => String(p._id) === String(id)))
      .filter(Boolean)
      .slice(0, limit);

    // Fallback: if not enough orders yet, fill with badge products
    if (sorted.length < limit) {
      const fallback = await Product.find({
        isActive: true,
        badge: { $nin: ['', null] },
        _id: { $nin: sorted.map((p) => p._id) },
      }).limit(limit - sorted.length);
      sorted.push(...fallback);
    }

    res.json({ products: sorted });
  } catch (err) { next(err); }
};

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json(brands.sort());
  } catch (err) { next(err); }
};

/* ---------- Admin ---------- */

exports.adminGetAll = async (req, res, next) => {
  try {
    const { q, cat, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (cat && cat !== 'todos') filter.category = cat;
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);
    res.json({ products, total });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) { next(err); }
};

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No se recibieron imágenes' });
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: urls } } },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ urls, product });
  } catch (err) { next(err); }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    product.isActive = !product.isActive;
    await product.save();
    res.json(product);
  } catch (err) { next(err); }
};
