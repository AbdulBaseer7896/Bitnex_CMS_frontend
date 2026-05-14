// ─────────────────────────────────────────────────────────────────────────────
// Accountant Dashboard — full-featured analytics view.
// Pulls live data from /expenses + /reimbursements/stats + /salary/slips and
// builds time-series, category, payroll, and reimbursement charts with a
// global period filter (today/week/month/quarter/year/custom).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import {
  HiOutlineCurrencyDollar, HiOutlineTrendingUp, HiOutlineTrendingDown,
  HiOutlineDocumentReport, HiOutlineCalendar, HiOutlineRefresh,
  HiOutlineReceiptRefund, HiOutlineCash, HiOutlineExclamation,
  HiOutlineChartPie, HiOutlineArrowRight,
} from 'react-icons/hi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'

// ── Period helpers ──────────────────────────────────────────────────────────
const iso = (d) => d.toISOString().slice(0, 10)
const startOfWeek = (d) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x }
const PERIODS = [
  { k: 'today',    l: 'Today' },
  { k: 'week',     l: 'This Week' },
  { k: 'month',    l: 'This Month' },
  { k: 'quarter',  l: 'This Quarter' },
  { k: 'year',     l: 'This Year' },
  { k: 'all',      l: 'All Time' },
  { k: 'custom',   l: 'Custom' },
]
const rangeFor = (k, custom = {}) => {
  const n = new Date()
  if (k === 'today')   return { from: iso(n), to: iso(n), label: 'Today' }
  if (k === 'week')    return { from: iso(startOfWeek(n)), to: iso(n), label: 'This Week' }
  if (k === 'month')   return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n), label: 'This Month' }
  if (k === 'quarter') { const q = Math.floor(n.getMonth()/3); return { from: iso(new Date(n.getFullYear(), q*3, 1)), to: iso(n), label: 'This Quarter' } }
  if (k === 'year')    return { from: iso(new Date(n.getFullYear(), 0, 1)), to: iso(n), label: 'This Year' }
  if (k === 'all')     return { from: null, to: null, label: 'All Time' }
  if (k === 'custom')  return { from: custom.from || null, to: custom.to || null, label: 'Custom' }
  return {}
}

const CAT_COLORS = {
  utilities: '#3b82f6', rent: '#7c3aed', salaries: '#ec4899',
  equipment: '#f97316', marketing: '#eab308', travel: '#14b8a6',
  software: '#06b6d4', office_supplies: '#10b981',
  client_entertainment: '#f43f5e', maintenance: '#a78bfa', other: '#94a3b8',
  reimbursements: '#a78bfa',
}
const ORANGE = '#f97316'

const fmtPKR = (v) => '₨' + Number(v || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })
const fmtCompact = (v) => {
  const n = Number(v || 0)
  if (n >= 1_000_000) return '₨' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000)     return '₨' + (n / 1_000).toFixed(0) + 'k'
  return '₨' + n
}

const isReimb = (e) => typeof e.description === 'string' && e.description.includes('[Employee Reimbursement]')

export default function AccountantDashboard() {
  const [period, setPeriod] = useState('month')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [expenses, setExpenses]     = useState([])
  const [reimbStats, setReimbStats] = useState({})
  const [reimbList, setReimbList]   = useState([])
  const [slips, setSlips]           = useState([])
  const [loading, setLoading]       = useState(true)

  const range = useMemo(() => rangeFor(period, custom), [period, custom.from, custom.to])

  const fetch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to)   params.to   = range.to
      const [{ data: exp }, { data: rs }, { data: rl }, slipsRes] = await Promise.all([
        api.get('/expenses/', { params }),
        api.get('/reimbursements/stats/'),
        api.get('/reimbursements/', { params: { scope: 'all' } }),
        api.get('/salary/slips/').catch(() => ({ data: [] })),
      ])
      setExpenses(exp.results || exp)
      setReimbStats(rs || {})
      setReimbList(rl.results || rl)
      setSlips(slipsRes.data?.results || slipsRes.data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [period, custom.from, custom.to])

  // ── Aggregations ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    const approved = expenses.filter(e => e.is_approved).reduce((s, e) => s + Number(e.amount || 0), 0)
    const reimbInExpenses = expenses.filter(isReimb).reduce((s, e) => s + Number(e.amount || 0), 0)
    const payrollPaid = slips
      .filter(s => s.status === 'paid')
      .filter(s => {
        if (!range.from && !range.to) return true
        const slipDate = s.paid_date || `${s.year}-${String(s.month).padStart(2,'0')}-15`
        if (range.from && slipDate < range.from) return false
        if (range.to   && slipDate > range.to)   return false
        return true
      })
      .reduce((s, slip) => s + Number(slip.net_payable || 0), 0)
    const unpaidSlips = slips.filter(s => s.status !== 'paid').length

    const byCat = {}
    expenses.forEach(e => {
      const c = isReimb(e) ? 'reimbursements' : e.category
      byCat[c] = (byCat[c] || 0) + Number(e.amount || 0)
    })

    // Daily series for the period
    const series = {}
    expenses.forEach(e => {
      const k = (e.date || '').slice(0, 10)
      if (k) series[k] = (series[k] || 0) + Number(e.amount || 0)
    })
    const trend = Object.entries(series).sort().map(([d, v]) => ({
      date: d, label: d.slice(5), value: v,
    }))

    return {
      total, approved, reimbInExpenses, payrollPaid, unpaidSlips,
      byCat, trend, count: expenses.length,
    }
  }, [expenses, slips, range])

  const pieData = Object.entries(stats.byCat)
    .map(([c, v]) => ({ name: c.replace(/_/g, ' '), value: v, fill: CAT_COLORS[c] || '#94a3b8' }))
    .sort((a, b) => b.value - a.value)

  // Reimbursement status mix
  const reimbMix = useMemo(() => {
    const m = {}
    reimbList.forEach(r => { m[r.status] = (m[r.status] || 0) + Number(r.amount_pkr || 0) })
    const palette = {
      pending: '#eab308', approved: '#06b6d4', forwarded_to_hr: '#a78bfa',
      settled: '#10b981', paid_with_salary: '#10b981', rejected: '#ef4444',
    }
    const labels = {
      pending: 'Pending', approved: 'Approved', forwarded_to_hr: 'Forwarded',
      settled: 'Settled', paid_with_salary: 'Paid with Salary', rejected: 'Rejected',
    }
    return Object.entries(m).map(([k, v]) => ({ name: labels[k] || k, value: v, fill: palette[k] || '#94a3b8' }))
  }, [reimbList])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header + period filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Accountant Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Financial overview · {range.label}</p>
        </div>
        <button onClick={fetch} className="btn-ghost text-sm px-3 py-2 flex items-center gap-2">
          <HiOutlineRefresh className="w-4 h-4"/> Refresh
        </button>
      </div>

      <div className="glass rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <HiOutlineCalendar className="w-4 h-4 text-slate-500 ml-1"/>
        {PERIODS.filter(p => p.k !== 'custom').map(p => (
          <button key={p.k} onClick={() => setPeriod(p.k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              period === p.k
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
            }`}>{p.l}</button>
        ))}
        <button onClick={() => setPeriod('custom')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            period === 'custom'
              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
          }`}>Custom</button>
        {period === 'custom' && (
          <div className="flex items-center gap-1.5 text-xs">
            <input type="date" className="input py-1.5 text-xs w-auto" value={custom.from}
              onChange={e => setCustom(p => ({ ...p, from: e.target.value }))}/>
            <span className="text-slate-600">→</span>
            <input type="date" className="input py-1.5 text-xs w-auto" value={custom.to}
              onChange={e => setCustom(p => ({ ...p, to: e.target.value }))}/>
          </div>
        )}
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Total Expenses"    value={fmtCompact(stats.total)}    sub={`${stats.count} entries`}
             color="#f97316" Icon={HiOutlineCurrencyDollar}/>
        <KPI label="Approved"          value={fmtCompact(stats.approved)} sub={fmtPKR(stats.approved)}
             color="#10b981" Icon={HiOutlineDocumentReport}/>
        <KPI label="Payroll Paid"      value={fmtCompact(stats.payrollPaid)}
             sub={stats.unpaidSlips ? `${stats.unpaidSlips} unpaid` : 'all paid'}
             color="#06b6d4" Icon={HiOutlineCash}/>
        <KPI label="Reimbursements"    value={fmtCompact(stats.reimbInExpenses)}
             sub="settled, in totals"
             color="#a78bfa" Icon={HiOutlineReceiptRefund}/>
      </div>

      {/* Pending claims banner */}
      {(reimbStats.pending_count > 0 || reimbStats.forwarded_count > 0) && (
        <Link to="/reimbursements"
          className="glass rounded-2xl p-4 flex items-center gap-3 flex-wrap hover:border-violet-500/30 transition-colors"
          style={{ borderLeft: '3px solid #a78bfa' }}>
          <HiOutlineReceiptRefund className="w-5 h-5 text-violet-400 flex-shrink-0"/>
          <div className="flex-1 text-sm">
            <span className="text-white font-semibold">
              {reimbStats.pending_count || 0} pending · {reimbStats.forwarded_count || 0} in HR queue
            </span>
            <span className="text-slate-400 ml-2">
              · {fmtPKR(reimbStats.total_pending_pkr)} waiting · {fmtPKR(reimbStats.total_in_hr_queue_pkr)} to be paid via salary
            </span>
          </div>
          <span className="text-violet-400 text-xs font-semibold flex items-center gap-1">
            Review <HiOutlineArrowRight className="w-3.5 h-3.5"/>
          </span>
        </Link>
      )}

      {/* Expense trend area chart */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
            <HiOutlineTrendingUp className="w-4 h-4 text-orange-400"/> Expense Trend
          </h3>
          <span className="text-[11px] text-slate-500">{range.label}</span>
        </div>
        {stats.trend.length === 0 ? (
          <EmptyState text="No expense data for this period"/>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.trend} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={ORANGE} stopOpacity={0.4}/>
                  <stop offset="100%" stopColor={ORANGE} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }}/>
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                formatter={v => [fmtPKR(v), 'Spent']}/>
              <Area type="monotone" dataKey="value" stroke={ORANGE} strokeWidth={2} fill="url(#expGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two-column: category pie + reimbursement status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4">
          <h3 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
            <HiOutlineChartPie className="w-4 h-4 text-orange-400"/> Expenses by Category
          </h3>
          {pieData.length === 0 ? <EmptyState text="No category data"/> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="40%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                  formatter={v => [fmtPKR(v), '']}/>
                <Legend layout="vertical" align="right" verticalAlign="middle"
                  formatter={v => <span className="text-slate-400 text-xs capitalize">{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
            <HiOutlineReceiptRefund className="w-4 h-4 text-violet-400"/> Reimbursement Status
          </h3>
          {reimbMix.length === 0 ? <EmptyState text="No reimbursements yet"/> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={reimbMix} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={110}/>
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                  formatter={v => [fmtPKR(v), 'PKR']}/>
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {reimbMix.map((e, i) => <Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top categories breakdown */}
      <div className="glass rounded-2xl p-4">
        <h3 className="font-display font-bold text-white text-sm mb-4">Top Categories Breakdown</h3>
        {pieData.length === 0 ? <EmptyState text="No data"/> : (
          <div className="space-y-2.5">
            {pieData.slice(0, 8).map((c, i) => {
              const pct = stats.total ? (c.value / stats.total * 100) : 0
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 capitalize flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.fill }}/>
                      {c.name}
                    </span>
                    <span className="text-white font-semibold">{fmtPKR(c.value)} <span className="text-slate-500 font-normal">· {pct.toFixed(1)}%</span></span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.fill }}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink to="/accounts/expenses" Icon={HiOutlineDocumentReport} label="Expenses" sub="Add and manage"/>
        <QuickLink to="/reimbursements"    Icon={HiOutlineReceiptRefund}  label="Reimbursements" sub="Review claims" highlight={reimbStats.pending_count}/>
        <QuickLink to="/accounts/reports"  Icon={HiOutlineChartPie}       label="Reports" sub="Generate and export"/>
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color, Icon }) {
  return (
    <div className="stat-card">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}20`, color }}>
        <Icon className="w-5 h-5"/>
      </div>
      <div className="font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="h-48 flex items-center justify-center text-slate-600 text-sm">{text}</div>
}

function QuickLink({ to, Icon, label, sub, highlight }) {
  return (
    <Link to={to}
      className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-orange-500/30 transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
        <Icon className="w-5 h-5 text-white"/>
      </div>
      <div className="flex-1">
        <div className="text-white font-semibold text-sm">{label}</div>
        <div className="text-slate-500 text-[11px]">{sub}</div>
      </div>
      {highlight > 0 && (
        <span className="badge bg-violet-500/15 text-violet-400 border border-violet-500/25">{highlight}</span>
      )}
      <HiOutlineArrowRight className="w-4 h-4 text-slate-600"/>
    </Link>
  )
}
