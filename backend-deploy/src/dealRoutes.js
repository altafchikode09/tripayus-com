import { Router } from 'express'
import { dealController } from '../controllers/dealController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

router.post('/', dealController.create)
router.get('/', dealController.list)
router.get('/:id', dealController.getById)
router.put('/:id', dealController.update)
router.delete('/:id', dealController.remove)
router.post('/:id/calculate', dealController.calculate)
router.get('/:id/scenarios', dealController.scenarios)
router.get('/:id/sensitivity', dealController.sensitivity)
router.get('/:id/forecast', dealController.forecast)

export default router
