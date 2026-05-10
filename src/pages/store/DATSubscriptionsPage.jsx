import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineSearch, HiOutlineCheck,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'
const STATUS_COLORS = {
  active:'bg-emerald-500/15 text-emerald-400', pending:'bg-yellow-500/15 text-yellow-400',
  paused:'bg-blue-500/15 text-blue-400', cancelled:'bg-red-500/15 text-red-400',
  expired:'bg-slate-500/15 text-slate-400',
}

const EMPTY = {
  customer:'', dat_account:'', status:'pending',
  list_price:'', discount:0, net_price:'', currency:'PKR',
  searches_allowed:1,
  perm_dashboard:false, perm_search_trucks:false, perm_private_loads:false,
  perm_my_loads:false, perm_private_network:false, perm_my_trucks:false,
  perm_live_support:false, perm_tools:false, perm_send_feedback:false,
  perm_notifications:false, perm_lane_rate:false, perm_view_route:false,
  perm_rate_view:false, perm_view_directory:false,
  register_date:'', last_payment_date:'', next_due_date:'', reminder_date:'',
  notes:'',
}

function buildForm(s) {
  if (!s) return { ...EMPTY }
  return { ...EMPTY, ...s, customer: s.customer ?? '', dat_account: s.dat_account ?? '' }
}

const PERMS = [
  ['perm_dashboard','Dashboard'],['perm_search_trucks','Search Trucks'],
  ['perm_private_loads','Private Loads'],['perm_my_loads','My Loads'],
  ['perm_private_network','Private Network'],['perm_my_trucks','My Trucks'],
  ['perm_live_support','Live Support'],['perm_tools','Tools'],
  ['perm_send_feedback','Send Feedback'],['perm_notifications','Notifications'],
  ['perm_lane_rate','Lane Rate'],['perm_view_route','View Route'],
  ['perm_rate_view','Rate View'],['perm_view_directory','View Directory'],
]

function SubModal({ sub, customers, datAccounts, onClose, onSaved }) {
  const isEdit = !!sub?.id
  const [form, setForm] = useState(() => buildForm(sub))
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const calcNet = () => {
    const net = Math.max(0, (parseFloat(form.list_price)||0) - (parseFloat(form.discount)||0))
    f('net_price', net)
  }

  const save = async () => {
    if (!form.customer || !form.dat_account) return toast.error('Customer and DAT account required')
    setSaving(true)
    try {
      const payload = { ...form, net_price: Math.max(0, (parseFloat(form.list_price)||0)-(parseFloat(form.discount)||0)) }
      if (isEdit) {
        await api.patch(`/store/dat-subscriptions/${sub.id}/`, payload)
        toast.success('Subscription updated')
      } else {
        await api.post('/store/dat-subscriptions/', payload)
        toast.success('Seat assigned to customer')
      }
      onSaved(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
           style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Seat' : 'Assign Customer to DAT Account'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">Set price, search limit, and page permissions per customer</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Customer + Account */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Customer *</label>
              <select value={form.customer} onChange={e => f('customer', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="" className="bg-[#0e1420]">— Select Customer —</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">DAT Account (Proxy Slot) *</label>
              <select value={form.dat_account} onChange={e => f('dat_account', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="" className="bg-[#0e1420]">— Select DAT Account —</option>
                {datAccounts.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#0e1420]">
                    {a.name} ({a.active_seat_count||0} active seats)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Status</label>
              <select value={form.status} onChange={e => f('status', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                {['active','pending','paused','cancelled','expired'].map(s => (
                  <option key={s} value={s} className="bg-[#0e1420]">{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Searches Allowed (1–10)</label>
              <input type="number" min={0} max={10} value={form.searches_allowed} onChange={e => f('searches_allowed', parseInt(e.target.value)||0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(75,191,191,0.05)', border: '1px solid rgba(75,191,191,0.12)' }}>
            <h3 className="text-[#4BBFBF] text-xs font-semibold uppercase tracking-widest mb-3">Pricing (customer-specific)</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">List Price</label>
                <input type="number" value={form.list_price} onChange={e => f('list_price', e.target.value)} onBlur={calcNet}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Discount</label>
                <input type="number" value={form.discount} onChange={e => f('discount', e.target.value)} onBlur={calcNet}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Net Price (paid)</label>
                <input type="number" value={form.net_price} onChange={e => f('net_price', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[#4BBFBF] font-medium text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Currency</label>
                <select value={form.currency} onChange={e => f('currency', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                  {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* DAT Page Permissions */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(75,191,191,0.05)', border: '1px solid rgba(75,191,191,0.12)' }}>
            <h3 className="text-[#4BBFBF] text-xs font-semibold uppercase tracking-widest mb-3">DAT Page Permissions</h3>
            <div className="grid grid-cols-4 gap-2">
              {PERMS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                  <div onClick={() => f(key, !form[key])}
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${form[key] ? 'bg-[#4BBFBF] border-[#4BBFBF]' : 'bg-transparent border-white/20'}`}>
                    {form[key] && <HiOutlineCheck className="w-3 h-3 text-[#0e1420]" />}
                  </div>
                  <span className="text-slate-300 text-xs">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-4 gap-3">
            {[['register_date','Register'],['last_payment_date','Last Payment'],['next_due_date','Next Due'],['reminder_date','Reminder']].map(([k,l]) => (
              <div key={k}>
                <label className="text-slate-400 text-xs mb-1 block">{l}</label>
                <input type="date" value={form[k]} onChange={e => f(k, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Assign Seat')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DATSubscriptionsPage({ user }) {
  const [subs, setSubs] = useState([])
  const [customers, setCustomers] = useState([])
  const [datAccounts, setDatAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const canManage = ['admin','sales'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const [subRes, custRes, accRes] = await Promise.all([
        api.get(`/store/dat-subscriptions/${params}`),
        api.get('/store/customers/'),
        api.get('/store/dat-accounts/'),
      ])
      setSubs(Array.isArray(subRes.data) ? subRes.data : subRes.data.results || [])
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.results || [])
      setDatAccounts(Array.isArray(accRes.data) ? accRes.data : accRes.data.results || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = subs.filter(s =>
    !search ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
    s.dat_account_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">DAT One — Customer Seats</h1>
          <p className="text-slate-500 text-sm mt-1">Each customer gets their own price, searches, and page permissions</p>
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
            <option value="" className="bg-[#0e1420]">All Status</option>
            {['active','pending','paused','cancelled','expired'].map(s => <option key={s} value={s} className="bg-[#0e1420]">{s}</option>)}
          </select>
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              <HiOutlinePlus className="w-4 h-4" /> Assign Seat
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or DAT account…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
        </div>
      ) : (
        <div className="glass-light rounded-2xl overflow-auto" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10">
                {['Customer','Email','DAT Account','Proxy','Searches','Price','Register','Next Due','Status','Permissions',''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center text-slate-500 py-12">No DAT seats assigned yet</td></tr>
              ) : filtered.map(s => {
                const activePerms = PERMS.filter(([k]) => s[k]).map(([,l]) => l)
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">{s.customer_name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.customer_email}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300 text-sm">{s.dat_account_name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono truncate max-w-[120px]" title={s.dat_account_proxy}>
                      {s.dat_account_proxy?.split(':').slice(0,2).join(':')}…
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-[#4BBFBF]/10 text-[#4BBFBF] text-xs">{s.searches_allowed}</span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-medium text-sm whitespace-nowrap">
                      {s.currency} {parseFloat(s.net_price||0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.register_date||'—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.next_due_date||'—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[s.status]||''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {activePerms.slice(0,3).map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-[#4BBFBF]/10 text-[#4BBFBF]">{p}</span>
                        ))}
                        {activePerms.length > 3 && <span className="text-slate-600 text-[10px]">+{activePerms.length-3}</span>}
                        {activePerms.length === 0 && <span className="text-slate-600 text-xs">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <button onClick={() => setModal(s)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <SubModal
          sub={modal === 'new' ? null : modal}
          customers={customers}
          datAccounts={datAccounts}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
