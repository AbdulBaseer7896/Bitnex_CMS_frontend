import { useEffect, useMemo, useState, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineCheck, HiOutlineX, HiOutlineSearch, HiOutlinePlus,
  HiOutlineCalendar, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineRefresh, HiOutlineClock, HiOutlineCheckCircle,
  HiOutlineEye, HiOutlineClipboardList,
} from 'react-icons/hi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'

const ORANGE = '#f97316'

const STATUS_COLORS = {
  pending:   'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  approved:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  rejected:  'bg-red-500/15 text-red-400 border border-red-500/25',
  cancelled: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
}
const STATUS_HEX = {
  pending:'#eab308', approved:'#10b981', rejected:'#ef4444', cancelled:'#64748b',
}
const LEAVE_TYPE_HEX = {
  annual:'#3b82f6', medical:'#f43f5e', casual:'#8b5cf6', maternity:'#ec4899',
  paternity:'#06b6d4', sick:'#10b981', emergency:'#eab308', unpaid:'#64748b',
  compensatory:'#a855f7',
}
const LEAVE_TYPES = ['annual','medical','casual','sick','emergency','maternity','paternity','compensatory','unpaid']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const PAGE_SIZES = [10, 25, 50, 100]

// Date helpers — all return YYYY-MM-DD strings
const isoToday = () => new Date().toISOString().slice(0,10)
const isoStartOfWeek = () => {
  const d = new Date(); d.setDate(d.getDate() - 6)
  return d.toISOString().slice(0,10)
}
const isoStartOfMonth = () => {
  const d = new Date(); d.setDate(1)
  return d.toISOString().slice(0,10)
}
const isoEndOfMonth = () => {
  const d = new Date(); d.setMonth(d.getMonth() + 1, 0)
  return d.toISOString().slice(0,10)
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart tooltip
// ─────────────────────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-light rounded-xl px-3 py-2 shadow-2xl text-xs"
         style={{ border:'1px solid rgba(249,115,22,0.25)' }}>
      {label && <div className="text-white font-semibold mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }}/>
          <span className="text-slate-400 capitalize">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Period filter (Weekly / Monthly / Custom)
// ─────────────────────────────────────────────────────────────────────────────
function PeriodFilter({ value, onChange }) {
  const setKind = (kind) => {
    if (kind === 'week')        onChange({ kind, start: isoStartOfWeek(),  end: isoToday() })
    else if (kind === 'month')  onChange({ kind, start: isoStartOfMonth(), end: isoEndOfMonth() })
    else                        onChange({ kind: 'custom', start: value.start || isoStartOfMonth(), end: value.end || isoToday() })
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 glass-light rounded-xl p-1">
        {[
          { id:'week',   label:'Weekly' },
          { id:'month',  label:'Monthly' },
          { id:'custom', label:'Custom' },
        ].map(t => (
          <button key={t.id} onClick={() => setKind(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              value.kind === t.id ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
            style={value.kind === t.id ? { background:'rgba(249,115,22,0.18)', border:'1px solid rgba(249,115,22,0.3)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>
      {value.kind === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input type="date" className="input py-1.5 px-2 text-xs"
                 value={value.start} onChange={e => onChange({ ...value, start: e.target.value })}/>
          <span className="text-slate-500 text-xs">→</span>
          <input type="date" className="input py-1.5 px-2 text-xs"
                 value={value.end} onChange={e => onChange({ ...value, end: e.target.value })}/>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Row — KPI tiles + 3 charts
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsRow({ period }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const qp = new URLSearchParams({
      range: period.kind, start: period.start, end: period.end,
    })
    api.get('/leaves/analytics/?' + qp.toString())
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period.kind, period.start, period.end])

  if (loading) return (
    <div className="glass rounded-2xl p-8 flex justify-center">
      <div className="w-7 h-7 border-2 rounded-full animate-spin"
           style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor: ORANGE }}/>
    </div>
  )
  if (!data) return null

  const kpi = data.kpi || {}
  const byStatus = (data.by_status || []).map(s => ({
    name: s.status[0].toUpperCase() + s.status.slice(1),
    value: s.count,
    fill: STATUS_HEX[s.status] || '#888',
  })).filter(s => s.value > 0)
  const daily = (data.daily_trend || []).map(d => ({
    label: d.date.slice(5),
    Approved: d.approved,
    Pending: d.pending,
  }))
  const byDept = (data.by_department || []).slice(0, 8).map(d => ({
    name: d.department.length > 12 ? d.department.slice(0,10)+'…' : d.department,
    Days: d.days,
  }))

  const KPIs = [
    { label:'Total Requests',   value: kpi.total_count || 0,           color: ORANGE,  icon: HiOutlineClipboardList, sub:`${kpi.approved_days || 0} days approved` },
    { label:'Pending',          value: kpi.pending || 0,               color:'#eab308', icon: HiOutlineClock,         sub:'awaiting review' },
    { label:'Approval Rate',    value: (kpi.approval_rate||0)+'%',     color:'#10b981', icon: HiOutlineCheckCircle,   sub:`${kpi.approved||0} / ${(kpi.approved||0)+(kpi.rejected||0)} decided` },
    { label:'On Leave Today',   value: kpi.on_leave_today || 0,        color:'#06b6d4', icon: HiOutlineCalendar,      sub:'across all approved' },
  ]

  return (
    <div className="space-y-4">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIs.map(k => (
          <div key={k.label} className="stat-card">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: k.color + '20', border: '1px solid ' + k.color + '30' }}>
                <k.icon className="w-4 h-4" style={{ color: k.color }}/>
              </div>
            </div>
            <div className="font-display text-2xl font-bold text-white">{k.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{k.label}</div>
            <div className="text-slate-600 text-[11px] mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Status donut */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-bold text-white mb-3">Status Distribution</h3>
          {byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byStatus} cx="42%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {byStatus.map((e, i) => <Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip content={<ChartTip/>}/>
                <Legend layout="vertical" align="right" verticalAlign="middle"
                  formatter={v => <span className="text-slate-400 text-xs">{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">No leaves in period</div>
          )}
        </div>

        {/* Daily area */}
        <div className="card lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-white">Daily Activity</h3>
            <span className="text-slate-500 text-xs">{data.period?.label}</span>
          </div>
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAppr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="label" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey="Approved" stroke="#10b981" strokeWidth={2} fill="url(#gAppr)"/>
                <Area type="monotone" dataKey="Pending"  stroke="#eab308" strokeWidth={2} fill="url(#gPend)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Department + 12-month trend */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card lg:col-span-3">
          <h3 className="font-display font-bold text-white mb-3">Leave Days by Department</h3>
          {byDept.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDept} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<ChartTip/>} cursor={{ fill:'rgba(249,115,22,0.04)' }}/>
                <Bar dataKey="Days" fill={ORANGE} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">No department data</div>
          )}
        </div>

        {/* Leave-type breakdown */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-bold text-white mb-3">By Leave Type</h3>
          {(data.by_type || []).length > 0 ? (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {(data.by_type || []).slice(0, 6).map(t => {
                const max = Math.max(...data.by_type.map(x => x.count))
                const pct = max > 0 ? (t.count / max) * 100 : 0
                const c = LEAVE_TYPE_HEX[t.leave_type] || '#888'
                return (
                  <div key={t.leave_type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: c }}/>
                        <span className="text-slate-300 text-xs capitalize">{t.leave_type}</span>
                      </div>
                      <span className="text-white text-xs font-semibold">{t.count}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                           style={{ width: pct + '%', background: c }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">No data</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Review Modal
// ─────────────────────────────────────────────────────────────────────────────
function ReviewModal({ leave, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const act = async (action) => {
    setBusy(true)
    try {
      await api.post(`/leaves/applications/${leave.id}/${action}/`, { note })
      toast.success(`Leave ${action}d`)
      onDone(); onClose()
    } catch { toast.error('Action failed') }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white text-lg">Review Leave Request</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-5 h-5"/>
          </button>
        </div>
        <div className="glass rounded-xl p-4 mb-4 space-y-2 text-sm">
          <Row label="Employee" value={leave.employee_name}/>
          <Row label="Type" value={<span className="capitalize">{leave.leave_type}</span>}/>
          <Row label="Days" value={`${leave.days_requested}${leave.is_half_day ? ' (half)' : ''}`}/>
          <Row label="Dates" value={`${leave.start_date} → ${leave.end_date}`}/>
          <div className="pt-2" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-slate-500 mb-1 text-xs">Reason</div>
            <div className="text-slate-300 text-sm whitespace-pre-wrap">{leave.reason}</div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Review Note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            className="input h-20 resize-none text-sm" placeholder="Add a note for the employee…"/>
        </div>
        <div className="flex gap-3">
          <button onClick={() => act('reject')} disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 font-semibold text-sm border border-red-500/25 disabled:opacity-50">
            <HiOutlineX className="w-4 h-4"/> Reject
          </button>
          <button onClick={() => act('approve')} disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 font-semibold text-sm border border-emerald-500/25 disabled:opacity-50">
            <HiOutlineCheck className="w-4 h-4"/> Approve
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply Modal
// ─────────────────────────────────────────────────────────────────────────────
function ApplyModal({ onClose, onApplied }) {
  const [form, setForm] = useState({
    leave_type:'annual', start_date:'', end_date:'', reason:'', is_half_day:false,
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/leaves/applications/', form)
      toast.success('Application submitted')
      onApplied(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-lg">Apply for Leave</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-5 h-5"/>
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Leave Type</label>
            <select value={form.leave_type} onChange={e => f('leave_type', e.target.value)} className="input text-sm py-2.5">
              {LEAVE_TYPES.map(t => <option key={t} value={t} className="bg-[#0d0f14] capitalize">{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Start Date</label>
              <input type="date" required className="input text-sm py-2.5"
                value={form.start_date} onChange={e => f('start_date', e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">End Date</label>
              <input type="date" required className="input text-sm py-2.5"
                value={form.end_date} onChange={e => f('end_date', e.target.value)}/>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_half_day}
              onChange={e => f('is_half_day', e.target.checked)}
              className="w-4 h-4 accent-orange-500"/>
            Half day
          </label>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Reason</label>
            <textarea required value={form.reason} onChange={e => f('reason', e.target.value)}
              className="input h-24 resize-none text-sm" placeholder="Describe your reason…"/>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-50">
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LeaveManagementPage() {
  const { user } = useAuth()
  const isHRorAdmin = ['admin','hr'].includes(user.role)
  const canReview   = isHRorAdmin || user.is_dept_head
  const canApply    = user.role !== 'admin'

  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [period, setPeriod] = useState({
    kind: 'month', start: isoStartOfMonth(), end: isoEndOfMonth(),
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [reviewModal, setReviewModal] = useState(null)
  const [applyModal, setApplyModal] = useState(false)

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/leaves/applications/')
      setLeaves(data.results || data)
    } catch { toast.error('Failed to load leaves') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  // Filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leaves.filter(l => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (typeFilter !== 'all' && l.leave_type !== typeFilter) return false
      if (q && !(
        l.employee_name?.toLowerCase().includes(q) ||
        l.employee_department?.toLowerCase().includes(q) ||
        l.leave_type?.toLowerCase().includes(q) ||
        l.reason?.toLowerCase().includes(q)
      )) return false
      if (period.start && period.end) {
        if (l.end_date < period.start || l.start_date > period.end) return false
      }
      return true
    })
  }, [leaves, statusFilter, typeFilter, search, period])

  // Sort — pending first, then newest applied
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (b.status === 'pending' && a.status !== 'pending') return 1
      return new Date(b.applied_at) - new Date(a.applied_at)
    })
  }, [filtered])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  useEffect(() => { if (page !== safePage) setPage(safePage) }, [page, safePage])
  useEffect(() => { setPage(1) }, [statusFilter, typeFilter, search, period, pageSize])
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Live counts
  const counts = useMemo(() => ({
    all:       leaves.length,
    pending:   leaves.filter(l => l.status === 'pending').length,
    approved:  leaves.filter(l => l.status === 'approved').length,
    rejected:  leaves.filter(l => l.status === 'rejected').length,
    cancelled: leaves.filter(l => l.status === 'cancelled').length,
  }), [leaves])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isHRorAdmin ? 'Review requests and track team leave activity' : 'Apply for leave and track your requests'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canApply && (
            <button onClick={() => setApplyModal(true)}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
              <HiOutlinePlus className="w-4 h-4"/> Apply for Leave
            </button>
          )}
          <button onClick={fetchLeaves} className="p-2 rounded-xl text-slate-400 hover:text-white glass">
            <HiOutlineRefresh className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* Period filter — drives both analytics + table filter */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HiOutlineCalendar className="w-4 h-4 text-slate-500"/>
          <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Period</span>
        </div>
        <PeriodFilter value={period} onChange={setPeriod}/>
      </div>

      {/* Analytics charts — HR/Admin only */}
      {isHRorAdmin && <AnalyticsRow period={period}/>}

      {/* Pending banner */}
      {counts.pending > 0 && (statusFilter === 'all' || statusFilter === 'pending') && (
        <div className="glass rounded-2xl p-3 flex items-center gap-3" style={{ borderLeft:'3px solid #eab308' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background:'rgba(234,179,8,0.15)' }}>
            <HiOutlineClock className="w-4 h-4 text-amber-400"/>
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-semibold">
              {counts.pending} pending request{counts.pending !== 1 ? 's' : ''} awaiting review
            </div>
            <div className="text-slate-500 text-xs">Pending requests are pinned to the top.</div>
          </div>
        </div>
      )}

      {/* Filters above table */}
      <div className="glass rounded-2xl p-3 flex items-center gap-3 flex-wrap">
        {/* Status pills */}
        <div className="flex items-center gap-1 glass-light rounded-xl p-1 flex-wrap">
          {[
            { id:'all',       label:'All',       color:'#94a3b8' },
            { id:'pending',   label:'Pending',   color:'#eab308' },
            { id:'approved',  label:'Approved',  color:'#10b981' },
            { id:'rejected',  label:'Rejected',  color:'#ef4444' },
            { id:'cancelled', label:'Cancelled', color:'#64748b' },
          ].map(t => (
            <button key={t.id} onClick={() => setStatusFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === t.id ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
              style={statusFilter === t.id ? { background:'rgba(249,115,22,0.18)', border:'1px solid rgba(249,115,22,0.3)' } : {}}>
              {t.label}
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background:'rgba(255,255,255,0.08)', color: t.color }}>{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="input py-1.5 text-xs w-auto pr-8">
          <option value="all" className="bg-[#0d0f14]">All Types</option>
          {LEAVE_TYPES.map(t => <option key={t} value={t} className="bg-[#0d0f14] capitalize">{t}</option>)}
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, department, reason…"
            className="input pl-9 py-1.5 text-sm"/>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
                 style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor: ORANGE }}/>
          </div>
        ) : pageRows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <HiOutlineClipboardList className="w-12 h-12 text-slate-700 mb-3"/>
            <h3 className="text-white font-semibold">No matching leave requests</h3>
            <p className="text-slate-500 text-sm mt-1">Try a different filter or period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <tr>
                  {canReview && (
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  )}
                  <th className="text-left px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="text-left px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Dates</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Days</th>
                  <th className="text-left px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Applied</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((l, i) => (
                  <tr key={l.id}
                      className={`table-row-hover transition-colors ${l.status === 'pending' ? 'bg-amber-500/[0.03]' : ''}`}
                      style={{ borderBottom: i === pageRows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    {canReview && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow"
                               style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                            {l.employee_name?.[0]?.toUpperCase() || 'E'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">{l.employee_name}</div>
                            <div className="text-slate-500 text-xs truncate">{l.employee_department || '—'}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold capitalize"
                            style={{
                              background:(LEAVE_TYPE_HEX[l.leave_type] || '#888')+'20',
                              color: LEAVE_TYPE_HEX[l.leave_type] || '#94a3b8',
                              border: `1px solid ${(LEAVE_TYPE_HEX[l.leave_type] || '#888')}30`,
                            }}>
                        {l.leave_type}
                      </span>
                    </td>
                    <td className="px-2 py-3 hidden md:table-cell">
                      <div className="text-slate-300 text-sm">{l.start_date}</div>
                      <div className="text-slate-500 text-xs">to {l.end_date}</div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="font-display font-bold text-white">{l.days_requested}</div>
                      <div className="text-slate-600 text-[10px]">{l.is_half_day ? 'half day' : 'days'}</div>
                    </td>
                    <td className="px-2 py-3 text-slate-400 text-xs hidden lg:table-cell">
                      {l.applied_at ? new Date(l.applied_at).toLocaleDateString('en-PK', { day:'2-digit', month:'short' }) : '—'}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className={`badge capitalize ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canReview && l.status === 'pending' && (
                          <button onClick={() => setReviewModal(l)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background:'rgba(249,115,22,0.15)', color: ORANGE, border:'1px solid rgba(249,115,22,0.25)' }}>
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
               style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-slate-500 text-xs">
              Showing <span className="text-white font-semibold">{(safePage - 1) * pageSize + 1}</span>
              {' '}–{' '}
              <span className="text-white font-semibold">{Math.min(safePage * pageSize, sorted.length)}</span>
              {' '}of{' '}
              <span className="text-white font-semibold">{sorted.length}</span>
              {sorted.length !== leaves.length && (
                <span className="text-slate-600"> · filtered from {leaves.length}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">Rows</span>
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                        className="input py-1 px-2 text-xs w-auto">
                  {PAGE_SIZES.map(n => <option key={n} value={n} className="bg-[#0d0f14]">{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="p-1.5 rounded-lg glass-light text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white">
                  <HiOutlineChevronLeft className="w-4 h-4"/>
                </button>
                <span className="px-3 text-slate-300 text-xs font-semibold">
                  Page {safePage} of {totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                  className="p-1.5 rounded-lg glass-light text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white">
                  <HiOutlineChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {reviewModal && (
        <ReviewModal leave={reviewModal}
          onClose={() => setReviewModal(null)} onDone={fetchLeaves}/>
      )}
      {applyModal && (
        <ApplyModal onClose={() => setApplyModal(false)} onApplied={fetchLeaves}/>
      )}
    </div>
  )
}
