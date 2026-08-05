import { prisma } from '../db.js'

export async function logAudit({ action, entityType, entityId, metadata, req }) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata || {},
        ipAddress: req?.ip || req?.socket?.remoteAddress || null,
        userAgent: req?.headers?.['user-agent'] || null,
        userId: req?.user?.id || null
      }
    })
  } catch (e) {
    console.error('Audit log failed:', e.message)
  }
}
