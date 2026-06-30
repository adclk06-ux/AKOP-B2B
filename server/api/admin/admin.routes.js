import { Router } from 'express'

const router = Router()

router.get('/users', (req, res) => {
  res.json([])
})

router.patch('/users/:id/role', (req, res) => {
  res.json({ success: true })
})

router.get('/system-health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() })
})

export default router
