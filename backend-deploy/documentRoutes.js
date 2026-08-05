import { Router } from 'express'
import { documentController } from '../controllers/documentController.js'
import { authenticate } from '../middleware/auth.js'
import { upload } from '../middleware/multer.js'

const router = Router()
router.use(authenticate)

router.post('/upload', upload.single('file'), documentController.upload)
router.get('/', documentController.list)
router.get('/:id', documentController.getById)
router.delete('/:id', documentController.remove)
router.post('/:id/version', upload.single('file'), documentController.addVersion)
router.get('/:id/versions', documentController.getVersions)

export default router
