import { useEffect, useState } from 'react'
import CustomerDashboard from './CustomerDashboard'
import SalesDashboard from './SalesDashboard'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import {
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineCurrencyDollar,
  HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineOfficeBuilding,
  HiOutlineCalendar, HiOutlineDocumentReport,
  HiOutlineDatabase, HiOutlineCreditCard, HiOutlineArrowRight,
} from 'react-icons/hi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const TEAL = '#4BBFBF'
const COLORS = ['#4BBFBF','#7c3aed','#10b981','#f97316','#ec4899','#eab308','#06b6d4','#8b5cf6']

const STATUS_BADGE = {
  probation:     'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  permanent:     'bg-[#4BBFBF]/15 text-[#4BBFBF] border border-[#4BBFBF]/20',
  contract:      'bg-sky-500/15 text-sky-400 border border-sky-500/20',
  notice_period: 'bg-red-500/15 text-red-400 border border-red-500/20',
  resigned:      'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  terminated:    'bg-red-900/20 text-red-300 border border-red-900/20',
}
const LEAVE_STATUS = {
  pending:'bg-amber-500/15 text-amber-400', approved:'bg-[#4BBFBF]/15 text-[#4BBFBF]',
  rejected:'bg-red-500/15 text-red-400', cancelled:'bg-slate-500/15 text-slate-400',
}
const LEAVE_COLORS = {
  annual:'#4BBFBF', medical:'#ec4899', casual:'#7c3aed', maternity:'#f97316',
  paternity:'#06b6d4', sick:'#10b981', emergency:'#eab308', unpaid:'#64748b', compensatory:'#8b5cf6',
}

function StatCard({ icon: Icon, label, value, sub, color = TEAL, change, onClick }) {
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
      <div className="font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-1">{sub}</div>}
    </div>
  )
}

function LeaveBar({ allowance }) {
  const pct = allowance.total_entitled > 0
    ? Math.min((allowance.remaining_days / allowance.total_entitled) * 100, 100) : 0
  const color = LEAVE_COLORS[allowance.leave_type] || TEAL
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

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/').then(({ data }) => setStats(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // ── CUSTOMER ──────────────────────────────────────────────────────────────
  if (user?.role === 'customer') return <CustomerDashboard user={user} />

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-[#4BBFBF]/30 border-t-[#4BBFBF] rounded-full animate-spin" />
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
          <StatCard icon={HiOutlineClipboardList} label="Pending Requests" value={stats.pending_requests || 0} color="#eab308" />
          <StatCard icon={HiOutlineCheckCircle} label="Approved This Year" value={stats.approved_this_year || 0} color={TEAL} />
          <StatCard icon={HiOutlineDocumentReport} label="Pay Slips" value={recentSlips.length} color="#7c3aed" />
          <StatCard icon={HiOutlineClock} label="Notice Period"
            value={stats.notice_period_days ? stats.notice_period_days + 'd' : 'N/A'}
            color={stats.employment_status === 'notice_period' ? '#ef4444' : '#64748b'} />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-white text-lg">Leave Balances</h3>
            <span className="text-xs text-slate-500">Year {new Date().getFullYear()}</span>
          </div>
          {allowances.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <HiOutlineClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No leave allowances set yet. Contact HR.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allowances.map(a => <LeaveBar key={a.id} allowance={a} />)}
            </div>
          )}
        </div>

        {recentLeaves.length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-white text-lg mb-4">Recent Leave Applications</h3>
            <div className="space-y-3">
              {recentLeaves.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 glass rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                         style={{ background: (LEAVE_COLORS[l.leave_type] || TEAL) + '20' }}>
                      <HiOutlineCalendar className="w-4 h-4" style={{ color: LEAVE_COLORS[l.leave_type] || TEAL }} />
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium capitalize">{l.leave_type.replace('_', ' ')} Leave</div>
                      <div className="text-slate-500 text-xs">{l.start_date} → {l.end_date} · {l.days} day{l.days !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <span className={'badge ' + (LEAVE_STATUS[l.status] || '')}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentSlips.length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-white text-lg mb-4">Recent Pay Slips</h3>
            <div className="space-y-3">
              {recentSlips.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 glass rounded-xl">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][s.month - 1]} {s.year}
                    </div>
                    <div className="text-slate-500 text-xs capitalize">{s.status}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-white">PKR {Number(s.net_payable || 0).toLocaleString()}</div>
                    <div className={'text-xs mt-0.5 ' + (s.status === 'paid' ? 'text-[#4BBFBF]' : 'text-amber-400')}>
                      {s.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                    </div>
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
          <StatCard icon={HiOutlineUsers}         label="Total Employees"  value={stats.employees || 0}        change={8}  color={TEAL} />
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
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TEAL} stopOpacity={0.3}/><stop offset="95%" stopColor={TEAL} stopOpacity={0}/></linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => '₨' + (v/1000).toFixed(0) + 'k'} />
                <Tooltip contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid ' + TEAL + '30', borderRadius:12 }} formatter={v => ['₨' + v.toLocaleString(), '']} />
                <Area type="monotone" dataKey="revenue" stroke={TEAL} fill="url(#rev)" strokeWidth={2} name="Revenue" />
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
                <Tooltip contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid ' + TEAL + '30', borderRadius:10 }} />
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
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: TEAL }} />
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

  // ── HR ────────────────────────────────────────────────────────────────────
  if (user?.role === 'hr') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={HiOutlineUsers}        label="Total Employees"   value={stats.total_employees||0}    color={TEAL} />
          <StatCard icon={HiOutlineClipboardList} label="Pending Leaves"   value={stats.pending_leaves||0}     color="#eab308" />
          <StatCard icon={HiOutlineClock}         label="On Probation"     value={stats.on_probation||0}       color="#f97316" />
          <StatCard icon={HiOutlineExclamation}   label="On Notice Period" value={stats.on_notice||0}          color="#ef4444" />
        </div>
        {(stats.recent_leave_requests || []).length > 0 && (
          <div className="card">
            <h3 className="font-display font-bold text-white mb-4">Pending Leave Requests</h3>
            <div className="space-y-3">
              {stats.recent_leave_requests.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 glass rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#0e1420] font-bold text-sm"
                         style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
                      {l.employee_name?.[0]}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{l.employee_name}</div>
                      <div className="text-slate-500 text-xs capitalize">{l.leave_type} · {l.days} days · {l.start_date}</div>
                    </div>
                  </div>
                  <span className="badge bg-amber-500/15 text-amber-400">Pending</span>
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
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={HiOutlineCurrencyDollar} label="Monthly Expenses" value={'₨' + Number(stats.monthly_expenses||0).toLocaleString()} color="#7c3aed" />
          <StatCard icon={HiOutlineTrendingUp}     label="Total Revenue"    value={'₨' + Number(stats.total_revenue||0).toLocaleString()} change={12} color="#10b981" />
          <StatCard icon={HiOutlineExclamation}    label="Unpaid Salaries"  value={stats.unpaid_salaries||0} color="#f97316" />
        </div>
      </div>
    )
  }

  // ── SALES ─────────────────────────────────────────────────────────────────
  return <SalesDashboard user={user} />
}
