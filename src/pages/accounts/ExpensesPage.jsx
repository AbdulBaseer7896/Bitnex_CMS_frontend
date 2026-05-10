import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { HiOutlinePlus, HiOutlineCurrencyDollar } from 'react-icons/hi'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CATEGORIES = ['utilities', 'rent', 'salaries', 'equipment', 'marketing', 'travel', 'software', 'office_supplies', 'other']
const CAT_COLORS = { utilities: '#3b82f6', rent: '#7c3aed', salaries: '#ec4899', equipment: '#f97316', marketing: '#eab308', travel: '#14b8a6', software: '#06b6d4', office_supplies: '#10b981', other: '#94a3b8' }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({ by_category: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', category: 'other', description: '', date: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get('/expenses/'),
        api.get('/expenses/summary/')
      ])
      setExpenses(expRes.data.results || expRes.data)
      setSummary(sumRes.data)
    } catch { toast.error('Failed to load expenses') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/expenses/', form)
      toast.success('Expense added!')
      setShowModal(false)
      fetchData()
    } catch { toast.error('Failed to add expense') }
  }

  const pieData = summary.by_category.map(c => ({
    name: c.category.replace('_', ' '),
    value: Number(c.total),
    fill: CAT_COLORS[c.category] || '#94a3b8'
  }))

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mb-3">
            <HiOutlineCurrencyDollar className="w-5 h-5 text-white" />
          </div>
          <div className="font-display text-3xl font-bold text-white">₨{Number(summary.total || 0).toLocaleString()}</div>
          <div className="text-slate-500 text-sm mt-1">Total This Month</div>
        </div>
        <div className="sm:col-span-2 card">
          <h3 className="font-display font-bold text-white mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="35%" cy="50%" outerRadius={55} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                formatter={(v) => [`₨${Number(v).toLocaleString()}`, '']}
              />
              <Legend
                layout="vertical" align="right" verticalAlign="middle"
                formatter={(v) => <span className="text-slate-400 text-xs capitalize">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-white text-lg">All Expenses</h3>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
          <HiOutlinePlus /> Add Expense
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Title', 'Category', 'Amount', 'Date', 'Added By'].map(h => (
                <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 pr-4">
                  <div className="text-white font-medium text-sm">{exp.title}</div>
                  {exp.description && <div className="text-slate-500 text-xs truncate max-w-[200px]">{exp.description}</div>}
                </td>
                <td className="py-4 pr-4">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg capitalize"
                    style={{ background: `${CAT_COLORS[exp.category]}20`, color: CAT_COLORS[exp.category] }}>
                    {exp.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <span className="font-display font-bold text-white">₨{Number(exp.amount).toLocaleString()}</span>
                </td>
                <td className="py-4 pr-4 text-slate-400 text-sm">{exp.date}</td>
                <td className="py-4 text-slate-500 text-sm">{exp.added_by_name || '—'}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-12">No expenses found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-white text-xl mb-5">Add Expense</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Title *</label>
                <input required className="input" placeholder="Expense title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Amount (PKR) *</label>
                  <input required type="number" className="input" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900 capitalize">{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Date *</label>
                <input required type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Description</label>
                <textarea className="input h-20 resize-none" placeholder="Optional description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-ghost">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
