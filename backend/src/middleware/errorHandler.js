function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
}
module.exports = { errorHandler };
