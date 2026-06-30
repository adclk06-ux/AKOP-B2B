// server/security/ipWhitelist.js
// IP whitelist middleware

const WHITELIST = (process.env.IP_WHITELIST || '').split(',').map((s) => s.trim()).filter(Boolean)

export function ipWhitelistMiddleware(req, res, next) {
  if (WHITELIST.length === 0) return next()

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress
  if (!WHITELIST.includes(clientIp)) {
    return res.status(403).json({ error: 'IP not whitelisted' })
  }
  next()
}
