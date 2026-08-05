import { prisma } from '../db.js'
import { computeDeal, computeScenarios, computeSensitivity, computeForecast } from '../utils/lboCalculator.js'
import { logAudit } from '../utils/auditLogger.js'

export const dealController = {
  async create(req, res, next) {
    try {
      const data = { ...req.body, createdBy: req.user.id }
      const deal = await prisma.deal.create({ data })
      await logAudit({ action: 'DEAL_CREATED', entityType: 'Deal', entityId: deal.id, req })
      res.status(201).json(deal)
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const deal = await prisma.deal.update({
        where: { id: req.params.id },
        data: req.body
      })
      await logAudit({ action: 'DEAL_UPDATED', entityType: 'Deal', entityId: deal.id, req })
      res.json(deal)
    } catch (err) { next(err) }
  },

  async remove(req, res, next) {
    try {
      await prisma.deal.delete({ where: { id: req.params.id } })
      await logAudit({ action: 'DEAL_DELETED', entityType: 'Deal', entityId: req.params.id, req })
      res.json({ success: true })
    } catch (err) { next(err) }
  },

  async list(req, res, next) {
    try {
      const deals = await prisma.deal.findMany({
        where: { createdBy: req.user.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { documents: true, risks: true, tasks: true } }
        }
      })
      res.json(deals)
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const deal = await prisma.deal.findUnique({
        where: { id: req.params.id },
        include: {
          documents: { take: 5, orderBy: { createdAt: 'desc' } },
          risks: true,
          memos: true,
          _count: { select: { documents: true } }
        }
      })
      if (!deal) return res.status(404).json({ error: 'Deal not found' })
      res.json(deal)
    } catch (err) { next(err) }
  },

  async calculate(req, res, next) {
    try {
      const deal = await prisma.deal.findUnique({ where: { id: req.params.id } })
      if (!deal) return res.status(404).json({ error: 'Deal not found' })

      const inputs = {
        ebitda: deal.ebitda,
        entryMultiple: deal.entryMultiple,
        debt: deal.debt,
        exitMultiple: deal.exitMultiple,
        holdingPeriod: deal.holdingPeriod,
        growthRate: deal.growthRate
      }

      if (inputs.ebitda <= 0 || inputs.entryMultiple <= 0) {
        return res.status(400).json({ error: 'EBITDA and Entry Multiple must be greater than 0' })
      }

      const result = computeDeal(inputs.ebitda, inputs.entryMultiple, inputs.debt, inputs.exitMultiple, inputs.holdingPeriod, inputs.growthRate)
      if (result.equity <= 0) {
        return res.status(400).json({ error: 'Debt exceeds Enterprise Value' })
      }

      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          enterpriseValue: result.ev,
          equityValue: result.equity,
          projectedIrr: result.irr,
          moic: result.moic,
          leverage: result.leverage,
          exitValue: result.exitValue
        }
      })

      await logAudit({ action: 'DEAL_CALCULATED', entityType: 'Deal', entityId: deal.id, metadata: { inputs }, req })
      res.json({
        ev: parseFloat(result.ev.toFixed(2)),
        equity: parseFloat(result.equity.toFixed(2)),
        irr: parseFloat(result.irr.toFixed(2)),
        moic: parseFloat(result.moic.toFixed(2)),
        leverage: parseFloat(result.leverage.toFixed(2)),
        exitValue: parseFloat(result.exitValue.toFixed(2)),
        exitEbitda: parseFloat(result.exitEbitda.toFixed(2))
      })
    } catch (err) { next(err) }
  },

  async scenarios(req, res, next) {
    try {
      const deal = await prisma.deal.findUnique({ where: { id: req.params.id } })
      if (!deal) return res.status(404).json({ error: 'Deal not found' })
      const inputs = {
        ebitda: deal.ebitda, entryMultiple: deal.entryMultiple, debt: deal.debt,
        exitMultiple: deal.exitMultiple, holdingPeriod: deal.holdingPeriod, growthRate: deal.growthRate
      }
      const result = computeScenarios(inputs)
      const fmt = (r) => ({
        ev: parseFloat(r.ev.toFixed(2)), equity: parseFloat(r.equity.toFixed(2)),
        irr: parseFloat(r.irr.toFixed(2)), moic: parseFloat(r.moic.toFixed(2)),
        leverage: parseFloat(r.leverage.toFixed(2)), exitValue: parseFloat(r.exitValue.toFixed(2))
      })
      res.json({ base: fmt(result.base), downside: fmt(result.downside), upside: fmt(result.upside) })
    } catch (err) { next(err) }
  },

  async sensitivity(req, res, next) {
    try {
      const deal = await prisma.deal.findUnique({ where: { id: req.params.id } })
      if (!deal) return res.status(404).json({ error: 'Deal not found' })
      const inputs = {
        ebitda: deal.ebitda, entryMultiple: deal.entryMultiple, debt: deal.debt,
        exitMultiple: deal.exitMultiple, holdingPeriod: deal.holdingPeriod, growthRate: deal.growthRate
      }
      const result = computeSensitivity(inputs)
      res.json(result)
    } catch (err) { next(err) }
  },

  async forecast(req, res, next) {
    try {
      const deal = await prisma.deal.findUnique({ where: { id: req.params.id } })
      if (!deal) return res.status(404).json({ error: 'Deal not found' })
      const inputs = {
        revenue: deal.revenue, ebitda: deal.ebitda,
        growthRate: deal.growthRate, holdingPeriod: deal.holdingPeriod
      }
      const result = computeForecast(inputs)
      res.json(result)
    } catch (err) { next(err) }
  }
}
