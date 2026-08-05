/**
 * LBO Calculation Engine — Single Source of Truth
 * Used by Dashboard KPIs, LBO Table, Sensitivity Grid, and Forecast Chart
 */

export function computeDeal(ebitda, entryMultiple, debt, exitMultiple, holdingPeriod, growthRate) {
  const ev = ebitda * entryMultiple
  const equity = ev - debt
  const exitEbitda = ebitda * Math.pow(1 + growthRate / 100, holdingPeriod)
  const exitValue = exitEbitda * exitMultiple
  const exitEquity = exitValue - debt
  const moic = equity > 0 ? exitEquity / equity : 0
  const irr = (moic > 0 && holdingPeriod > 0) ? (Math.pow(moic, 1 / holdingPeriod) - 1) * 100 : 0
  const leverage = ebitda > 0 ? debt / ebitda : 0
  return { ev, equity, exitEbitda, exitValue, exitEquity, moic, irr, leverage }
}

export function computeScenarios(baseInputs) {
  const { ebitda, entryMultiple, debt, exitMultiple, holdingPeriod, growthRate } = baseInputs

  const base = computeDeal(ebitda, entryMultiple, debt, exitMultiple, holdingPeriod, growthRate)
  const downside = computeDeal(
    ebitda, entryMultiple, debt,
    Math.max(0.5, exitMultiple * 0.8),
    holdingPeriod,
    Math.max(-99, growthRate - 5)
  )
  const upside = computeDeal(
    ebitda, entryMultiple, debt,
    exitMultiple * 1.2,
    holdingPeriod,
    growthRate + 5
  )

  return { base, downside, upside }
}

export function computeSensitivity(baseInputs) {
  const { ebitda, entryMultiple, debt, exitMultiple, holdingPeriod, growthRate } = baseInputs
  const spread = [-2, -1, 0, 1, 2]
  const exits = spread.map(d => Math.max(0.5, exitMultiple + d))
  const entries = spread.map(d => Math.max(0.5, entryMultiple + d))

  const grid = entries.map(en =>
    exits.map(ex => {
      const r = computeDeal(ebitda, en, debt, ex, holdingPeriod, growthRate)
      return parseFloat(r.moic.toFixed(2))
    })
  )

  return { exits, entries, grid }
}

export function computeForecast(baseInputs) {
  const { revenue, ebitda, growthRate, holdingPeriod } = baseInputs
  const years = []
  let currentRev = revenue
  let currentEbitda = ebitda
  let margin = revenue > 0 ? (ebitda / revenue) * 100 : 0

  for (let i = 1; i <= (holdingPeriod || 5); i++) {
    years.push({
      year: `Year ${i}`,
      revenue: parseFloat(currentRev.toFixed(2)),
      ebitda: parseFloat(currentEbitda.toFixed(2)),
      margin: parseFloat(margin.toFixed(2))
    })
    currentRev = currentRev * (1 + growthRate / 100)
    margin = Math.min(margin + 2, 30)
    currentEbitda = currentRev * (margin / 100)
  }
  return years
}
