import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlineCurrencyDollar, HiOutlineSearch,
  HiOutlinePencil, HiOutlineTrash, HiOutlineCheck, HiOutlineX,
  HiOutlineDocumentReport, HiOutlineCalendar, HiOutlineFilter,
  HiOutlineRefresh, HiOutlineChartPie, HiOutlineReceiptRefund,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
         BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAuth } from '../../context/AuthContext'
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
const todayISO = () => new Date().toISOString().slice(0, 10)

// Recognise auto-generated reimbursement expenses by description tag.
const isReimbExpense = (e) =>
  typeof e.description === 'string' && e.description.includes('[Employee Reimbursement]')

export default function ExpensesPage() {
  const { user } = useAuth()
  const canEdit = ['admin', 'accountant'].includes(user?.role)

  const [period, setPeriod]       = useState('month')
  const [custom, setCustom]       = useState({ from: '', to: '' })
  const [category, setCategory]   = useState('all')
  const [search, setSearch]       = useState('')

  const [expenses, setExpenses]   = useState([])
  const [reimbStats, setReimbStats] = useState({})
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)

  const range = useMemo(() => rangeFor(period, custom), [period, custom.from, custom.to])

  useEffect(() => { fetchData() }, [period, custom.from, custom.to, category])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (range.from) params.from = range.from
      if (range.to)   params.to   = range.to
      if (category !== 'all') params.category = category
      const [{ data: exp }, { data: rb }] = await Promise.all([
        api.get('/expenses/', { params }),
        api.get('/reimbursements/stats/').catch(() => ({ data: {} })),
      ])
      setExpenses(exp.results || exp)
      setReimbStats(rb || {})
    } catch { toast.error('Failed to load expenses') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return expenses
    return expenses.filter(e =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.added_by_name || '').toLowerCase().includes(q)
    )
  }, [expenses, search])

  const stats = useMemo(() => {
    const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0)
    const approved = filtered.filter(e => e.is_approved).reduce((s, e) => s + Number(e.amount || 0), 0)
    const reimbInExpenses = filtered.filter(isReimbExpense).reduce((s, e) => s + Number(e.amount || 0), 0)
    const byCat = {}
    filtered.forEach(e => {
      // Surface auto-created reimbursement rows as a distinct pseudo-category
      // for the chart, so accountants see them clearly.
      const cat = isReimbExpense(e) ? 'reimbursements' : e.category
      byCat[cat] = (byCat[cat] || 0) + Number(e.amount || 0)
    })
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
    return { total, approved, count: filtered.length, byCat, topCat: top ? top[0] : '—', reimbInExpenses }
  }, [filtered])

  const pieData = Object.entries(stats.byCat)
    .map(([c, v]) => ({
      name: c.replace(/_/g, ' '),
      value: v,
      fill: c === 'reimbursements' ? '#a78bfa' : (CAT_COLORS[c] || '#94a3b8'),
    }))
    .sort((a, b) => b.value - a.value)

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return
    try { await api.delete(`/expenses/${id}/`); toast.success('Deleted'); fetchData() }
    catch { toast.error('Failed to delete') }
  }
  const handleApprove = async (id) => {
    try { await api.post(`/expenses/${id}/approve/`); toast.success('Approved'); fetchData() }
    catch { toast.error('Failed to approve') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">{range.label} · {stats.count} record{stats.count === 1 ? '' : 's'}</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditing(null); setShowModal(true) }}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <HiOutlinePlus className="w-4 h-4"/> Add Expense
          </button>
        )}
      </div>

      {/* Reimbursement banner — pending review claims that will land here once settled */}
      {canEdit && (reimbStats.pending_count > 0 || reimbStats.forwarded_count > 0) && (
        <Link to="/reimbursements"
          className="glass rounded-2xl p-3 flex items-center gap-3 flex-wrap text-sm hover:border-violet-500/30 transition-colors"
          style={{ borderLeft: '3px solid #a78bfa' }}>
          <HiOutlineReceiptRefund className="w-5 h-5 text-violet-400 flex-shrink-0"/>
          <div className="flex-1">
            <span className="text-white font-semibold">
              {reimbStats.pending_count || 0} pending reimbursement{reimbStats.pending_count === 1 ? '' : 's'}
            </span>
            {reimbStats.total_pending_pkr > 0 && (
              <span className="text-slate-400 ml-2">· {fmtMoney(reimbStats.total_pending_pkr)} awaiting review</span>
            )}
            {reimbStats.forwarded_count > 0 && (
              <span className="text-slate-400 ml-2">· {reimbStats.forwarded_count} forwarded to HR</span>
            )}
          </div>
          <span className="text-violet-400 text-xs font-semibold">Review →</span>
        </Link>
      )}

      {/* Period filter bar */}
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={fmtMoney(stats.total)} color="#f97316" Icon={HiOutlineCurrencyDollar}/>
        <StatCard label="Approved" value={fmtMoney(stats.approved)} color="#10b981" Icon={HiOutlineCheck}/>
        <StatCard label="Reimbursements" value={fmtMoney(stats.reimbInExpenses)}
          sub="settled, in totals" color="#a78bfa" Icon={HiOutlineReceiptRefund}/>
        <StatCard label="Records" value={stats.count} color="#3b82f6" Icon={HiOutlineDocumentReport}/>
      </div>

      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4">
            <h3 className="font-display font-bold text-white text-sm mb-3">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="40%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value">
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
            <h3 className="font-display font-bold text-white text-sm mb-3">Top Categories</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pieData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50}/>
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                  formatter={v => [fmtMoney(v), 'Total']}/>
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pieData.slice(0, 8).map((e, i) => <Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input className="input pl-9 py-2 text-sm" placeholder="Search title, description, category..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <HiOutlineFilter className="w-4 h-4 text-slate-500 ml-1"/>
        <select className="input py-2 text-sm w-auto" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900 capitalize">{c.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-500 text-sm py-12">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-600 text-sm py-12">
              <HiOutlineCurrencyDollar className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              No expenses found for the selected period
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <th className="text-left px-4 py-2.5 font-semibold">Title</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Amount</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Added By</th>
                  <th className="text-center px-4 py-2.5 font-semibold">Status</th>
                  {canEdit && <th className="text-right px-4 py-2.5 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const reimb = isReimbExpense(e)
                  return (
                    <tr key={e.id} className="table-row-hover border-b border-white/[0.03] last:border-0">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm flex items-center gap-2">
                          {e.title}
                          {reimb && <span className="badge bg-violet-500/15 text-violet-400 border border-violet-500/25 text-[10px]">Reimbursement</span>}
                        </div>
                        {e.description && <div className="text-[11px] text-slate-500 truncate max-w-xs">{e.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg capitalize"
                          style={{
                            background: reimb ? '#a78bfa20' : `${CAT_COLORS[e.category] || '#94a3b8'}20`,
                            color:      reimb ? '#a78bfa'   : (CAT_COLORS[e.category] || '#94a3b8'),
                          }}>
                          {reimb ? 'Reimbursement' : e.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-display font-bold text-white">{fmtMoney(e.amount)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(e.date)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{e.added_by_name || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {e.is_approved
                          ? <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Approved</span>
                          : <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/25">Pending</span>}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {!e.is_approved && (
                              <button onClick={() => handleApprove(e.id)} title="Approve"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10">
                                <HiOutlineCheck className="w-4 h-4"/>
                              </button>
                            )}
                            {!reimb && (
                              <button onClick={() => { setEditing(e); setShowModal(true) }} title="Edit"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                                <HiOutlinePencil className="w-4 h-4"/>
                              </button>
                            )}
                            <button onClick={() => handleDelete(e.id)} title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                              <HiOutlineTrash className="w-4 h-4"/>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 font-semibold">
                  <td colSpan={2} className="px-4 py-3 text-slate-400 text-xs uppercase tracking-wider">Total</td>
                  <td className="px-4 py-3 text-right font-display font-bold text-orange-400">{fmtMoney(stats.total)}</td>
                  <td colSpan={canEdit ? 4 : 3}/>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ExpenseModal expense={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchData() }}/>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color, Icon, capitalize }) {
  return (
    <div className="stat-card">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}20`, color }}>
        <Icon className="w-5 h-5"/>
      </div>
      <div className={`font-display text-xl font-bold text-white ${capitalize ? 'capitalize' : ''}`}>{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function ExpenseModal({ expense, onClose, onSaved }) {
  const isEdit = !!expense
  const [form, setForm] = useState({
    title:       expense?.title || '',
    amount:      expense?.amount || '',
    category:    expense?.category || 'other',
    description: expense?.description || '',
    date:        expense?.date || todayISO(),
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (isEdit) await api.patch(`/expenses/${expense.id}/`, form)
      else        await api.post('/expenses/', form)
      toast.success(isEdit ? 'Expense updated' : 'Expense added')
      onSaved()
    } catch { toast.error(isEdit ? 'Failed to update' : 'Failed to add') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-xl">{isEdit ? 'Edit' : 'Add'} Expense</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-6 h-6"/>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title *</label>
            <input required className="input" placeholder="Expense title"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Amount (PKR) *</label>
              <input required type="number" step="0.01" className="input" placeholder="0"
                value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Category</label>
              <select className="input" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900 capitalize">{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Date *</label>
            <input required type="date" className="input"
              value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Description</label>
            <textarea rows={3} className="input resize-none" placeholder="Optional description..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
