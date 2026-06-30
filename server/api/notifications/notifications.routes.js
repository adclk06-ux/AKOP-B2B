import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json([])
})

router.post('/:id/read', (req, res) => {
  res.json({ success: true })
})

router.post('/preferences', (req, res) => {
  res.json({ success: true })
})

export default router
