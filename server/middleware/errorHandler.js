// server/middleware/errorHandler.js
// Global error handler

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message, req.method, req.path)
  const status = err.status || 500
  res.status(status).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
  })
}
