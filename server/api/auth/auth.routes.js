import { Router } from 'express'

const router = Router()

router.post('/login', (req, res) => {
  res.json({ success: true, message: 'Login placeholder' })
})

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout placeholder' })
})

router.get('/me', (req, res) => {
  res.json({ id: 'u-1', email: 'user@akop.local', name: 'Test User', role: 'ADMIN' })
})

export default router
