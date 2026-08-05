import { prisma } from '../db.js'

export const auditController = {
  async list(req, res, next) {
    try {
      const { page = '1', limit = '50', action, userId } = req.query
      const skip = (parseInt(page) - 1) * parseInt(limit)
      const where = {}
      if (action) where.action = action
      if (userId) where.userId = userId

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: { user: { select: { name: true, email: true } } }
        }),
        prisma.auditLog.count({ where })
      ])

      res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
    } catch (err) { next(err) }
  }
}
