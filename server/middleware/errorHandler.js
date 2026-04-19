module.exports = function errorHandler(err, req, res, next) {
  const status  = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  if (process.env.NODE_ENV !== 'production') console.error(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({ error: `Ya existe un registro con ese ${field}` });
  }
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ error: errors.join(', ') });
  }

  res.status(status).json({ error: message });
};
