import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerDashboard from './CustomerDashboard'
import SalesDashboard from './SalesDashboard'
import AccountantDashboard from './AccountantDashboard'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import {
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineCurrencyDollar,
  HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineOfficeBuilding,
  HiOutlineCalendar, HiOutlineDocumentReport,
  HiOutlineDatabase, HiOutlineCreditCard, HiOutlineArrowRight,
  HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineCash,
  HiOutlineSparkles, HiOutlineMinus, HiOutlinePlus,
} from 'react-icons/hi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, LineChart, Line,
} from 'recharts'

const ORANGE = '#f97316'
const TEAL   = '#f97316'
const COLORS = ['#f97316','#7c3aed','#10b981','#3b82f6','#ec4899','#eab308','#06b6d4','#8b5cf6']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']

const STATUS_BADGE = {
  probation:     'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  permanent:     'bg-[#f97316]/15 text-[#f97316] border border-orange-500/20',
  contract:      'bg-sky-500/15 text-sky-400 border border-sky-500/20',
  notice_period: 'bg-red-500/15 text-red-400 border border-red-500/20',
  resigned:      'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  terminated:    'bg-red-900/20 text-red-300 border border-red-900/20',
}
const LEAVE_STATUS = {
  pending:'bg-amber-500/15 text-amber-400', approved:'bg-[#f97316]/15 text-[#f97316]',
  rejected:'bg-red-500/15 text-red-400', cancelled:'bg-slate-500/15 text-slate-400',
}
const LEAVE_COLORS = {
  annual:'#f97316', medical:'#ec4899', casual:'#7c3aed', maternity:'#f97316',
  paternity:'#06b6d4', sick:'#10b981', emergency:'#eab308', unpaid:'#64748b', compensatory:'#8b5cf6',
}

const fmtPKR = v => 'PKR ' + Number(v||0).toLocaleString('en-PK', { maximumFractionDigits: 0 })
const fmtCompact = v => {
  const n = Number(v||0)
  if (n >= 1_000_000) return '₨' + (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M'
  if (n >= 1_000)     return '₨' + (n/1_000).toFixed(0) + 'k'
  return '₨' + n
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = ORANGE, change, onClick }) {
  return (
    <div className={'stat-card ' + (onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : '')} onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
             style={{ background: color + '20', border: '1px solid ' + color + '30' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change !== undefined && (
          <span className={'text-xs font-semibold px-2 py-1 rounded-lg ' + (change >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div className="font-display text-2xl font-bold text-white truncate" title={value}>{value}</div>
      <div className="text-slate-500 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-1">{sub}</div>}
    </div>
  )
}

function PeriodPicker({ month, year, onChange }) {
  const prev = () => {
    let m = month - 1, y = year
    if (m < 1) { m = 12; y -= 1 }
    onChange(m, y)
  }
  const next = () => {
    let m = month + 1, y = year
    if (m > 12) { m = 1; y += 1 }
    onChange(m, y)
  }
  const now = new Date()
  const isCurrent = month === now.getMonth()+1 && year === now.getFullYear()
  return (
    <div className="flex items-center gap-1.5 glass rounded-xl p-1 select-none">
      <button onClick={prev} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
        <HiOutlineChevronLeft className="w-4 h-4"/>
      </button>
      <div className="px-3 py-1 flex items-center gap-2">
        <HiOutlineCalendar className="w-4 h-4" style={{ color: ORANGE }}/>
        <span className="text-white font-semibold text-sm min-w-[110px] text-center">
          {MONTHS[month-1]} {year}
        </span>
        {isCurrent && (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{ background:'rgba(249,115,22,0.12)', color:ORANGE }}>
            Current
          </span>
        )}
      </div>
      <button onClick={next} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
        <HiOutlineChevronRight className="w-4 h-4"/>
      </button>
    </div>
  )
}

function LeaveBar({ allowance }) {
  const pct = allowance.total_entitled > 0
    ? Math.min((allowance.remaining_days / allowance.total_entitled) * 100, 100) : 0
  const color = LEAVE_COLORS[allowance.leave_type] || ORANGE
  return (
    <div className="glass-light rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="text-white text-sm font-medium capitalize">{allowance.leave_type.replace('_', ' ')}</span>
        </div>
        <span className="font-display font-bold text-white text-sm">
          {allowance.remaining_days} <span className="text-slate-500 font-normal text-xs">/ {allowance.total_entitled} days</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} />
      </div>
      {allowance.used_days > 0 && <div className="text-slate-600 text-xs mt-1">{allowance.used_days} days used</div>}
    </div>
  )
}

const monthlyData = [
  { month: 'Jan', revenue: 920000, expenses: 380000 },
  { month: 'Feb', revenue: 780000, expenses: 290000 },
  { month: 'Mar', revenue: 1100000, expenses: 410000 },
  { month: 'Apr', revenue: 1050000, expenses: 390000 },
  { month: 'May', revenue: 1300000, expenses: 450000 },
  { month: 'Jun', revenue: 1180000, expenses: 430000 },
]

// ─────────────────────────────────────────────────────────────────────────────
// HR DASHBOARD — fully redesigned
// ─────────────────────────────────────────────────────────────────────────────
function HRDashboard() {
  const navigate = useNavigate()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [stats,    setStats]    = useState({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/dashboard/?month=${month}&year=${year}`)
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [month, year])

  const trendData = useMemo(() => (stats.salary_trend || []).map(t => ({
    label: MONTHS_S[t.month - 1] + (t.year !== year ? ` '${String(t.year).slice(-2)}` : ''),
    paid: t.paid,
    pending: t.pending,
    total: t.total,
  })), [stats.salary_trend, year])

  const leaveData = useMemo(() => (stats.leaves_by_type || []).map(l => ({
    name: l.leave_type.charAt(0).toUpperCase() + l.leave_type.slice(1),
    value: l.count,
    color: LEAVE_COLORS[l.leave_type] || ORANGE,
  })), [stats.leaves_by_type])

  const period = stats.period_label || `${MONTHS[month-1]} ${year}`
  const totalPayroll = (stats.monthly_payroll_paid || 0) + (stats.monthly_payroll_pending || 0)
  const paidPct = totalPayroll > 0 ? Math.round((stats.monthly_payroll_paid || 0) / totalPayroll * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
           style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor: ORANGE }}/>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header with period filter ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">HR Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Payroll, headcount, and leave analytics · {period}</p>
        </div>
        <PeriodPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }}/>
      </div>

      {/* ── Headline payroll card ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-6 relative overflow-hidden"
             style={{
               background:'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(20,23,32,0.4))',
               border:'1px solid rgba(249,115,22,0.2)',
             }}>
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)' }}/>
          <div className="relative">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              <HiOutlineCurrencyDollar className="w-4 h-4"/>
              Total Payroll · {period}
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-3xl lg:text-4xl font-bold text-white tabular-nums">
                {fmtPKR(totalPayroll)}
              </span>
              <span className="text-emerald-400 text-sm font-semibold">
                {paidPct}% paid
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
              <div className="h-full transition-all duration-500"
                   style={{ width: paidPct + '%', background:'linear-gradient(90deg,#10b981,#34d399)' }}/>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-500 text-xs">Paid</div>
                <div className="text-emerald-400 font-display font-bold text-lg tabular-nums">
                  {fmtPKR(stats.monthly_payroll_paid || 0)}
                </div>
                <div className="text-slate-600 text-xs">{stats.paid_count || 0} employees</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Pending</div>
                <div className="text-amber-400 font-display font-bold text-lg tabular-nums">
                  {fmtPKR(stats.monthly_payroll_pending || 0)}
                </div>
                <div className="text-slate-600 text-xs">{stats.pending_count || 0} employees</div>
              </div>
            </div>

            <button onClick={() => navigate('/salary/manage')}
              className="mt-5 flex items-center gap-2 text-sm font-semibold transition-colors text-white hover:text-orange-300">
              Go to Manage Salary
              <HiOutlineArrowRight className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Adjustments card */}
        <div className="card">
          <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-semibold mb-4">
            <HiOutlineSparkles className="w-4 h-4"/>
            Adjustments · {MONTHS_S[month-1]}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl"
                 style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.15)' }}>
              <div className="flex items-center gap-2">
                <HiOutlinePlus className="w-4 h-4 text-emerald-400"/>
                <span className="text-slate-300 text-sm">Bonuses & Extras</span>
              </div>
              <span className="font-display font-bold text-emerald-400 tabular-nums">
                +{fmtCompact(stats.total_bonus || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl"
                 style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-2">
                <HiOutlineMinus className="w-4 h-4 text-red-400"/>
                <span className="text-slate-300 text-sm">Penalty & Leave</span>
              </div>
              <span className="font-display font-bold text-red-400 tabular-nums">
                −{fmtCompact(stats.total_deductions_applied || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl glass">
              <span className="text-slate-400 text-sm">Net Adjustment</span>
              <span className="font-display font-bold text-white tabular-nums">
                {Number(stats.total_bonus || 0) - Number(stats.total_deductions_applied || 0) >= 0 ? '+' : ''}
                {fmtCompact(Number(stats.total_bonus || 0) - Number(stats.total_deductions_applied || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat tiles row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={HiOutlineUsers}          label="Total Employees" value={stats.total_employees || 0}
                  sub={`${stats.permanent || 0} permanent`} color={ORANGE}/>
        <StatCard icon={HiOutlineClock}          label="On Probation"    value={stats.on_probation || 0} color="#eab308"/>
        <StatCard icon={HiOutlineExclamation}    label="On Notice"       value={stats.on_notice || 0}    color="#ef4444"/>
        <StatCard icon={HiOutlineCalendar}       label="On Leave Today"  value={stats.on_leave_today || 0} color="#06b6d4"/>
      </div>

      {/* ── Trend + leave pie ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Salary trend */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-white">Salary Expense Trend</h3>
              <p className="text-slate-500 text-xs mt-0.5">Last 6 months · paid vs pending</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
                <span className="text-slate-400">Paid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
                <span className="text-slate-400">Pending</span>
              </div>
            </div>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendData} barGap={4} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}
                       tickFormatter={v => '₨' + (v/1000).toFixed(0) + 'k'}/>
                <Tooltip cursor={{ fill:'rgba(249,115,22,0.04)' }}
                  contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:12 }}
                  formatter={v => [fmtPKR(v), '']}/>
                <Bar dataKey="paid"    stackId="a" fill="#10b981" radius={[0,0,0,0]}/>
                <Bar dataKey="pending" stackId="a" fill="#eab308" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-slate-500 text-sm">No data yet</div>
          )}
        </div>

        {/* Leaves pie */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">Leave Distribution</h3>
            <span className="text-slate-500 text-xs">{stats.approved_leaves || 0} approved</span>
          </div>
          {leaveData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={leaveData} cx="50%" cy="50%" innerRadius={36} outerRadius={62} dataKey="value" paddingAngle={2}>
                    {leaveData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid rgba(249,115,22,0.3)', borderRadius:10 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {leaveData.slice(0, 5).map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }}/>
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-44 text-slate-500 text-sm">
              <HiOutlineCalendar className="w-8 h-8 mb-2 text-slate-700"/>
              No leave activity this month
            </div>
          )}
        </div>
      </div>

      {/* ── Leave summary + Pending requests ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-display font-bold text-white mb-4">Leave Stats</h3>
          <div className="space-y-2">
            {[
              { label:'Pending Approval', value: stats.pending_leaves || 0, color:'#eab308', icon:HiOutlineClock },
              { label:'Approved This Month', value: stats.approved_leaves || 0, color:'#10b981', icon:HiOutlineCheckCircle },
              { label:'Rejected This Month', value: stats.rejected_this_month || 0, color:'#ef4444', icon:HiOutlineExclamation },
              { label:'On Leave Today', value: stats.on_leave_today || 0, color:'#06b6d4', icon:HiOutlineCalendar },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-xl glass-light">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: s.color + '20' }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }}/>
                  </div>
                  <span className="text-slate-300 text-sm">{s.label}</span>
                </div>
                <span className="font-display font-bold text-white text-lg">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending leave requests */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-white">Pending Leave Requests</h3>
            <button onClick={() => navigate('/hr/leaves')}
              className="text-xs font-semibold flex items-center gap-1 text-slate-400 hover:text-white">
              View all <HiOutlineArrowRight className="w-3 h-3"/>
            </button>
          </div>
          {(stats.recent_leave_requests || []).length > 0 ? (
            <div className="space-y-2">
              {stats.recent_leave_requests.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 glass rounded-xl hover:border-orange-500/20 transition-colors"
                     style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                      {l.employee_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{l.employee_name}</div>
                      <div className="text-slate-500 text-xs capitalize truncate">
                        {l.leave_type} · {l.days} day{l.days !== 1 ? 's' : ''} · {l.start_date}
                      </div>
                    </div>
                  </div>
                  <span className="badge bg-amber-500/15 text-amber-400 flex-shrink-0">Pending</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm">
              <HiOutlineCheckCircle className="w-8 h-8 mb-2 text-emerald-500/40"/>
              All caught up — no pending requests
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main DashboardPage
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'hr') { setLoading(false); return } // HR fetches on its own
    if (user?.role === 'accountant') { setLoading(false); return } // Accountant has its own dashboard
    api.get('/dashboard/').then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false))
  }, [user?.role])

  // ── CUSTOMER ──────────────────────────────────────────────────────────────
  if (user?.role === 'customer') return <CustomerDashboard user={user} />

  // ── HR ────────────────────────────────────────────────────────────────────
  if (user?.role === 'hr') return <HRDashboard/>

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-orange-500/30 border-t-[#f97316] rounded-full animate-spin" />
    </div>
  )

  // ── EMPLOYEE ──────────────────────────────────────────────────────────────
  if (user?.role === 'employee' || !['admin','hr','accountant','sales'].includes(user?.role)) {
    const allowances = stats.leave_allowances || []
    const recentLeaves = stats.recent_leaves || []
    const recentSlips = stats.recent_slips || []
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl p-6 relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, rgba(75,191,191,0.15), rgba(45,49,66,0.4))', border: '1px solid rgba(75,191,191,0.2)' }}>
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white mb-1">
                  Welcome back, {stats.full_name?.split(' ')[0] || user.username}! 👋
                </h2>
                <p className="text-slate-400 text-sm">{stats.designation} · {stats.department}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={'badge capitalize ' + (STATUS_BADGE[stats.employment_status] || STATUS_BADGE.permanent)}>
                  {stats.employment_status?.replace('_', ' ')}
                </span>
              </div>
            </div>
            {stats.employment_status === 'probation' && stats.probation_end_date && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-500/20">
                <HiOutlineClock className="w-4 h-4 flex-shrink-0" />
                Probation ends on <strong className="ml-1">{stats.probation_end_date}</strong>
              </div>
            )}
            {stats.employment_status === 'notice_period' && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
                <HiOutlineExclamation className="w-4 h-4 flex-shrink-0" />
                Notice period · {stats.notice_period_days} days
              </div>
            )}
          </div>
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(75,191,191,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={HiOutlineCalendar}      label="Pending Leaves"   value={stats.pending_requests || 0}     color="#eab308" />
          <StatCard icon={HiOutlineCheckCircle}   label="Approved (year)"  value={stats.approved_this_year || 0}   color="#10b981" />
          <StatCard icon={HiOutlineClock}         label="Days Taken"       value={stats.total_days_taken || 0}     color="#06b6d4" />
          <StatCard icon={HiOutlineCurrencyDollar} label="Recent Slips"    value={recentSlips.length}              color={ORANGE} />
        </div>

        {allowances.length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-white mb-4">My Leave Balance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allowances.map(a => <LeaveBar key={a.id} allowance={a}/>)}
            </div>
          </div>
        )}

        {recentSlips.length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-white mb-4">Recent Payslips</h3>
            <div className="space-y-2">
              {recentSlips.map(s => (
                <div key={s.id} className="flex items-center justify-between glass rounded-xl p-3">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {MONTHS[s.month-1]} {s.year}
                    </div>
                    <div className="text-slate-500 text-xs">
                      Net {fmtPKR(s.net_payable)}
                    </div>
                  </div>
                  <div className={'badge text-xs ' + (s.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400')}>
                    {s.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  if (user?.role === 'admin') {
    const byRole = stats.users_by_role || []
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={HiOutlineUsers}         label="Total Employees"  value={stats.employees || 0}        change={8}  color={ORANGE} />
          <StatCard icon={HiOutlineClipboardList}  label="Pending Leaves"  value={stats.pending_leaves || 0}              color="#eab308" />
          <StatCard icon={HiOutlineCurrencyDollar} label="Monthly Expenses" value={'₨' + Number(stats.monthly_expenses||0).toLocaleString()} change={-3} color="#7c3aed" />
          <StatCard icon={HiOutlineTrendingUp}     label="Total Revenue"   value={'₨' + Number(stats.total_revenue||0).toLocaleString()}    change={12} color="#10b981" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={HiOutlineClock}          label="On Probation"   value={stats.on_probation || 0}  color="#eab308" />
          <StatCard icon={HiOutlineExclamation}    label="On Notice"      value={stats.on_notice || 0}     color="#ef4444" />
          <StatCard icon={HiOutlineCalendar}       label="On Leave Today" value={stats.on_leave_today || 0} color="#06b6d4" />
          <StatCard icon={HiOutlineDocumentReport} label="Unpaid Slips"   value={stats.unpaid_slips || 0}  color="#f97316" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white">Revenue vs Expenses</h3>
              <span className="text-slate-500 text-xs">Last 6 months</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ORANGE} stopOpacity={0.3}/><stop offset="95%" stopColor={ORANGE} stopOpacity={0}/></linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => '₨' + (v/1000).toFixed(0) + 'k'} />
                <Tooltip contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid ' + ORANGE + '30', borderRadius:12 }} formatter={v => ['₨' + v.toLocaleString(), '']} />
                <Area type="monotone" dataKey="revenue" stroke={ORANGE} fill="url(#rev)" strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#ec4899" fill="url(#exp)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-display font-bold text-white mb-4">Staff by Role</h3>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={byRole} cx="50%" cy="50%" outerRadius={55} dataKey="count" nameKey="role">
                  {byRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid ' + ORANGE + '30', borderRadius:10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {byRole.map((r, i) => (
                <div key={r.role} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-400 capitalize">{r.role}</span>
                  </div>
                  <span className="text-white font-semibold">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {(stats.recent_activity || []).length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {stats.recent_activity.slice(0, 7).map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 glass rounded-xl">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: ORANGE }} />
                  <div>
                    <span className="text-white text-sm font-medium">{log.user_name}</span>
                    <span className="text-slate-500 text-sm"> — {log.description}</span>
                    <div className="text-slate-600 text-xs mt-0.5">{new Date(log.timestamp).toLocaleString('en-PK')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── ACCOUNTANT ────────────────────────────────────────────────────────────
  if (user?.role === 'accountant') {
    return <AccountantDashboard/>
  }

  // ── SALES ─────────────────────────────────────────────────────────────────
  return <SalesDashboard user={user} />
}
