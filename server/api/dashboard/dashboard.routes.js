import { Router } from 'express'

const router = Router()

router.get('/metrics', (req, res) => {
  res.json([
    { id: 'm1', label: 'Toplam İşlem', value: 1240, change: 3.2, trend: 'up' },
    { id: 'm2', label: 'Mutabakat Oranı', value: '98.4%', change: 0.5, trend: 'up' },
    { id: 'm3', label: 'Açık Risk', value: 3, change: -1, trend: 'down' },
  ])
})

router.get('/layout', (req, res) => {
  res.json({ widgets: [], columns: 3 })
})

router.post('/layout', (req, res) => {
  res.json({ success: true })
})

export default router
