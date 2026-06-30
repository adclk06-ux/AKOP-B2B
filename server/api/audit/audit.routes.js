import { Router } from 'express'

const router = Router()

router.get('/logs', (req, res) => {
  res.json([])
})

router.post('/logs', (req, res) => {
  res.json({ success: true, id: 'log-1' })
})

export default router
