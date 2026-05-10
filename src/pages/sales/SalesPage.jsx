import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { HiOutlinePlus, HiOutlineTrendingUp } from 'react-icons/hi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const STATUS_CONFIG = {
  lead: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Lead' },
  prospect: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Prospect' },
  proposal: { color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', label: 'Proposal' },
  negotiation: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Negotiation' },
  closed_won: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Closed Won' },
  closed_lost: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Closed Lost' },
}

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '',
    service: '', amount: '', status: 'lead', notes: '', sale_date: ''
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [salesRes, statsRes] = await Promise.all([
        api.get('/sales/'),
        api.get('/sales/stats/')
      ])
      setSales(salesRes.data.results || salesRes.data)
      setStats(statsRes.data)
    } catch { toast.error('Failed to load sales data') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/sales/', form)
      toast.success('Sale record added!')
      setShowModal(false)
      fetchData()
    } catch { toast.error('Failed to add sale') }
  }

  const filtered = statusFilter === 'all' ? sales : sales.filter(s => s.status === statusFilter)

  const chartData = Object.entries(
    sales.reduce((acc, s) => {
      const month = s.created_at?.slice(0, 7) || 'Unknown'
      acc[month] = (acc[month] || 0) + Number(s.amount)
      return acc
    }, {})
  ).slice(-6).map(([month, total]) => ({ month: month.slice(5), total }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Deals', value: stats.total_sales || 0, color: 'from-blue-500 to-cyan-400' },
          { label: 'Revenue Won', value: `₨${Number(stats.total_revenue || 0).toLocaleString()}`, color: 'from-emerald-500 to-teal-400' },
          { label: 'Pipeline Value', value: `₨${Number(stats.pipeline_value || 0).toLocaleString()}`, color: 'from-violet-500 to-purple-400' },
          { label: 'Avg Deal Size', value: `₨${stats.total_sales ? Math.round(stats.total_revenue / stats.total_sales).toLocaleString() : 0}`, color: 'from-orange-500 to-amber-400' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <HiOutlineTrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="font-display text-2xl font-bold text-white">{s.value}</div>
            <div className="text-slate-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-white mb-5">Sales by Month</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₨${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                formatter={(v) => [`₨${v.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="total" fill="url(#salesGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', ...Object.keys(STATUS_CONFIG)].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === s ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'glass text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
          <HiOutlinePlus className="w-4 h-4" /> Add Sale
        </button>
      </div>

      {/* Sales table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Client', 'Service', 'Amount', 'Status', 'Sales Person', 'Date'].map(h => (
                <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 pr-4">
                  <div className="text-white font-medium text-sm">{s.client_name}</div>
                  <div className="text-slate-500 text-xs">{s.client_email}</div>
                </td>
                <td className="py-4 pr-4 text-slate-300 text-sm">{s.service}</td>
                <td className="py-4 pr-4">
                  <span className="font-display font-bold text-white">₨{Number(s.amount).toLocaleString()}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className={`badge border ${STATUS_CONFIG[s.status]?.color}`}>
                    {STATUS_CONFIG[s.status]?.label}
                  </span>
                </td>
                <td className="py-4 pr-4 text-slate-400 text-sm">{s.sales_person_name || '—'}</td>
                <td className="py-4 text-slate-500 text-xs">{s.sale_date || s.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-12">No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-light rounded-3xl p-6 w-full max-w-lg animate-slide-up my-4">
            <h3 className="font-display font-bold text-white text-xl mb-5">Add Sales Record</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Name *</label>
                  <input required className="input" placeholder="Client name" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client Email</label>
                  <input type="email" className="input" placeholder="Email" value={form.client_email} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Service *</label>
                <input required className="input" placeholder="e.g. Web Development, VoIP Setup" value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Amount (PKR) *</label>
                  <input required type="number" className="input" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k} className="bg-slate-900">{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Sale Date</label>
                <input type="date" className="input" value={form.sale_date} onChange={e => setForm(p => ({ ...p, sale_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea className="input h-20 resize-none" placeholder="Additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-ghost">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
