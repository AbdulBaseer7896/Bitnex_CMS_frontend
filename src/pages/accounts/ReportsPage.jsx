import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineCalendar, HiOutlineDownload, HiOutlinePrinter,
  HiOutlineRefresh, HiOutlineDocumentReport, HiOutlineFilter,
  HiOutlineCurrencyDollar, HiOutlineTrendingUp, HiOutlineChartBar,
} from 'react-icons/hi'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
         BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { PERIOD_OPTIONS, rangeFor } from './periodFilter'

const CATEGORIES = ['utilities', 'rent', 'salaries', 'equipment', 'marketing', 'travel', 'software', 'office_supplies', 'client_entertainment', 'maintenance', 'other']
const CAT_COLORS = {
  utilities: '#3b82f6', rent: '#7c3aed', salaries: '#ec4899',
  equipment: '#f97316', marketing: '#eab308', travel: '#14b8a6',
  software: '#06b6d4', office_supplies: '#10b981', client_entertainment: '#f43f5e',
  maintenance: '#a78bfa', other: '#94a3b8',
}

const fmtMoney = (n) => '₨' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function ReportsPage() {
  const [period, setPeriod]     = useState('month')
  const [custom, setCustom]     = useState({ from: '', to: '' })
  const [category, setCategory] = useState('all')
  const [groupBy, setGroupBy]   = useState('day')   // day | week | month

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)

  const range = useMemo(() => rangeFor(period, custom), [period, custom.from, custom.to])

  useEffect(() => { fetchData() }, [period, custom.from, custom.to, category])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to)   params.to   = range.to
      if (category !== 'all') params.category = category
      const { data } = await api.get('/expenses/', { params })
      setExpenses(data.results || data)
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  // ── Aggregations ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
    const approved = expenses.filter(e => e.is_approved).reduce((s, e) => s + Number(e.amount || 0), 0)
    const pending  = total - approved
    const avg      = expenses.length ? total / expenses.length : 0

    const byCat = {}
    expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0) })

    // group by period
    const bucketKey = (dateStr) => {
      const d = new Date(dateStr)
      if (groupBy === 'day')   return d.toISOString().slice(0, 10)
      if (groupBy === 'week') {
        const x = new Date(d); const day = (x.getDay() + 6) % 7
        x.setDate(x.getDate() - day); return x.toISOString().slice(0, 10)
      }
      // month
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }
    const series = {}
    expenses.forEach(e => {
      const k = bucketKey(e.date)
      series[k] = (series[k] || 0) + Number(e.amount || 0)
    })
    const trend = Object.entries(series).sort().map(([k, v]) => ({ label: k, value: v }))

    return { total, approved, pending, avg, byCat, trend, count: expenses.length }
  }, [expenses, groupBy])

  const pieData = Object.entries(stats.byCat)
    .map(([c, v]) => ({ name: c.replace(/_/g, ' '), value: v, fill: CAT_COLORS[c] || '#94a3b8' }))
    .sort((a, b) => b.value - a.value)

  // ── Export handlers ───────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Amount (PKR)', 'Status', 'Added By', 'Description']
    const rows = expenses.map(e => [
      e.date, e.title, e.category, e.amount,
      e.is_approved ? 'Approved' : 'Pending',
      e.added_by_name || '',
      (e.description || '').replace(/"/g, '""'),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `expense_report_${range.from || 'all'}_${range.to || 'all'}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  const printReport = () => {
    document.body.classList.add('printing-letter')
    setTimeout(() => {
      window.print()
      setTimeout(() => document.body.classList.remove('printing-letter'), 300)
    }, 60)
  }

  return (
    <>
      {/* ── Print-only printable report ────────────────────────────────── */}
      <div id="print-root" className="print-only">
        <PrintableReport range={range} stats={stats} expenses={expenses} category={category} pieData={pieData}/>
      </div>

      {/* ── Screen UI ───────────────────────────────────────────────────── */}
      <div className="screen-only space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Reports</h1>
            <p className="text-slate-500 text-sm mt-0.5">Financial reports · {range.label}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportCSV} disabled={!expenses.length}
              className="btn-ghost flex items-center gap-2 text-sm px-4 py-2.5">
              <HiOutlineDownload className="w-4 h-4"/> Export CSV
            </button>
            <button onClick={printReport} disabled={!expenses.length}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
              <HiOutlinePrinter className="w-4 h-4"/> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Period bar */}
        <div className="glass rounded-2xl p-3 flex items-center gap-2 flex-wrap">
          <HiOutlineCalendar className="w-4 h-4 text-slate-500 ml-1"/>
          <div className="flex gap-1 flex-wrap">
            {PERIOD_OPTIONS.filter(p => p.key !== 'custom').map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.key
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }`}>{p.label}</button>
            ))}
            <button onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === 'custom'
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}>Custom</button>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs ml-2">
              <input type="date" className="input py-1.5 text-xs w-auto"
                value={custom.from} onChange={e => setCustom(p => ({ ...p, from: e.target.value }))}/>
              <span className="text-slate-600">→</span>
              <input type="date" className="input py-1.5 text-xs w-auto"
                value={custom.to} onChange={e => setCustom(p => ({ ...p, to: e.target.value }))}/>
            </div>
          )}
          <button onClick={fetchData} className="ml-auto text-slate-500 hover:text-orange-400" title="Refresh">
            <HiOutlineRefresh className="w-4 h-4"/>
          </button>
        </div>

        {/* Secondary filters */}
        <div className="glass rounded-2xl p-3 flex items-center gap-3 flex-wrap text-xs">
          <HiOutlineFilter className="w-4 h-4 text-slate-500"/>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Category:</span>
            <select className="input py-1.5 text-xs w-auto" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="all">All</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900 capitalize">{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Trend by:</span>
            <select className="input py-1.5 text-xs w-auto" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label="Total Spend"     value={fmtMoney(stats.total)}    color="#f97316" Icon={HiOutlineCurrencyDollar}/>
          <KPI label="Approved"        value={fmtMoney(stats.approved)} color="#10b981" Icon={HiOutlineDocumentReport}/>
          <KPI label="Pending Approval"value={fmtMoney(stats.pending)}  color="#eab308" Icon={HiOutlineTrendingUp}/>
          <KPI label="Average / Entry" value={fmtMoney(stats.avg)}      color="#06b6d4" Icon={HiOutlineChartBar}/>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-500">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-600">
            <HiOutlineDocumentReport className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            No data for the selected period
          </div>
        ) : (
          <>
            {/* Trend line */}
            <div className="glass rounded-2xl p-4">
              <h3 className="font-display font-bold text-white text-sm mb-3">Spend Trend ({groupBy})</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={stats.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }}/>
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                    formatter={v => [fmtMoney(v), 'Spend']}/>
                  <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2}
                    dot={{ fill: '#f97316', r: 3 }} activeDot={{ r: 5 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie + Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-4">
                <h3 className="font-display font-bold text-white text-sm mb-3">By Category</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="40%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                      formatter={v => [fmtMoney(v), '']}/>
                    <Legend layout="vertical" align="right" verticalAlign="middle"
                      formatter={v => <span className="text-slate-400 text-xs capitalize">{v}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="glass rounded-2xl p-4">
                <h3 className="font-display font-bold text-white text-sm mb-3">Category Breakdown</h3>
                <div className="space-y-2 max-h-[260px] overflow-y-auto">
                  {pieData.map((c, i) => {
                    const pct = stats.total ? (c.value / stats.total * 100) : 0
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-300 capitalize">{c.name}</span>
                          <span className="text-white font-semibold">{fmtMoney(c.value)} · {pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.fill }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Detail table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display font-bold text-white text-sm">Detailed Records</h3>
                <span className="text-xs text-slate-500">{expenses.length} entries</span>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0" style={{ background: 'rgba(20,23,32,0.95)', backdropFilter: 'blur(8px)' }}>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                      <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Title</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Amount</th>
                      <th className="text-left px-4 py-2.5 font-semibold">By</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="table-row-hover border-b border-white/[0.03] last:border-0">
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{fmtDate(e.date)}</td>
                        <td className="px-4 py-2.5 text-white text-sm">{e.title}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[11px] capitalize" style={{ color: CAT_COLORS[e.category] || '#94a3b8' }}>
                            {e.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-display font-bold text-white">{fmtMoney(e.amount)}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{e.added_by_name || '—'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`badge text-[10px] ${e.is_approved
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'}`}>
                            {e.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── KPI ──────────────────────────────────────────────────────────────────────
function KPI({ label, value, color, Icon }) {
  return (
    <div className="stat-card">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}20`, color }}>
        <Icon className="w-5 h-5"/>
      </div>
      <div className="font-display text-xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
    </div>
  )
}

// ── Printable Report (Bitnex letterhead) ─────────────────────────────────────
function PrintableReport({ range, stats, expenses, category, pieData }) {
  return (
    <div className="letter-print"
      style={{
        background: '#ffffff', color: '#1a1a1a',
        fontFamily: '"Times New Roman", Georgia, serif',
        padding: '40px 50px', minHeight: '100%',
      }}>
      {/* Letterhead */}
      <div style={{
        borderBottom: '3px solid #f97316', paddingBottom: 16, marginBottom: 22,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#0d0f14' }}>
            BITNEX <span style={{ color: '#f97316' }}>TECHNOLOGIES</span>
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 3, letterSpacing: '1.2px' }}>
            FINANCIAL REPORT
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#555', lineHeight: 1.5 }}>
          Generated: {fmtDate(new Date())}<br/>
          Lahore, Pakistan
        </div>
      </div>

      {/* Title */}
      <h1 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, letterSpacing: 2, margin: '8px 0 18px', textTransform: 'uppercase' }}>
        Expense Report
      </h1>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20, fontSize: 12 }}>
        <div><strong>Period:</strong> {range.label}{range.from && ` (${range.from} → ${range.to})`}</div>
        <div><strong>Category:</strong> {category === 'all' ? 'All' : category.replace(/_/g, ' ')}</div>
        <div><strong>Total Entries:</strong> {stats.count}</div>
        <div><strong>Total Amount:</strong> {fmtMoney(stats.total)}</div>
        <div><strong>Approved:</strong> {fmtMoney(stats.approved)}</div>
        <div><strong>Pending:</strong> {fmtMoney(stats.pending)}</div>
      </div>

      {/* Category breakdown */}
      <h2 style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 8px', color: '#0d0f14', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>
        Category Breakdown
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 18 }}>
        <thead>
          <tr style={{ background: '#fff7ed', borderBottom: '1.5px solid #f97316' }}>
            <th style={{ textAlign: 'left',  padding: '6px 8px' }}>Category</th>
            <th style={{ textAlign: 'right', padding: '6px 8px' }}>Amount (PKR)</th>
            <th style={{ textAlign: 'right', padding: '6px 8px' }}>% Share</th>
          </tr>
        </thead>
        <tbody>
          {pieData.map((c, i) => {
            const pct = stats.total ? (c.value / stats.total * 100).toFixed(1) : 0
            return (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '5px 8px', textTransform: 'capitalize' }}>{c.name}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{fmtMoney(c.value)}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right' }}>{pct}%</td>
              </tr>
            )
          })}
          <tr style={{ borderTop: '2px solid #333', fontWeight: 700 }}>
            <td style={{ padding: '6px 8px' }}>Total</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>{fmtMoney(stats.total)}</td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>100%</td>
          </tr>
        </tbody>
      </table>

      {/* Detail */}
      <h2 style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 8px', color: '#0d0f14', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>
        Detailed Records
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr style={{ background: '#fff7ed', borderBottom: '1.5px solid #f97316' }}>
            <th style={{ textAlign: 'left',  padding: '5px 6px', width: 70 }}>Date</th>
            <th style={{ textAlign: 'left',  padding: '5px 6px' }}>Title</th>
            <th style={{ textAlign: 'left',  padding: '5px 6px', width: 90 }}>Category</th>
            <th style={{ textAlign: 'right', padding: '5px 6px', width: 80 }}>Amount</th>
            <th style={{ textAlign: 'left',  padding: '5px 6px', width: 70 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '4px 6px' }}>{fmtDate(e.date)}</td>
              <td style={{ padding: '4px 6px' }}>{e.title}</td>
              <td style={{ padding: '4px 6px', textTransform: 'capitalize' }}>{(e.category || '').replace(/_/g, ' ')}</td>
              <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmtMoney(e.amount)}</td>
              <td style={{ padding: '4px 6px' }}>{e.is_approved ? 'Approved' : 'Pending'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 12, borderTop: '1px solid #ddd', fontSize: 9, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
        <span>This is a computer-generated financial report.</span>
        <span>© Bitnex Technologies</span>
      </div>
    </div>
  )
}
