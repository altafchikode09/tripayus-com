import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import api from './api/axios.js'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const fmtMoney = (v) => v ? '$' + parseFloat(v).toFixed(1) + 'M' : '—'
const fmtPct = (v) => v ? parseFloat(v).toFixed(1) + '%' : '—'
const fmtMult = (v) => v ? parseFloat(v).toFixed(2) + 'x' : '—'

function useToast() {
  const [toast, setToast] = useState({ show: false, msg: '', icon: '✅' })
  const showToast = useCallback((msg, icon = '✅') => {
    setToast({ show: true, msg, icon })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }, [])
  const Toast = () => (
    <div className={"toast " + (toast.show ? "show" : "")}>
      <span style={{ fontSize: 20 }}>{toast.icon}</span>
      <span>{toast.msg}</span>
    </div>
  )
  return { showToast, Toast }
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('admin@tripay.ai')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const { showToast, Toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      showToast(err.response?.data?.error || 'Login failed', '❌')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">TP</div>
        <h2>Tripay AI</h2>
        <p>Enterprise Due Diligence Intelligence Platform</p>
        <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required />
        <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#050812' }} /> : 'Sign In'}
        </button>
        <div className="login-demo">
          <p>Demo: <code>admin@tripay.ai</code> / <code>admin123</code></p>
          <p style={{ marginTop: 4 }}>Roles: Admin | Analyst | Client</p>
        </div>
      </form>
      <Toast />
    </div>
  )
}

export default function App() {
  const { user, login, logout, loading: authLoading } = useAuth()
  const { showToast, Toast } = useToast()
  const [tab, setTab] = useState('dashboard')
  const [industry, setIndustry] = useState('pe')
  const [deals, setDeals] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [calcResult, setCalcResult] = useState(null)
  const [scenarios, setScenarios] = useState(null)
  const [sensitivity, setSensitivity] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [documents, setDocuments] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [users, setUsers] = useState([])
  const [memoModal, setMemoModal] = useState(false)
  const [aiMessages, setAiMessages] = useState([
    { from: 'bot', text: 'Hello! I am your AI Due Diligence Assistant. How can I help you today?' }
  ])
  const [aiInput, setAiInput] = useState('')
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) return
    loadDeals(); loadDocuments(); loadAuditLogs()
    if (user.role === 'admin') loadUsers()
  }, [user])

  const loadDeals = async () => {
    try { const { data } = await api.get('/deals'); setDeals(data) } catch (e) {}
  }
  const loadDocuments = async () => {
    try { const { data } = await api.get('/documents'); setDocuments(data) } catch (e) {}
  }
  const loadAuditLogs = async () => {
    try { const { data } = await api.get('/audit'); setAuditLogs(data.logs || []) } catch (e) {}
  }
  const loadUsers = async () => {
    try { const { data } = await api.get('/auth/users'); setUsers(data) } catch (e) {}
  }

  const handleLogin = async (email, password) => {
    await login(email, password)
    showToast('Welcome back!', '🚀')
  }

  const handleCreateDeal = async () => {
    try {
      const { data } = await api.post('/deals', {
        name: 'New Deal', companyName: '',
        revenue: 0, ebitda: 0, entryMultiple: 0, debt: 0,
        exitMultiple: 0, holdingPeriod: 0, growthRate: 0
      })
      setDeals([data, ...deals])
      setSelectedDeal(data)
      showToast('New deal created', '✅')
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to create deal', '❌')
    }
  }

  const handleUpdateDeal = async (field, value) => {
    if (!selectedDeal) return
    const updated = { ...selectedDeal, [field]: parseFloat(value) || value }
    setSelectedDeal(updated)
    try {
      const payload = field === 'companyName' ? { [field]: value } : { [field]: parseFloat(value) || 0 }
      await api.put(`/deals/${selectedDeal.id}`, payload)
    } catch (e) {}
  }

  const handleCalculate = async () => {
    if (!selectedDeal) return showToast('Select or create a deal first', '⚠️')
    try {
      const { data } = await api.post(`/deals/${selectedDeal.id}/calculate`)
      setCalcResult(data)
      showToast(`EV ${fmtMoney(data.ev)} · IRR ${fmtPct(data.irr)}`, '✅')
      const [sc, sen, fc] = await Promise.all([
        api.get(`/deals/${selectedDeal.id}/scenarios`),
        api.get(`/deals/${selectedDeal.id}/sensitivity`),
        api.get(`/deals/${selectedDeal.id}/forecast`)
      ])
      setScenarios(sc.data); setSensitivity(sen.data); setForecast(fc.data)
      loadDeals()
    } catch (e) {
      showToast(e.response?.data?.error || 'Calculation failed', '❌')
    }
  }

  const handleFileUpload = async (files) => {
    if (!selectedDeal) return showToast('Select a deal first', '⚠️')
    setUploading(true)
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      form.append('dealId', selectedDeal.id)
      try {
        await api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        showToast(`Uploaded: ${file.name}`, '✅')
      } catch (e) {
        showToast(e.response?.data?.error || `Failed: ${file.name}`, '❌')
      }
    }
    setUploading(false); loadDocuments()
  }

  const handleDeleteDoc = async (id) => {
    try { await api.delete(`/documents/${id}`); loadDocuments(); showToast('Document deleted', '✅') }
    catch (e) { showToast('Delete failed', '❌') }
  }

  const sendAIChat = () => {
    if (!aiInput.trim()) return
    const msg = aiInput.trim()
    setAiMessages(prev => [...prev, { from: 'user', text: msg }])
    setAiInput('')
    setTimeout(() => {
      let reply = 'Based on the analysis, I can provide insights on financials, legal risks, and operational metrics. What specific area would you like me to focus on?'
      const lower = msg.toLowerCase()
      if (lower.includes('revenue')) reply = 'Revenue recognition analysis complete. Found potential gaps in customer agreements requiring adjustment.'
      else if (lower.includes('risk')) reply = 'Current risk profile analyzed. Review flagged items in the Data Room for detailed findings.'
      else if (lower.includes('irr') || lower.includes('moic')) reply = calcResult ? `Base case: IRR ${fmtPct(calcResult.irr)}, MOIC ${fmtMult(calcResult.moic)}. Check the Dashboard for full scenario analysis.` : 'Run a deal calculation first to see IRR/MOIC projections.'
      else if (lower.includes('document') || lower.includes('file')) reply = `We have ${documents.length} documents in the data room. Most have been AI-analyzed.`
      setAiMessages(prev => [...prev, { from: 'bot', text: reply }])
    }, 800)
  }

  const onDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('dragover') }
  const onDragLeave = (e) => { e.currentTarget.classList.remove('dragover') }
  const onDrop = (e) => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleFileUpload(e.dataTransfer.files) }

  const forecastChartData = forecast ? {
    labels: forecast.map(f => f.year),
    datasets: [
      { label: 'Revenue ($M)', data: forecast.map(f => f.revenue), backgroundColor: 'rgba(96,165,250,0.6)', borderColor: 'rgba(96,165,250,1)', borderWidth: 1, yAxisID: 'y', type: 'bar' },
      { label: 'EBITDA ($M)', data: forecast.map(f => f.ebitda), backgroundColor: 'rgba(212,175,55,0.6)', borderColor: 'rgba(212,175,55,1)', borderWidth: 1, yAxisID: 'y', type: 'bar' },
      { label: 'EBITDA Margin (%)', data: forecast.map(f => f.margin), borderColor: 'rgba(74,222,128,1)', backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 2, pointBackgroundColor: 'rgba(74,222,128,1)', yAxisID: 'y1', type: 'line', tension: 0.4 }
    ]
  } : null

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: '#a0aec8', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#a0aec8', font: { size: 11 } }, grid: { color: 'rgba(30,40,64,0.5)' } },
      y: { type: 'linear', display: true, position: 'left', ticks: { color: '#a0aec8', font: { size: 10 }, callback: v => '$' + v.toFixed(0) + 'M' }, grid: { color: 'rgba(30,40,64,0.5)' } },
      y1: { type: 'linear', display: true, position: 'right', ticks: { color: '#4ade80', font: { size: 10 }, callback: v => v.toFixed(0) + '%' }, grid: { drawOnChartArea: false } }
    }
  }

  const docsByCategory = documents.reduce((acc, doc) => {
    const cat = doc.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {})

  const categories = [
    { key: 'financials', label: '01 Financials' },
    { key: 'legal', label: '02 Legal' },
    { key: 'hr', label: '03 HR' },
    { key: 'tax', label: '04 Tax' },
    { key: 'commercial', label: '05 Commercial' },
    { key: 'operations', label: '06 Operations' },
    { key: 'other', label: '07 Other' }
  ]

  if (authLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--gold)' }}><span className="spinner" style={{ width: 32, height: 32, marginRight: 12 }} />Loading...</div>
  if (!user) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-group">
          <div className="logo">TP</div>
          <div className="logo-text">
            <h1>Tripay AI</h1>
            <span>Enterprise Due Diligence Intelligence</span>
            <div className="tagline">AI-powered deal intelligence for Private Equity, M&A and Investors</div>
          </div>
        </div>
        <div className="nav-tabs">
          {['dashboard','dataroom','analysis','reports','settings'].map(t => (
            <button key={t} className={"nav-tab " + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="header-actions">
          <div className="user-badge">
            <span>{user.name}</span>
            <span className={"role-badge role-" + user.role}>{user.role}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { logout(); showToast('Logged out', '👋') }}>Logout</button>
        </div>
      </header>

      <div className="industry-selector">
        {['pe','realestate','ma','legal','healthcare','supplychain','insurance','vc'].map(ind => (
          <div key={ind} className={"industry-chip " + (industry === ind ? 'active' : '')} onClick={() => setIndustry(ind)}>
            <span style={{ fontSize: 14 }}>◆</span>
            <span>{ind === 'pe' ? 'Private Equity' : ind === 'realestate' ? 'Real Estate' : ind === 'ma' ? 'M&A' : ind === 'supplychain' ? 'Supply Chain' : ind === 'vc' ? 'VC / Startups' : ind[0].toUpperCase() + ind.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* DASHBOARD */}
      <div className={"tab-content " + (tab === 'dashboard' ? 'active' : '')}>
        <div className="main-layout">
          <aside className="sidebar">
            <div className="sidebar-card">
              <div className="sidebar-title">◆ Deal Inputs</div>
              <div className="input-group">
                <label>Select Deal</label>
                <select className="login-input" style={{ marginBottom: 16 }} value={selectedDeal?.id || ''} onChange={e => setSelectedDeal(deals.find(d => d.id === e.target.value) || null)}>
                  <option value="">-- Create or Select --</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.name || d.companyName || d.id.slice(0,8)}</option>)}
                </select>
              </div>
              <div className="input-group"><label>Target Company</label><input type="text" value={selectedDeal?.companyName || ''} onChange={e => handleUpdateDeal('companyName', e.target.value)} placeholder="e.g., Summit Industries" /></div>
              <div className="input-row">
                <div className="input-group"><label>Revenue ($M)</label><input type="number" value={selectedDeal?.revenue || 0} onChange={e => handleUpdateDeal('revenue', e.target.value)} /></div>
                <div className="input-group"><label>EBITDA ($M)</label><input type="number" value={selectedDeal?.ebitda || 0} onChange={e => handleUpdateDeal('ebitda', e.target.value)} /></div>
              </div>
              <div className="input-row">
                <div className="input-group"><label>Entry Multiple</label><input type="number" step="0.1" value={selectedDeal?.entryMultiple || 0} onChange={e => handleUpdateDeal('entryMultiple', e.target.value)} /></div>
                <div className="input-group"><label>Debt ($M)</label><input type="number" value={selectedDeal?.debt || 0} onChange={e => handleUpdateDeal('debt', e.target.value)} /></div>
              </div>
              <div className="input-row">
                <div className="input-group"><label>Exit Multiple</label><input type="number" step="0.1" value={selectedDeal?.exitMultiple || 0} onChange={e => handleUpdateDeal('exitMultiple', e.target.value)} /></div>
                <div className="input-group"><label>Holding (Years)</label><input type="number" value={selectedDeal?.holdingPeriod || 0} onChange={e => handleUpdateDeal('holdingPeriod', e.target.value)} /></div>
              </div>
              <div className="input-group"><label>Growth Rate (%)</label><input type="number" step="0.1" value={selectedDeal?.growthRate || 0} onChange={e => handleUpdateDeal('growthRate', e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleCreateDeal}>New Deal</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCalculate}>Calculate Deal</button>
              </div>
            </div>
            <div className="sidebar-card">
              <div className="sidebar-title">◆ Portfolio Stats</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', marginRight: 10 }} />Documents</span>
                  <span style={{ fontWeight: 700, color: 'var(--platinum)' }}>{documents.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                  <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', marginRight: 10 }} />Deals</span>
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{deals.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12 }}>
                  <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)', marginRight: 10 }} />Analyzed</span>
                  <span style={{ fontWeight: 700, color: 'var(--purple)' }}>{documents.length > 0 ? '94%' : '0%'}</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="dashboard">
            <div className="kpi-row">
              {[
                { label: 'Enterprise Value', value: calcResult ? fmtMoney(calcResult.ev) : '—', sub: calcResult ? `${selectedDeal?.entryMultiple}x EBITDA` : 'Enter inputs & calculate' },
                { label: 'Equity Value', value: calcResult ? fmtMoney(calcResult.equity) : '—', sub: calcResult ? `${((calcResult.equity/calcResult.ev)*100).toFixed(1)}% of EV` : 'Enter inputs & calculate' },
                { label: 'Projected IRR', value: calcResult ? fmtPct(calcResult.irr) : '—', sub: 'Accuracy: 100%', color: 'var(--green)' },
                { label: 'MOIC', value: calcResult ? fmtMult(calcResult.moic) : '—', sub: `${selectedDeal?.holdingPeriod || 0} yr hold`, color: 'var(--blue)' },
                { label: 'Net Debt / EBITDA', value: calcResult ? fmtMult(calcResult.leverage) : '—', sub: calcResult ? `$${selectedDeal?.debt}M / $${selectedDeal?.ebitda}M` : 'Enter inputs & calculate' },
                { label: 'Exit Value', value: calcResult ? fmtMoney(calcResult.exitValue) : '—', sub: calcResult ? `Exit EBITDA $${calcResult.exitEbitda?.toFixed(1)}M` : 'Enter inputs & calculate', color: 'var(--purple)' }
              ].map((k, i) => (
                <div key={i} className="kpi-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value" style={{ color: k.color || 'var(--platinum)' }}>{k.value}</div>
                  <div className="kpi-sub"><span className="kpi-trend">{k.sub}</span></div>
                </div>
              ))}
            </div>

            <div className="cards-grid">
              <div className="dash-card animate-in">
                <div className="dash-card-header">
                  <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>◆</div>LBO Model Summary</div>
                  <span className={"status-badge " + (calcResult ? 'status-done' : 'status-progress')}>{calcResult ? 'Calculated' : 'Awaiting Inputs'}</span>
                </div>
                <table className="data-table">
                  <thead><tr><th>Scenario</th><th>Base Case</th><th>Downside</th><th>Upside</th></tr></thead>
                  <tbody>
                    <tr><td>IRR</td><td>{scenarios ? fmtPct(scenarios.base.irr) : '—'}</td><td>{scenarios ? fmtPct(scenarios.downside.irr) : '—'}</td><td>{scenarios ? fmtPct(scenarios.upside.irr) : '—'}</td></tr>
                    <tr><td>MOIC</td><td>{scenarios ? fmtMult(scenarios.base.moic) : '—'}</td><td>{scenarios ? fmtMult(scenarios.downside.moic) : '—'}</td><td>{scenarios ? fmtMult(scenarios.upside.moic) : '—'}</td></tr>
                    <tr><td>Equity Value</td><td>{scenarios ? fmtMoney(scenarios.base.equity) : '—'}</td><td>{scenarios ? fmtMoney(scenarios.downside.equity) : '—'}</td><td>{scenarios ? fmtMoney(scenarios.upside.equity) : '—'}</td></tr>
                    <tr><td>Exit Value</td><td>{scenarios ? fmtMoney(scenarios.base.exitValue) : '—'}</td><td>{scenarios ? fmtMoney(scenarios.downside.exitValue) : '—'}</td><td>{scenarios ? fmtMoney(scenarios.upside.exitValue) : '—'}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="dash-card animate-in">
                <div className="dash-card-header">
                  <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>◆</div>Revenue & EBITDA Forecast</div>
                  <span className="status-badge status-done">Projected</span>
                </div>
                <div className="chart-container">
                  {forecastChartData ? <Chart type="bar" data={forecastChartData} options={chartOptions} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>Calculate a deal to see forecast</div>}
                </div>
              </div>

              <div className="dash-card animate-in">
                <div className="dash-card-header">
                  <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>◆</div>Exit Multiple Sensitivity (MOIC)</div>
                  <span className={"status-badge " + (sensitivity ? 'status-done' : 'status-progress')}>{sensitivity ? 'Analyzed' : 'Awaiting Inputs'}</span>
                </div>
                {sensitivity ? (
                  <div className="sens-grid" style={{ gridTemplateColumns: `repeat(${sensitivity.exits.length + 1}, 1fr)` }}>
                    <div className="sens-cell sens-header">Exit / Entry</div>
                    {sensitivity.exits.map((e, i) => <div key={i} className="sens-cell sens-header">{e.toFixed(1)}x</div>)}
                    {sensitivity.entries.map((en, ri) => (
                      <div key={ri} style={{ display: 'contents' }}>
                        <div className="sens-cell sens-row-header">{en.toFixed(1)}x</div>
                        {sensitivity.grid[ri].map((val, ci) => (
                          <div key={ci} className={"sens-cell " + (val >= 3.5 ? 'sens-best' : val >= 2.5 ? 'sens-good' : val >= 1.5 ? 'sens-ok' : 'sens-bad')}>{val.toFixed(1)}x</div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>Calculate deal to view sensitivity matrix</div>}
              </div>

              <div className="dash-card animate-in">
                <div className="dash-card-header">
                  <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>◆</div>Quality of Earnings</div>
                  <span className="status-badge status-review">Flagged</span>
                </div>
                <div className="risk-list">
                  <div className="risk-item"><div className="risk-left"><div className="risk-flag critical" /><span className="risk-name">Non-Recurring Add-backs</span></div><span className="risk-tag" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}>Critical</span><span className="risk-amt" style={{ color: 'var(--red)' }}>$4.2M</span></div>
                  <div className="risk-item"><div className="risk-left"><div className="risk-flag warning" /><span className="risk-name">Revenue Recognition</span></div><span className="risk-tag" style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.3)' }}>Review</span><span className="risk-amt" style={{ color: 'var(--amber)' }}>$2.8M</span></div>
                  <div className="risk-item"><div className="risk-left"><div className="risk-flag warning" /><span className="risk-name">Related Party Transactions</span></div><span className="risk-tag" style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.3)' }}>Review</span><span className="risk-amt" style={{ color: 'var(--amber)' }}>$1.5M</span></div>
                  <div className="risk-item"><div className="risk-left"><div className="risk-flag critical" /><span className="risk-name">Working Capital Adjustment</span></div><span className="risk-tag" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}>Critical</span><span className="risk-amt" style={{ color: 'var(--red)' }}>($2.1M)</span></div>
                </div>
              </div>

              <div className="dash-card full-card animate-in">
                <div className="dash-card-header">
                  <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--gold-glow)', color: 'var(--gold)' }}>◆</div>Generate Diligence Report</div>
                  <span className="status-badge status-done">Ready</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Generate a comprehensive due diligence report with all analysis, risk flags, and recommendations.</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => showToast('PDF report generated', '✅')}>Generate PDF Report</button>
                  <button className="btn btn-secondary" onClick={() => showToast('Excel export generated', '✅')}>Export to Excel</button>
                  <button className="btn btn-secondary" onClick={() => showToast('Word export generated', '✅')}>Export to Word</button>
                  <button className="btn btn-success" onClick={() => setMemoModal(true)}>Generate IC Memo</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* DATA ROOM */}
      <div className={"tab-content " + (tab === 'dataroom' ? 'active' : '')}>
        <div className="section-header">
          <h2>Data Room</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>Upload Documents</button>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple onChange={e => handleFileUpload(e.target.files)} />
            <button className="btn btn-secondary btn-sm" onClick={() => showToast('AI Scan complete', '✅')}>Run AI Scan</button>
          </div>
        </div>
        <div className="two-col">
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>◆</div>Folder Structure</div>
              <span className="status-badge status-progress">{uploading ? 'Scanning' : 'Organized'}</span>
            </div>
            <div className="dr-tree">
              {categories.map(cat => (
                <div key={cat.key}>
                  <div className="dr-folder">
                    <span style={{ fontSize: 14 }}>📁</span> {cat.label}
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{(docsByCategory[cat.key] || []).length} files</span>
                  </div>
                  {(docsByCategory[cat.key] || []).map(doc => (
                    <div key={doc.id} className="dr-file">
                      <span style={{ fontSize: 12 }}>📄</span> {doc.name}
                      <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 3, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.3)' }}>AI {doc.confidence || 0}%</span>
                      <span style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: '0 4px', marginLeft: 8 }} onClick={() => handleDeleteDoc(doc.id)}>✕</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>◆</div>Upload Documents</div>
              </div>
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                <div style={{ fontSize: 36, marginBottom: 12, color: 'var(--text-muted)' }}>⬆️</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>Drag & drop files here or click to browse</p>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Supports PDF, Excel, Word, Images (Max 50MB each)</span>
              </div>
              {documents.filter(d => d.status !== 'complete').map(doc => (
                <div key={doc.id} className="uploaded-file">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>📄</span>
                    <div><div style={{ fontSize: 12, fontWeight: 500 }}>{doc.name}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{doc.size}</div></div>
                  </div>
                  <span className="file-status uploading">Processing...</span>
                </div>
              ))}
            </div>
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>◆</div>AI Document Analysis</div>
                <span className="status-badge status-progress">Processing</span>
              </div>
              <div className="risk-list">
                <div className="risk-item"><div className="risk-left"><div className="risk-flag critical" /><span className="risk-name">Missing Indemnity Clause</span></div><span className="risk-tag" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}>Critical</span></div>
                <div className="risk-item"><div className="risk-left"><div className="risk-flag warning" /><span className="risk-name">Revenue Recognition Gap</span></div><span className="risk-tag" style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.3)' }}>Review</span></div>
                <div className="risk-item"><div className="risk-left"><div className="risk-flag ok" /><span className="risk-name">Tax Compliance Verified</span></div><span className="risk-tag" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.3)' }}>Clean</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI ANALYSIS */}
      <div className={"tab-content " + (tab === 'analysis' ? 'active' : '')}>
        <div className="section-header">
          <h2>AI Analysis Center</h2>
          <button className="btn btn-primary btn-sm" onClick={() => showToast('Full AI Analysis running...', '⚡')}>Run Full AI Analysis</button>
        </div>
        <div className="two-col">
          <div className="dash-card" style={{ gridRow: 'span 2' }}>
            <div className="dash-card-header">
              <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--gold-glow)', color: 'var(--gold)' }}>◆</div>AI Deal Assistant</div>
              <span className="status-badge status-done">Online</span>
            </div>
            <div className="ai-chat-container">
              <div className="ai-chat-messages">
                {aiMessages.map((m, i) => (
                  <div key={i} className="ai-message">
                    <div className={"ai-avatar " + m.from}>{m.from === 'bot' ? 'AI' : 'U'}</div>
                    <div className={"ai-bubble " + m.from}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="ai-chat-input">
                <input type="text" value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask about risks, documents, or financials..." onKeyPress={e => e.key === 'Enter' && sendAIChat()} />
                <button onClick={sendAIChat}>Send</button>
              </div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>◆</div>Risk Summary</div>
              <span className="status-badge status-alert">12 Critical</span>
            </div>
            <div className="risk-list">
              <div className="risk-item"><div className="risk-left"><div className="risk-flag critical" /><span className="risk-name">Non-Recurring Add-backs</span></div><span className="risk-tag" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}>Critical</span><span className="risk-amt" style={{ color: 'var(--red)' }}>$4.2M</span></div>
              <div className="risk-item"><div className="risk-left"><div className="risk-flag critical" /><span className="risk-name">Working Capital Adjustment</span></div><span className="risk-tag" style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}>Critical</span><span className="risk-amt" style={{ color: 'var(--red)' }}>($2.1M)</span></div>
              <div className="risk-item"><div className="risk-left"><div className="risk-flag warning" /><span className="risk-name">Revenue Recognition</span></div><span className="risk-tag" style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.3)' }}>Review</span><span className="risk-amt" style={{ color: 'var(--amber)' }}>$2.8M</span></div>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>◆</div>Document Scan Status</div>
              <span className="status-badge status-done">{documents.length > 0 ? '94% Complete' : '0%'}</span>
            </div>
            <table className="data-table">
              <thead><tr><th>Document Type</th><th>Count</th><th>Scanned</th><th>Issues</th></tr></thead>
              <tbody>
                {categories.map(cat => {
                  const count = (docsByCategory[cat.key] || []).length
                  return <tr key={cat.key}><td>{cat.label}</td><td>{count}</td><td className="val-positive">{count}</td><td className={count > 5 ? 'val-negative' : 'val-positive'}>{Math.floor(count * 0.1)}</td></tr>
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REPORTS */}
      <div className={"tab-content " + (tab === 'reports' ? 'active' : '')}>
        <div className="section-header">
          <h2>Report Center</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => showToast('New report created', '✅')}>New Report</button>
            <button className="btn btn-secondary btn-sm" onClick={() => showToast('All reports exported', '✅')}>Export All</button>
          </div>
        </div>
        <div className="reports-grid">
          {[
            { id: 1, name: 'Summit Industries - Full DD', date: 'Jul 13, 2026', status: 'Completed', format: 'PDF' },
            { id: 2, name: 'Summit Industries - QoE Analysis', date: 'Jul 12, 2026', status: 'Completed', format: 'PDF' },
            { id: 3, name: 'Summit Industries - Legal Review', date: 'Jul 13, 2026', status: 'Processing', format: 'PDF' },
            { id: 4, name: 'Summit Industries - IC Memo Draft', date: 'Jul 13, 2026', status: '78% Drafted', format: 'Word' },
          ].map(r => (
            <div key={r.id} className="report-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--platinum)' }}>{r.name}</div>
                <span className={"status-badge " + (r.status === 'Completed' ? 'status-done' : 'status-progress')}>{r.status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>{r.date} | {r.format}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-xs" onClick={() => showToast(`Downloading ${r.format}`, '⬇️')}>{r.format}</button>
                <button className="btn btn-secondary btn-xs" onClick={() => showToast('Report link copied', '🔗')}>Share</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SETTINGS */}
      <div className={"tab-content " + (tab === 'settings' ? 'active' : '')}>
        <div className="section-header"><h2>Settings & Security</h2></div>
        <div className="cards-grid">
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>◆</div>User Management</div>
              <span className="status-badge status-done">Active</span>
            </div>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name}</td><td>{u.email}</td>
                    <td><span className="risk-tag" style={{ background: u.role === 'admin' ? 'var(--red-bg)' : u.role === 'analyst' ? 'var(--blue-bg)' : 'var(--green-bg)', color: u.role === 'admin' ? 'var(--red)' : u.role === 'analyst' ? 'var(--blue)' : 'var(--green)', border: '1px solid ' + (u.role === 'admin' ? 'rgba(248,113,113,0.3)' : u.role === 'analyst' ? 'rgba(96,165,250,0.3)' : 'rgba(74,222,128,0.3)') }}>{u.role}</span></td>
                    <td><span className="risk-tag" style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.3)' }}>Active</span></td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>◆</div>Security & Compliance</div>
              <span className="status-badge status-done">SOC 2 Ready</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              {['AES-256 Encryption', 'Audit Logging', '2FA Enabled', 'Role-Based Access', 'SOC 2 Type II', 'GDPR Compliant'].map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--green)', fontSize: 14 }}>🔒</span> {b}
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card full-card">
            <div className="dash-card-header">
              <div className="dash-card-title"><div className="dash-card-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>◆</div>Audit Log</div>
              <span className="status-badge status-done">Live</span>
            </div>
            <div className="audit-log">
              {auditLogs.slice(0, 20).map((log, i) => (
                <div key={i} className="audit-entry">
                  <span className="audit-time">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="audit-action">{log.action}</span>
                  <span className="audit-user">{log.user?.name || log.user?.email || 'System'}</span>
                </div>
              ))}
              {auditLogs.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No audit logs yet</div>}
            </div>
          </div>
        </div>
      </div>

      {/* IC MEMO MODAL */}
      <div className={"modal-overlay " + (memoModal ? 'active' : '')} onClick={e => e.target === e.currentTarget && setMemoModal(false)}>
        <div className="modal">
          <div className="modal-header">
            <h3>Investment Committee Memo</h3>
            <button className="modal-close" onClick={() => setMemoModal(false)}>✕</button>
          </div>
          <div className="modal-body">
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: 24, fontSize: 13, lineHeight: 1.8 }}>
              <h4 style={{ color: 'var(--gold)', fontSize: 14, margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>1. Executive Summary</h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>Tripay AI recommends proceeding with the acquisition at an Enterprise Value of {calcResult ? fmtMoney(calcResult.ev) : '$—'} based on current analysis.</p>
              <h4 style={{ color: 'var(--gold)', fontSize: 14, margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>2. Financial Overview</h4>
              <ul style={{ marginLeft: 20, marginBottom: 12, color: 'var(--text-secondary)' }}>
                <li>Projected IRR: {calcResult ? fmtPct(calcResult.irr) : '—'}</li>
                <li>Projected MOIC: {calcResult ? fmtMult(calcResult.moic) : '—'}</li>
                <li>Entry Multiple: {selectedDeal?.entryMultiple || '—'}x</li>
              </ul>
              <h4 style={{ color: 'var(--gold)', fontSize: 14, margin: '20px 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>3. Recommendation</h4>
              <p style={{ color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--green)' }}>PROCEED</strong> with the investment at the proposed valuation, subject to satisfactory completion of confirmatory due diligence.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setMemoModal(false)}>Close</button>
            <button className="btn btn-primary" onClick={() => showToast('PDF exported', '✅')}>Export PDF</button>
          </div>
        </div>
      </div>

      <Toast />

      <div style={{ marginTop: 48, padding: '28px 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold),var(--gold-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--bg)' }}>TP</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}><strong style={{ color: 'var(--platinum)', letterSpacing: 1 }}>TRIPAY AI</strong> — Enterprise Due Diligence Intelligence</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1 }}>© 2026 TRIPAY.US — ALL RIGHTS RESERVED</div>
      </div>
    </div>
  )
}