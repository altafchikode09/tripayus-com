import fs from 'fs'
import path from 'path'
import { prisma } from '../db.js'
import { classifyDocument, getFolderLabel } from '../utils/documentClassifier.js'
import { logAudit } from '../utils/auditLogger.js'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

export const documentController = {
  async upload(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

      const { dealId } = req.body
      if (!dealId) return res.status(400).json({ error: 'dealId required' })

      const deal = await prisma.deal.findUnique({ where: { id: dealId } })
      if (!deal) return res.status(404).json({ error: 'Deal not found' })

      const result = classifyDocument(req.file.originalname)

      const doc = await prisma.document.create({
        data: {
          name: req.file.originalname,
          originalName: req.file.originalname,
          size: formatBytes(req.file.size),
          mimeType: req.file.mimetype,
          path: req.file.path,
          status: 'complete',
          category: result.category,
          classification: result.classification,
          confidence: result.confidence,
          dealId: dealId || null,
          uploadedBy: req.user.id
        }
      })

      await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          name: req.file.originalname,
          size: formatBytes(req.file.size),
          path: req.file.path,
          createdBy: req.user.id
        }
      })

      const folderName = getFolderLabel(result.category)
      let folder = await prisma.folder.findUnique({
        where: { dealId_name: { dealId: dealId || null, name: folderName } }
      })
      if (!folder) {
        folder = await prisma.folder.create({
          data: { name: folderName, dealId: dealId || null, createdBy: req.user.id }
        })
      }
      await prisma.document.update({ where: { id: doc.id }, data: { folderId: folder.id } })

      await logAudit({ action: 'DOCUMENT_UPLOADED', entityType: 'Document', entityId: doc.id, metadata: { name: doc.name, category: result.category }, req })
      res.status(201).json(doc)
    } catch (err) { next(err) }
  },

  async list(req, res, next) {
    try {
      let { dealId, category } = req.query
    dealId = dealId || null
      const where = {}
      if (dealId) where.dealId = dealId
      if (category) where.category = category
      const docs = await prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 }, folder: true }
      })
      res.json(docs)
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const doc = await prisma.document.findUnique({
        where: { id: req.params.id },
        include: { versions: true, folder: true, deal: true }
      })
      if (!doc) return res.status(404).json({ error: 'Document not found' })
      res.json(doc)
    } catch (err) { next(err) }
  },

  async remove(req, res, next) {
    try {
      const doc = await prisma.document.findUnique({ where: { id: req.params.id } })
      if (!doc) return res.status(404).json({ error: 'Document not found' })

      if (doc.path && fs.existsSync(doc.path)) fs.unlinkSync(doc.path)
      const versions = await prisma.documentVersion.findMany({ where: { documentId: doc.id } })
      for (const v of versions) { if (v.path && fs.existsSync(v.path)) fs.unlinkSync(v.path) }

      await prisma.document.delete({ where: { id: req.params.id } })
      await logAudit({ action: 'DOCUMENT_DELETED', entityType: 'Document', entityId: req.params.id, req })
      res.json({ success: true })
    } catch (err) { next(err) }
  },

  async addVersion(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
      const doc = await prisma.document.findUnique({ where: { id: req.params.id } })
      if (!doc) return res.status(404).json({ error: 'Document not found' })

      const lastVer = await prisma.documentVersion.findFirst({
        where: { documentId: doc.id }, orderBy: { version: 'desc' }
      })
      const nextVer = (lastVer?.version || 0) + 1

      await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          version: nextVer,
          name: req.file.originalname,
          size: formatBytes(req.file.size),
          path: req.file.path,
          createdBy: req.user.id
        }
      })

      await prisma.document.update({
        where: { id: doc.id },
        data: { name: req.file.originalname, size: formatBytes(req.file.size), path: req.file.path, updatedAt: new Date() }
      })

      await logAudit({ action: 'DOCUMENT_VERSIONED', entityType: 'Document', entityId: doc.id, metadata: { version: nextVer }, req })
      res.json({ success: true, version: nextVer })
    } catch (err) { next(err) }
  },

  async getVersions(req, res, next) {
    try {
      const versions = await prisma.documentVersion.findMany({
        where: { documentId: req.params.id },
        orderBy: { version: 'desc' }
      })
      res.json(versions)
    } catch (err) { next(err) }
  }
}
