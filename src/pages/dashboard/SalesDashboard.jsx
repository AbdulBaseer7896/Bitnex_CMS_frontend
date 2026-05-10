import { useEffect, useState } from 'react'
import api from '../../api/client'
import {
  HiOutlineUsers, HiOutlineCurrencyDollar, HiOutlineChartBar,
  HiOutlineExclamation, HiOutlineDatabase,
} from 'react-icons/hi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const TEAL = '#4BBFBF'
const COLORS = ['#4BBFBF','#7c3aed','#10b981','#f97316','#ec4899','#eab308','#06b6d4','#8b5cf6']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function StatCard({ icon: Icon, label, value, sub, color = TEAL }) {
  return (
    <div className="stat-card">
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

export default function SalesDashboard({ user }) {
  const [storeStats, setStoreStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [custFilter, setCustFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/store/customer-seats/'),
      api.get('/store/payment-claims/'),
      api.get('/store/customers/'),
      api.get('/store/dialer-subscriptions/').catch(()=>({data:[]})),
    ]).then(([seatRes, claimRes, custRes, dialerRes]) => {
      const seats = Array.isArray(seatRes.data) ? seatRes.data : seatRes.data.results || []
      const claims = Array.isArray(claimRes.data) ? claimRes.data : claimRes.data.results || []
      const custs = Array.isArray(custRes.data) ? custRes.data : custRes.data.results || []
      const dialers = Array.isArray(dialerRes.data) ? dialerRes.data : dialerRes.data.results || []
      const now = new Date()

      const monthly = Array.from({length:6}, (_,i) => {
        const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1)
        const m=d.getMonth(), y=d.getFullYear()
        const paid = claims
          .filter(c=>c.status==='approved' && new Date(c.payment_date).getMonth()===m && new Date(c.payment_date).getFullYear()===y)
          .reduce((s,c)=>s+parseFloat(c.approved_amount||c.claimed_amount||0),0)
        const due = seats.filter(s=>s.is_active).reduce((s,seat)=>s+parseFloat(seat.monthly_price||0),0)
        return { month: MONTHS[m], paid, due }
      })

      const byCustomer = {}
      seats.forEach(s => { byCustomer[s.customer_name] = (byCustomer[s.customer_name]||0) + parseFloat(s.monthly_price||0) })
      const pieData = Object.entries(byCustomer).map(([name,value],i) => ({ name, value, color: COLORS[i%COLORS.length] }))

      const expiredSeats = seats.filter(s => s.expiry_status === 'expired').length
      const expiredDialers = dialers.filter(s => s.expiry_status === 'expired').length
      const monthlyRevenue = seats.filter(s=>s.is_active).reduce((s,seat)=>s+parseFloat(seat.monthly_price||0),0)
      const dialerRevenue = dialers.filter(s=>s.status==='active').reduce((s,d)=>s+parseFloat(d.net_price||0),0)

      setStoreStats({
        totalCustomers: custs.length,
        activeSeats: seats.filter(s=>s.is_active).length,
        activeDialers: dialers.filter(s=>s.status==='active').length,
        monthlyRevenue,
        dialerRevenue,
        totalRevenue: monthlyRevenue + dialerRevenue,
        pendingClaims: claims.filter(c=>c.status==='pending').length,
        expiredSeats, expiredDialers,
        thisMonthPaid: claims
          .filter(c=>c.status==='approved' && new Date(c.payment_date).getMonth()===now.getMonth() && new Date(c.payment_date).getFullYear()===now.getFullYear())
          .reduce((s,c)=>s+parseFloat(c.approved_amount||c.claimed_amount||0),0),
        monthly, pieData,
      })
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      {/* Quick filters */}
      {storeStats && storeStats.pieData.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <select value={custFilter} onChange={e => setCustFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
            <option value="" className="bg-[#0e1420]">All Customers</option>
            {storeStats.pieData.map(d => <option key={d.name} value={d.name} className="bg-[#0e1420]">{d.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
            <option value="" className="bg-[#0e1420]">All Seat Status</option>
            {['active','expired','expiring_soon','expiring_month'].map(s =>
              <option key={s} value={s} className="bg-[#0e1420]">{s.replace(/_/g,' ')}</option>
            )}
          </select>
          {(custFilter || statusFilter) && (
            <button onClick={() => { setCustFilter(''); setStatusFilter('') }}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 border border-white/10 hover:text-white">Clear</button>
          )}
        </div>
      )}

      <div className="rounded-2xl p-6 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, rgba(75,191,191,0.15), rgba(45,49,66,0.4))', border: '1px solid rgba(75,191,191,0.2)' }}>
        <h2 className="font-display text-2xl font-bold text-white mb-1">
          {greeting}, {user.first_name || user.username}! 👋
        </h2>
        <p className="text-slate-400 text-sm">
          DAT One Store overview · {new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(75,191,191,0.12) 0%, transparent 70%)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-2 border-[#4BBFBF]/30 border-t-[#4BBFBF] rounded-full animate-spin" /></div>
      ) : storeStats && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={HiOutlineUsers}         label="Total Customers"   value={storeStats.totalCustomers}  color={TEAL} />
            <StatCard icon={HiOutlineDatabase}      label="Active DAT Seats"  value={storeStats.activeSeats}     color="#10b981" />
            <StatCard icon={HiOutlineChartBar}      label="Active Dialers"    value={storeStats.activeDialers}   color="#7c3aed" />
            <StatCard icon={HiOutlineCurrencyDollar}label="Pending Claims"    value={storeStats.pendingClaims}   color="#eab308" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-light rounded-2xl p-5 flex flex-col gap-2" style={{ border: '1px solid rgba(75,191,191,0.15)' }}>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Total Monthly Revenue</div>
              <div className="font-display text-3xl font-bold text-[#4BBFBF]">PKR {storeStats.totalRevenue.toLocaleString()}</div>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-sm"><span className="text-slate-500">DAT One</span><span className="text-emerald-400">PKR {storeStats.monthlyRevenue.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Dialers</span><span className="text-purple-400">PKR {storeStats.dialerRevenue.toLocaleString()}</span></div>
              </div>
            </div>
            <div className="glass-light rounded-2xl p-5 flex flex-col gap-2" style={{ border: '1px solid rgba(75,191,191,0.15)' }}>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Collected This Month</div>
              <div className="font-display text-3xl font-bold text-emerald-400">PKR {storeStats.thisMonthPaid.toLocaleString()}</div>
              <div className="mt-1">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: storeStats.totalRevenue > 0 ? Math.min(100,(storeStats.thisMonthPaid/storeStats.totalRevenue)*100)+'%' : '0%' }} />
                </div>
                <div className="text-slate-500 text-xs mt-1">{storeStats.totalRevenue > 0 ? Math.round((storeStats.thisMonthPaid/storeStats.totalRevenue)*100) : 0}% collection rate</div>
              </div>
            </div>
            <div className="glass-light rounded-2xl p-5" style={{ border: '1px solid ' + ((storeStats.expiredSeats+storeStats.expiredDialers)>0 ? 'rgba(239,68,68,0.25)' : 'rgba(75,191,191,0.15)') }}>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Expired Subscriptions</div>
              <div className="font-display text-3xl font-bold text-red-400 mt-2">{storeStats.expiredSeats + storeStats.expiredDialers}</div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">DAT Seats</span><span className="text-red-400">{storeStats.expiredSeats}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Dialers</span><span className="text-red-400">{storeStats.expiredDialers}</span></div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-white">Revenue vs Collections</h3>
                <span className="text-slate-500 text-xs">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={storeStats.monthly}>
                  <defs>
                    <linearGradient id="due" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={TEAL} stopOpacity={0.25}/><stop offset="95%" stopColor={TEAL} stopOpacity={0}/></linearGradient>
                    <linearGradient id="coll" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>'PKR '+(v/1000).toFixed(0)+'k'} />
                  <Tooltip contentStyle={{background:'rgba(14,20,32,0.95)',border:'1px solid '+TEAL+'30',borderRadius:12}} formatter={v=>['PKR '+Number(v).toLocaleString(),'']} />
                  <Area type="monotone" dataKey="due"  stroke={TEAL}     fill="url(#due)"  strokeWidth={2} name="Monthly Due" />
                  <Area type="monotone" dataKey="paid" stroke="#7c3aed"  fill="url(#coll)" strokeWidth={2} name="Collected" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="font-display font-bold text-white mb-4">Revenue by Customer</h3>
              {storeStats.pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={storeStats.pieData} cx="50%" cy="50%" outerRadius={55} innerRadius={30} dataKey="value">
                        {storeStats.pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{background:'rgba(14,20,32,0.95)',border:'1px solid '+TEAL+'30',borderRadius:10}} formatter={v=>['PKR '+Number(v).toLocaleString(),'']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto">
                    {storeStats.pieData.slice(0,6).map(d => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:d.color}} />
                          <span className="text-slate-400 truncate max-w-28">{d.name}</span>
                        </div>
                        <span className="text-white font-semibold text-xs">PKR {Number(d.value).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm text-center py-6">No data yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
