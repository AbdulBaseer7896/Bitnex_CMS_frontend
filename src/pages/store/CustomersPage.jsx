import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineSearch, HiOutlineMail, HiOutlinePhone, HiOutlineLockClosed,
  HiOutlineKey, HiOutlineUserCircle, HiOutlineCheck,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'

const EMPTY = {
  contact_person: '', email: '', phone: '', company_name: '',
  address: '', country: 'Pakistan', notes: '', assigned_sales: '',
  create_login: false, username: '', password: '',
}

function buildForm(c) {
  if (!c) return { ...EMPTY }
  return { ...EMPTY, ...c, assigned_sales: c.assigned_sales ?? '', create_login: false, username: '', password: '' }
}

function CustomerModal({ customer, salesUsers, onClose, onSaved }) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState(() => buildForm(customer))
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.contact_person.trim() || !form.email.trim()) return toast.error('Name and email required')
    if (!isEdit && form.create_login && (!form.username || !form.password))
      return toast.error('Username and password required for login')
    setSaving(true)
    try {
      const payload = { ...form, assigned_sales: form.assigned_sales || null }
      if (isEdit) {
        await api.patch(`/store/customers/${customer.id}/`, payload)
        toast.success('Customer updated')
      } else {
        await api.post('/store/customers/', payload)
        toast.success(form.create_login ? 'Customer created with login account' : 'Customer added')
      }
      onSaved(); onClose()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.email?.[0] || err?.username?.[0] || err?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
           style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{isEdit ? 'Update customer details' : 'Add a customer and optionally create login'}</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Contact Person *</label>
              <input value={form.contact_person} onChange={e => f('contact_person', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Company Name</label>
              <input value={form.company_name} onChange={e => f('company_name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Email *</label>
              <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Phone</label>
              <input value={form.phone} onChange={e => f('phone', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Country</label>
              <input value={form.country} onChange={e => f('country', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Assigned Sales Rep</label>
              <select value={form.assigned_sales} onChange={e => f('assigned_sales', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="" className="bg-[#0e1420]">— None —</option>
                {salesUsers.map(u => (
                  <option key={u.id} value={u.id} className="bg-[#0e1420]">{u.first_name} {u.last_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>

          {/* Login section — only on create */}
          {!isEdit && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(75,191,191,0.06)', border: '1px solid rgba(75,191,191,0.15)' }}>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <div onClick={() => f('create_login', !form.create_login)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.create_login ? 'bg-[#4BBFBF]' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow ${form.create_login ? 'left-6' : 'left-1'}`} />
                </div>
                <div>
                  <div className="text-white text-sm font-medium flex items-center gap-2">
                    <HiOutlineUserCircle className="w-4 h-4 text-[#4BBFBF]" />
                    Create Login Account
                  </div>
                  <p className="text-slate-500 text-xs">Customer can log in to view subscriptions & make payments</p>
                </div>
              </label>
              {form.create_login && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block font-medium">Username *</label>
                    <div className="relative">
                      <HiOutlineUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input value={form.username} onChange={e => f('username', e.target.value.toLowerCase())}
                        placeholder="e.g. john_doe"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1 block font-medium">Password *</label>
                    <div className="relative">
                      <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="password" value={form.password} onChange={e => f('password', e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update Customer' : 'Add Customer')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ customer, onClose }) {
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setSaving(true)
    try {
      await api.post(`/store/customers/${customer.id}/reset_password/`, { password })
      toast.success('Password reset successfully')
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-sm p-6" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Reset Password</h3>
          <button onClick={onClose}><HiOutlineX className="w-4 h-4 text-slate-400" /></button>
        </div>
        <p className="text-slate-400 text-sm mb-4">Setting new password for <span className="text-white">{customer.contact_person}</span></p>
        <div className="relative mb-4">
          <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage({ user }) {
  const [customers, setCustomers] = useState([])
  const [salesUsers, setSalesUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [resetModal, setResetModal] = useState(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [salesFilter, setSalesFilter] = useState('')
  const [summary, setSummary] = useState(null)

  const canManage = ['admin', 'sales'].includes(user?.role)
  const canReset = user?.role === 'admin' || (user?.role === 'sales' && user?.is_dept_head)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [custRes, sumRes] = await Promise.all([
        api.get('/store/customers/'),
        api.get('/store/customers/summary/').catch(() => ({ data: null })),
      ])
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.results || [])
      setSummary(sumRes.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    if (canManage) {
      api.get('/users/?role=sales').then(r => {
        setSalesUsers(Array.isArray(r.data) ? r.data : r.data.results || [])
      }).catch(() => {})
    }
  }, [load, canManage])

  const filtered = customers.filter(c =>
    !search ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage clients and their login access</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              <HiOutlinePlus className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Customers', value: summary.total, color: 'text-white' },
            { label: 'Active', value: summary.active, color: 'text-emerald-400' },
            { label: 'With Login', value: summary.with_login, color: 'text-[#4BBFBF]' },
            { label: 'Total Revenue', value: `PKR ${parseFloat(summary.total_revenue || 0).toLocaleString()}`, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, username…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
        </div>
      ) : (
        <div className="glass-light rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Customer','Contact','Login','Country','Subscriptions','Revenue','Sales Rep','Actions'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-slate-500 py-12">No customers found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white text-sm">{c.contact_person}</div>
                    {c.company_name && <div className="text-slate-500 text-xs">{c.company_name}</div>}
                    {!c.is_active && <span className="text-xs text-red-400">Inactive</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-400 text-xs"><HiOutlineMail className="w-3 h-3" />{c.email}</div>
                    {c.phone && <div className="flex items-center gap-1 text-slate-500 text-xs"><HiOutlinePhone className="w-3 h-3" />{c.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {c.has_login ? (
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs flex items-center gap-1 w-fit">
                          <HiOutlineCheck className="w-3 h-3" /> {c.username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">No login</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{c.country}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-[#4BBFBF]/10 text-[#4BBFBF] text-xs">{c.active_subscriptions || 0} active</span>
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium text-sm">
                    PKR {parseFloat(c.total_paid || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.assigned_sales_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canManage && (
                        <button onClick={() => setModal(c)}
                          className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white" title="Edit">
                          <HiOutlinePencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canReset && c.has_login && (
                        <button onClick={() => setResetModal(c)}
                          className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" title="Reset Password">
                          <HiOutlineKey className="w-3.5 h-3.5" />
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

      {modal && (
        <CustomerModal
          customer={modal === 'new' ? null : modal}
          salesUsers={salesUsers}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {resetModal && (
        <ResetPasswordModal customer={resetModal} onClose={() => setResetModal(null)} />
      )}
    </div>
  )
}
