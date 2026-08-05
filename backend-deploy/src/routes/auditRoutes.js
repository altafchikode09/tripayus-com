import { Router } from 'express'
import { auditController } from '../controllers/auditController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.get('/', auditController.list)

export default router
