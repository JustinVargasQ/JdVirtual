const ProductReview = require('../models/ProductReview');
const Product       = require('../models/Product');

async function syncRating(productId) {
  const reviews = await ProductReview.find({ product: productId, approved: true });
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await Product.findByIdAndUpdate(productId, {
    rating:      Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  });
}

exports.getByProduct = async (req, res, next) => {
  try {
    const reviews = await ProductReview
      .find({ product: req.params.productId, approved: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-__v');
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { productId, authorName, rating, comment } = req.body;
    if (!productId || !authorName?.trim() || !rating) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    await ProductReview.create({
      product:    productId,
      authorName: authorName.trim(),
      rating:     Math.min(5, Math.max(1, Number(rating))),
      comment:    (comment || '').trim(),
    });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
};

exports.adminGetAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.approved !== undefined) filter.approved = req.query.approved === 'true';
    const reviews = await ProductReview.find(filter)
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.approve = async (req, res, next) => {
  try {
    const review = await ProductReview.findByIdAndUpdate(
      req.params.id, { approved: true }, { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Reseña no encontrada' });
    await syncRating(review.product);
    res.json(review);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const review = await ProductReview.findByIdAndDelete(req.params.id);
    if (review) await syncRating(review.product);
    res.json({ ok: true });
  } catch (err) { next(err); }
};
