require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const orderRoutes    = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const reviewsRoutes  = require('./routes/reviews');
const couponsRoutes  = require('./routes/coupons');
const restockRoutes       = require('./routes/restock');
const productReviewRoutes = require('./routes/productReviews');
const errorHandler        = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 4000;

/* ── Middleware ── */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    // Allow any vercel.app subdomain + explicit allowed origins
    if (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS bloqueado: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ── Routes ── */
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews',  reviewsRoutes);
app.use('/api/coupons',  couponsRoutes);
app.use('/api/restock',         restockRoutes);
app.use('/api/product-reviews', productReviewRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

/* ── SSE — real-time admin events ── */
const jwt = require('jsonwebtoken');
const { addClient } = require('./lib/sse');
app.get('/api/events', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  try { jwt.verify(token, process.env.JWT_SECRET); } catch { return res.status(401).end(); }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('event: connected\ndata: {}\n\n');
  addClient(res);
});

/* ── 404 ── */
app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.path}` }));

/* ── Error handler ── */
app.use(errorHandler);

/* ── DB + Server ── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Error al conectar MongoDB:', err.message);
    process.exit(1);
  });
