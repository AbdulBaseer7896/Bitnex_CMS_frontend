import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlineSearch, HiOutlineFilter, HiOutlineCalendar,
  HiOutlineRefresh, HiOutlinePencil, HiOutlineTrash, HiOutlineEye,
  HiOutlineDocumentReport, HiOutlineCurrencyDollar, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineArrowRight,
} from 'react-icons/hi'
import { useAuth } from '../../context/AuthContext'
import { STATUS_META, fmtAmount, fmtPKR, fmtDate, StatusChip } from './utils'
import ClaimSubmitModal from './ClaimSubmitModal'
import ClaimDetailModal from './ClaimDetailModal'

const SCOPES_BY_ROLE = {
  admin:      ['all', 'mine'],
  accountant: ['all', 'mine'],
  hr:         ['hr_queue', 'mine'],
  sales:      ['mine'],
  employee:   ['mine'],
  customer:   ['mine'],
}

const SCOPE_LABEL = {
  all:      'All Claims',
  mine:     'My Claims',
  hr_queue: 'HR Queue',
}

const STATUS_TABS = (role) => {
  if (role === 'admin' || role === 'accountant') {
    return ['pending', 'approved', 'forwarded_to_hr', 'settled', 'paid_with_salary', 'rejected', 'all']
  }
  if (role === 'hr') {
    return ['forwarded_to_hr', 'paid_with_salary', 'all']
  }
  return ['pending', 'approved', 'forwarded_to_hr', 'settled', 'paid_with_salary', 'rejected', 'all']
}

const PERIODS = [
  { key: 'all',       label: 'All' },
  { key: 'week',      label: 'This Week' },
  { key: 'month',     label: 'This Month' },
  { key: 'quarter',   label: 'This Quarter' },
  { key: 'year',      label: 'This Year' },
  { key: 'custom',    label: 'Custom' },
]

const iso = (d) => d.toISOString().slice(0, 10)
const startOfWeek = (d) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x }
const rangeFor = (k, custom = {}) => {
  const n = new Date()
  if (k === 'week')    return { from: iso(startOfWeek(n)), to: iso(n) }
  if (k === 'month')   return { from: iso(new Date(n.getFullYear(), n.getMonth(), 1)), to: iso(n) }
  if (k === 'quarter') { const q = Math.floor(n.getMonth()/3); return { from: iso(new Date(n.getFullYear(), q*3, 1)), to: iso(n) } }
  if (k === 'year')    return { from: iso(new Date(n.getFullYear(), 0, 1)), to: iso(n) }
  if (k === 'custom')  return { from: custom.from || '', to: custom.to || '' }
  return { from: '', to: '' }
}

export default function ReimbursementsPage() {
  const { user } = useAuth()
  const role     = user?.role
  const isFinance = role === 'admin' || role === 'accountant'
  const isHR      = role === 'hr'

  const allowedScopes = SCOPES_BY_ROLE[role] || ['mine']
  const [scope, setScope]   = useState(allowedScopes[0])
  const [tab, setTab]       = useState('all')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [custom, setCustom] = useState({ from: '', to: '' })

  const [claims, setClaims] = useState([])
  const [stats, setStats]   = useState({})
  const [loading, setLoading] = useState(true)
  const [showSubmit, setShowSubmit] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [employees, setEmployees] = useState([])

  const range = useMemo(() => rangeFor(period, custom), [period, custom.from, custom.to])

  // Fetch employees only for finance (submitting on behalf)
  useEffect(() => {
    if (!isFinance) return
    api.get('/users/?page_size=500').then(({ data }) =>
      setEmployees((data.results || data).filter(u => u.role !== 'customer'))
    ).catch(() => {})
  }, [isFinance])

  const fetch = async () => {
    setLoading(true)
    try {
      const params = { scope }
      if (tab !== 'all') params.status = tab
      if (range.from)    params.from   = range.from
      if (range.to)      params.to     = range.to
      const [list, st] = await Promise.all([
        api.get('/reimbursements/',          { params }),
        api.get('/reimbursements/stats/'),
      ])
      setClaims(list.data.results || list.data)
      setStats(st.data)
    } catch { toast.error('Failed to load claims') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [scope, tab, period, custom.from, custom.to])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return claims
    return claims.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.reason || '').toLowerCase().includes(q) ||
      (c.employee_name || '').toLowerCase().includes(q)
    )
  }, [claims, search])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this claim? This cannot be undone.')) return
    try { await api.delete(`/reimbursements/${id}/`); toast.success('Deleted'); fetch() }
    catch { toast.error('Cannot delete') }
  }

  // ── Page title & subtitle adapt to role ─────────────────────────────────
  const pageTitle = isHR && scope === 'hr_queue'
    ? 'Additional Payments'
    : isFinance && scope === 'all'
      ? 'Reimbursement Claims'
      : 'My Reimbursements'

  const pageSubtitle = isHR && scope === 'hr_queue'
    ? 'Employee expenses approved for inclusion in payroll'
    : isFinance && scope === 'all'
      ? 'Review and settle out-of-pocket employee expenses'
      : 'Submit and track expenses you paid for the company'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">{pageTitle}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pageSubtitle}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowSubmit(true) }}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <HiOutlinePlus className="w-4 h-4"/> {isFinance ? 'Add Claim' : 'New Claim'}
        </button>
      </div>

      {/* Stats — role-aware labels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isHR ? (
          <>
            <StatCard label="Pending Inclusion" value={stats.forwarded_count || 0}
              sub={fmtPKR(stats.total_in_hr_queue_pkr)} color="#a78bfa" Icon={HiOutlineArrowRight}/>
            <StatCard label="Included in Salary" value={stats.settled_count || 0}
              sub="this period" color="#10b981" Icon={HiOutlineCheckCircle}/>
            <StatCard label="My Pending" value={stats.pending_count || 0}
              sub={fmtPKR(stats.total_pending_pkr)} color="#eab308" Icon={HiOutlineClock}/>
            <StatCard label="Total Settled (PKR)" value={fmtPKR(stats.total_settled_pkr)}
              color="#f97316" Icon={HiOutlineCurrencyDollar}/>
          </>
        ) : isFinance ? (
          <>
            <StatCard label="Pending Review" value={stats.pending_count || 0}
              sub={fmtPKR(stats.total_pending_pkr)} color="#eab308" Icon={HiOutlineClock}/>
            <StatCard label="In HR Queue" value={stats.forwarded_count || 0}
              sub={fmtPKR(stats.total_in_hr_queue_pkr)} color="#a78bfa" Icon={HiOutlineArrowRight}/>
            <StatCard label="Settled" value={stats.settled_count || 0}
              sub={fmtPKR(stats.total_settled_pkr)} color="#10b981" Icon={HiOutlineCheckCircle}/>
            <StatCard label="Rejected" value={stats.rejected_count || 0} color="#ef4444" Icon={HiOutlineDocumentReport}/>
          </>
        ) : (
          <>
            <StatCard label="Pending" value={stats.pending_count || 0} color="#eab308" Icon={HiOutlineClock}/>
            <StatCard label="Approved" value={stats.approved_count || 0} color="#06b6d4" Icon={HiOutlineCheckCircle}/>
            <StatCard label="Settled" value={stats.settled_count || 0} color="#10b981" Icon={HiOutlineCheckCircle}/>
            <StatCard label="Total Paid Out (PKR)" value={fmtPKR(stats.total_settled_pkr)}
              color="#f97316" Icon={HiOutlineCurrencyDollar}/>
          </>
        )}
      </div>

      {/* Scope toggle (finance + HR) */}
      {allowedScopes.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {allowedScopes.map(s => (
            <button key={s} onClick={() => setScope(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                scope === s
                  ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
              }`}>{SCOPE_LABEL[s]}</button>
          ))}
        </div>
      )}

      {/* Status tabs */}
      <div className="glass rounded-2xl p-1 flex flex-wrap gap-1">
        {STATUS_TABS(role).map(t => {
          const m = STATUS_META[t]
          const isAll = t === 'all'
          const label = isAll ? 'All' : (isHR && m?.hr) || m?.label || t
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                tab === t
                  ? 'bg-orange-500/15 text-orange-400'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}>
              {!isAll && <span className="w-1.5 h-1.5 rounded-full" style={{ background: m?.color }}/>}
              {label}
            </button>
          )
        })}
      </div>

      {/* Filter row */}
      <div className="glass rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input className="input pl-9 py-2 text-sm" placeholder="Search title, reason, employee..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <HiOutlineCalendar className="w-4 h-4 text-slate-500"/>
        <div className="flex gap-1 flex-wrap">
          {PERIODS.filter(p => p.key !== 'custom').map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                period === p.key
                  ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
              }`}>{p.label}</button>
          ))}
          <button onClick={() => setPeriod('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              period === 'custom'
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] border-transparent'
            }`}>Custom</button>
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-1.5 text-xs">
            <input type="date" className="input py-1.5 text-xs w-auto" value={custom.from}
              onChange={e => setCustom(p => ({ ...p, from: e.target.value }))}/>
            <span className="text-slate-600">→</span>
            <input type="date" className="input py-1.5 text-xs w-auto" value={custom.to}
              onChange={e => setCustom(p => ({ ...p, to: e.target.value }))}/>
          </div>
        )}
        <button onClick={fetch} className="ml-auto text-slate-500 hover:text-orange-400" title="Refresh">
          <HiOutlineRefresh className="w-4 h-4"/>
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-500 text-sm py-12">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-600 text-sm py-12">
              <HiOutlineDocumentReport className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              No claims found
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                  {(isFinance || (isHR && scope !== 'mine')) &&
                    <th className="text-left px-4 py-2.5 font-semibold">Employee</th>}
                  <th className="text-left px-4 py-2.5 font-semibold">Title</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Amount</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="table-row-hover border-b border-white/[0.03] last:border-0">
                    {(isFinance || (isHR && scope !== 'mine')) && (
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{c.employee_name}</div>
                        <div className="text-[11px] text-slate-500 capitalize">{c.employee_role} · {c.employee_dept || '—'}</div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="text-white font-medium text-sm">{c.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.reason}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-display font-bold text-white">{fmtAmount(c.amount, c.currency)}</div>
                      {c.currency === 'USD' && (
                        <div className="text-[10px] text-slate-500">≈ {fmtPKR(c.amount_pkr)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(c.claim_date)}</td>
                    <td className="px-4 py-3"><StatusChip status={c.status} hr={isHR}/></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewing(c)} title="View / Review"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                          <HiOutlineEye className="w-4 h-4"/>
                        </button>
                        {c.status === 'pending' && (c.employee === user?.id || isFinance) && (
                          <>
                            <button onClick={() => { setEditing(c); setShowSubmit(true) }} title="Edit"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                              <HiOutlinePencil className="w-4 h-4"/>
                            </button>
                            <button onClick={() => handleDelete(c.id)} title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                              <HiOutlineTrash className="w-4 h-4"/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showSubmit && (
        <ClaimSubmitModal claim={editing} canPickEmployee={isFinance} employees={employees}
          onClose={() => { setShowSubmit(false); setEditing(null) }}
          onSaved={() => { setShowSubmit(false); setEditing(null); fetch() }}/>
      )}
      {viewing && (
        <ClaimDetailModal claim={viewing} role={role}
          onClose={() => setViewing(null)}
          onChanged={() => { setViewing(null); fetch() }}/>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color, Icon }) {
  return (
    <div className="stat-card">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}20`, color }}>
        <Icon className="w-5 h-5"/>
      </div>
      <div className="font-display text-xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}
