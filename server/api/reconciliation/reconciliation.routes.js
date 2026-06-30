import { Router } from 'express'

const router = Router()

router.get('/runs', (req, res) => {
  res.json([])
})

router.post('/start', (req, res) => {
  res.json({ id: 'run-1', name: 'Mutabakat', status: 'running', matchedCount: 0, unmatchedCount: 0, totalCount: 0, startedAt: new Date().toISOString() })
})

router.get('/runs/:runId/result', (req, res) => {
  res.json({ runId: req.params.runId, records: [] })
})

export default router
