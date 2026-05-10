import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import {
  HiOutlineDatabase, HiOutlineCurrencyDollar, HiOutlineClipboardList,
  HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineArrowRight,
  HiOutlineClock,
} from 'react-icons/hi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const TEAL = '#4BBFBF'
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function KPICard({ icon: Icon, label, value, sub, color = TEAL, onClick, alert }) {
  return (
    <div
      onClick={onClick}
      className={'stat-card relative ' + (onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : '')}
      style={alert ? { border: '1px solid rgba(239,68,68,0.3)' } : {}}>
      {onClick && (
        <div className="absolute top-3 right-3 text-[#4BBFBF] opacity-60">
          <HiOutlineArrowRight className="w-4 h-4" />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
             style={{ background: color + '20', border: '1px solid ' + color + '30' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function CustomerDashboard({ user }) {
  const navigate = useNavigate()
  const [seats, setSeats] = useState([])
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/store/customer-seats/'),
      api.get('/store/payment-claims/'),
    ]).then(([seatRes, claimRes]) => {
      setSeats(Array.isArray(seatRes.data) ? seatRes.data : seatRes.data.results || [])
      setClaims(Array.isArray(claimRes.data) ? claimRes.data : claimRes.data.results || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const activeSeats = seats.filter(s => s.is_active)
  const totalDue = activeSeats.reduce((sum, s) => sum + parseFloat(s.monthly_price || 0), 0)
  const approvedClaims = claims.filter(c => c.status === 'approved')
  const thisMonthPaid = approvedClaims
    .filter(c => new Date(c.payment_date).getMonth() === now.getMonth() &&
                 new Date(c.payment_date).getFullYear() === now.getFullYear())
    .reduce((sum, c) => sum + parseFloat(c.approved_amount || c.claimed_amount || 0), 0)
  const totalPaid = approvedClaims.reduce((sum, c) => sum + parseFloat(c.approved_amount || c.claimed_amount || 0), 0)
  const pendingClaims = claims.filter(c => c.status === 'pending')
  const expiredSeats = seats.filter(s => s.expiry_status === 'expired')
  const expiringSoon = seats.filter(s => s.expiry_status === 'expiring_soon' || s.expiry_status === 'expiring_month')

  // Build last 6 months payment chart data
  const monthlyPayments = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    const paid = approvedClaims
      .filter(c => {
        const cd = new Date(c.payment_date)
        return cd.getMonth() === m && cd.getFullYear() === y
      })
      .reduce((s, c) => s + parseFloat(c.approved_amount || c.claimed_amount || 0), 0)
    return { month: MONTHS[m], paid, due: totalDue }
  })

  // Seat status pie chart
  const seatStatusData = [
    { name: 'Active', value: activeSeats.length, color: '#4BBFBF' },
    { name: 'Expiring', value: expiringSoon.length, color: '#f97316' },
    { name: 'Expired', value: expiredSeats.length, color: '#ef4444' },
    { name: 'Blocked', value: seats.filter(s => !s.is_active).length, color: '#64748b' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, rgba(75,191,191,0.15), rgba(45,49,66,0.4))', border: '1px solid rgba(75,191,191,0.2)' }}>
        <h2 className="font-display text-2xl font-bold text-white mb-1">
          Welcome back, {user.first_name || user.username}! 👋
        </h2>
        <p className="text-slate-400 text-sm">Your DAT One subscription overview for {MONTHS[now.getMonth()]} {now.getFullYear()}</p>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(75,191,191,0.12) 0%, transparent 70%)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-2 border-[#4BBFBF]/30 border-t-[#4BBFBF] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={HiOutlineDatabase} label="Active Seats" value={activeSeats.length}
              sub="DAT LoadBoard users" color={TEAL} onClick={() => navigate('/store/dat')} />
            <KPICard icon={HiOutlineCurrencyDollar} label="Monthly Due"
              value={'PKR ' + totalDue.toLocaleString()} sub="sum of all seats" color="#10b981" />
            <KPICard icon={HiOutlineCheckCircle} label="Paid This Month"
              value={'PKR ' + thisMonthPaid.toLocaleString()} sub="approved payments" color="#7c3aed"
              onClick={() => navigate('/store/payments')} />
            <KPICard icon={HiOutlineClipboardList} label="Pending Claims"
              value={pendingClaims.length} sub="awaiting approval" color="#eab308"
              onClick={() => navigate('/store/payments')} />
          </div>

          {/* Expiry alerts */}
          {(expiredSeats.length > 0 || expiringSoon.length > 0) && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineExclamation className="w-5 h-5 text-red-400" />
                <span className="text-red-300 font-semibold">
                  {expiredSeats.length > 0 ? expiredSeats.length + ' expired' : ''}
                  {expiredSeats.length > 0 && expiringSoon.length > 0 ? ', ' : ''}
                  {expiringSoon.length > 0 ? expiringSoon.length + ' expiring soon' : ''}
                </span>
                <button onClick={() => navigate('/store/dat')}
                  className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                  View & Pay <HiOutlineArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1.5">
                {[...expiredSeats, ...expiringSoon].slice(0, 4).map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{s.mongo_user_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">{s.expiry_date}</span>
                      <span className={'px-2 py-0.5 rounded-full text-xs ' +
                        (s.expiry_status === 'expired' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400')}>
                        {s.expiry_status === 'expired' ? 'Expired' : 'Expiring soon'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Payment history bar chart */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-white">Payment History</h3>
                <span className="text-slate-500 text-xs">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyPayments} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}
                         tickFormatter={v => 'PKR ' + (v/1000).toFixed(0) + 'k'} />
                  <Tooltip
                    contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid ' + TEAL + '30', borderRadius:12 }}
                    formatter={(v, name) => ['PKR ' + Number(v).toLocaleString(), name]} />
                  <Bar dataKey="due" name="Monthly Due" fill="rgba(75,191,191,0.15)" radius={[4,4,0,0]} />
                  <Bar dataKey="paid" name="Paid" fill={TEAL} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Seat status pie + totals */}
            <div className="card">
              <h3 className="font-display font-bold text-white mb-4">Seat Status</h3>
              {seatStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={seatStatusData} cx="50%" cy="50%" outerRadius={55}
                           dataKey="value" innerRadius={30}>
                        {seatStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background:'rgba(14,20,32,0.95)', border:'1px solid ' + TEAL + '30', borderRadius:10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {seatStatusData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-slate-400">{d.name}</span>
                        </div>
                        <span className="text-white font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 mt-3 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total Paid (all time)</span>
                      <span className="text-[#4BBFBF] font-bold">PKR {totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm text-center py-6">No seats yet</p>
              )}
            </div>
          </div>

          {/* Active seats detail */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white text-lg">My DAT Seats</h3>
              <button onClick={() => navigate('/store/dat')}
                className="flex items-center gap-1 text-[#4BBFBF] text-sm hover:underline">
                View all <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
            {activeSeats.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No active seats. Contact your account manager.</p>
            ) : (
              <div className="space-y-2">
                {activeSeats.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 glass rounded-xl">
                    <div>
                      <div className="text-white text-sm font-medium">{s.mongo_user_name}</div>
                      <div className="text-slate-500 text-xs">{s.mongo_user_email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-sm">{s.currency} {parseFloat(s.monthly_price || 0).toLocaleString()}/mo</div>
                      <div className={'text-xs ' + (s.expiry_status === 'active' || s.expiry_status === 'no_expiry' ? 'text-slate-500' : 'text-orange-400')}>
                        {s.expiry_date ? 'Expires ' + s.expiry_date : 'No expiry set'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent payments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white text-lg">Recent Payments</h3>
              <button onClick={() => navigate('/store/payments')}
                className="flex items-center gap-1 text-[#4BBFBF] text-sm hover:underline">
                View all <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
            {claims.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No payment history yet.</p>
            ) : (
              <div className="space-y-2">
                {claims.slice(0, 6).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 glass rounded-xl">
                    <div>
                      <div className="text-white text-sm font-medium">#{c.claim_id_short}</div>
                      <div className="text-slate-500 text-xs">{c.payment_date} · {c.payment_method?.replace(/_/g,' ')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-white font-bold text-sm">{c.currency} {parseFloat(c.claimed_amount).toLocaleString()}</div>
                      <span className={'px-2 py-0.5 rounded-full text-xs ' +
                        (c.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                         c.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400')}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
