import { Router } from 'express'

const router = Router()

router.get('/sources', (req, res) => {
  res.json([
    { name: 'SPK Bültenleri', type: 'bulletin', url: 'https://spk.gov.tr/spk-bultenleri', status: 'ok', latestTitle: 'Son bülten', latestDate: new Date().toISOString() },
  ])
})

router.get('/updates', (req, res) => {
  res.json([])
})

export default router
