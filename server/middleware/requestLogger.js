// server/middleware/requestLogger.js
// Request/response logger

export function requestLogger(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })
  next()
}
