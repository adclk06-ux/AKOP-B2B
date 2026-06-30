import { Router } from 'express'

const router = Router()

router.post('/query', (req, res) => {
  res.json({ id: 'msg-1', role: 'assistant', content: 'Placeholder cevap.', timestamp: new Date().toISOString() })
})

router.get('/sessions/:sessionId/history', (req, res) => {
  res.json([])
})

export default router
