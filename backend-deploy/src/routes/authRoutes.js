import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authenticate, authController.me)
router.get('/users', authenticate, authController.listUsers)
router.post('/seed', authController.seedDemoUsers)

export default router
