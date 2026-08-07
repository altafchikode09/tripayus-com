import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db.js'
import { logAudit } from '../utils/auditLogger.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, name, role = 'analyst' } = req.body
      const exists = await prisma.user.findUnique({ where: { email } })
      if (exists) return res.status(400).json({ error: 'Email already registered' })

      const hash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { email, password: hash, name, role },
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      })

      await logAudit({ action: 'USER_REGISTERED', entityType: 'User', entityId: user.id, req })
      res.status(201).json({ user, token: signToken(user.id) })
    } catch (err) { next(err) }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) return res.status(401).json({ error: 'Invalid credentials' })

      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

      await logAudit({ action: 'USER_LOGIN', entityType: 'User', entityId: user.id, req })
      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token: signToken(user.id)
      })
    } catch (err) { next(err) }
  },

  async me(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, name: true, role: true, organizationId: true }
      })
      res.json(user)
    } catch (err) { next(err) }
  },

  async listUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      })
      res.json(users)
    } catch (err) { next(err) }
  },

  async seedDemoUsers(req, res, next) {
    try {
      const demos = [

        { email: 'sarah@tripay.ai', password: 'analyst123', name: 'Sarah Chen', role: 'analyst' },
        { email: 'mike@tripay.ai', password: 'analyst123', name: 'Michael Ross', role: 'analyst' },
        { email: 'client@acme.com', password: 'client123', name: 'Client Viewer', role: 'client' }
      ]
      const created = []
      for (const d of demos) {
        const exists = await prisma.user.findUnique({ where: { email: d.email } })
        if (!exists) {
          const hash = await bcrypt.hash(d.password, 12)
          const u = await prisma.user.create({ data: { ...d, password: hash }, select: { id: true, email: true, name: true, role: true } })
          created.push(u)
        }
      }
      res.json({ message: 'Demo users seeded', created })
    } catch (err) { next(err) }
  }
}
