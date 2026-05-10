import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineSearch, HiOutlinePhone,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'
const STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  temp_off: 'bg-orange-500/15 text-orange-400',
  cancelled: 'bg-red-500/15 text-red-400',
  expired: 'bg-slate-500/15 text-slate-400',
}
const DIALER_TYPES = [
  ['google_voice','Google Voice'],['ring_central','Ring Central'],
  ['nux_call','NuxCall'],['vonage','Vonage'],
  ['mighty_call','Mighty Call'],['twilio','Twilio'],['other','Other'],
]
const REGIONS = [['us','US'],['uk','UK'],['other','Other']]
const SMS_STATUS = [['active','Active'],['inactive','Inactive'],['pending','Pending']]

const EMPTY = {
  customer: '', product: '', status: 'pending',
  dialer_type: 'google_voice', region: 'us',
  domain_email: '', dialer_username: '', phone_number: '', seat_number: '', domain: '',
  list_price: '', discount: 0, net_price: '', currency: 'PKR',
  register_date: '', start_date: '', next_due_date: '', reminder_date: '',
  sms_status: 'active', rating: '', feedback: '', notes: '',
}

function buildForm(s) {
  if (!s) return { ...EMPTY }
  return { ...EMPTY, ...s, customer: s.customer ?? '', product: s.product ?? '' }
}

function DialerModal({ sub, customers, products, onClose, onSaved }) {
  const isEdit = !!sub?.id
  const [form, setForm] = useState(() => buildForm(sub))
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const calcNet = (list, disc) => Math.max(0, (parseFloat(list) || 0) - (parseFloat(disc) || 0))
  const handleList = (v) => { f('list_price', v); f('net_price', calcNet(v, form.discount)) }
  const handleDisc = (v) => { f('discount', v); f('net_price', calcNet(form.list_price, v)) }

  const save = async () => {
    if (!form.customer || !form.product || !form.domain_email) return toast.error('Customer, product and domain email required')
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/store/dialer-subscriptions/${sub.id}/`, form)
        toast.success('Dialer subscription updated')
      } else {
        await api.post('/store/dialer-subscriptions/', form)
        toast.success('Dialer subscription created')
      }
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to save') }
    finally { setSaving(false) }
  }

  const dialerProducts = products.filter(p => p.product_type === 'dialer')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
           style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Dialer Subscription' : 'New Dialer Subscription'}</h2>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
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
              <label className="text-slate-400 text-xs mb-1 block font-medium">Product *</label>
              <select value={form.product} onChange={e => f('product', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="" className="bg-[#0e1420]">— Select Product —</option>
                {dialerProducts.map(p => <option key={p.id} value={p.id} className="bg-[#0e1420]">{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Dialer details */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(75,191,191,0.05)', border: '1px solid rgba(75,191,191,0.12)' }}>
            <h3 className="text-[#4BBFBF] text-xs font-semibold uppercase tracking-widest">Dialer Details</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Dialer Type</label>
                <select value={form.dialer_type} onChange={e => f('dialer_type', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                  {DIALER_TYPES.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Region</label>
                <select value={form.region} onChange={e => f('region', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                  {REGIONS.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Status</label>
                <select value={form.status} onChange={e => f('status', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                  {['active','pending','temp_off','cancelled','expired'].map(s => (
                    <option key={s} value={s} className="bg-[#0e1420]">{s.replace('_',' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Domain Email *</label>
                <input type="email" value={form.domain_email} onChange={e => f('domain_email', e.target.value)}
                  placeholder="e.g. derrick@realtywisechoice.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Dialer Username</label>
                <input value={form.dialer_username} onChange={e => f('dialer_username', e.target.value)}
                  placeholder="e.g. Alex Wilson"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Domain</label>
                <input value={form.domain} onChange={e => f('domain', e.target.value)}
                  placeholder="e.g. realtywisechoice.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Phone Number</label>
                <input value={form.phone_number} onChange={e => f('phone_number', e.target.value)}
                  placeholder="e.g. +12109444608"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Seat Number</label>
                <input value={form.seat_number} onChange={e => f('seat_number', e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">SMS Status</label>
                <select value={form.sms_status} onChange={e => f('sms_status', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                  {SMS_STATUS.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Rating</label>
                <input value={form.rating} onChange={e => f('rating', e.target.value)}
                  placeholder="e.g. P (Premium)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Feedback</label>
                <input value={form.feedback} onChange={e => f('feedback', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">List Price</label>
              <input type="number" value={form.list_price} onChange={e => handleList(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Discount</label>
              <input type="number" value={form.discount} onChange={e => handleDisc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Net Price</label>
              <input type="number" value={form.net_price} onChange={e => f('net_price', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[#4BBFBF] font-medium text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label>
              <select value={form.currency} onChange={e => f('currency', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-4 gap-3">
            {[['register_date','Register'],['start_date','Start'],['next_due_date','Next Due'],['reminder_date','Reminder']].map(([k,l]) => (
              <div key={k}>
                <label className="text-slate-400 text-xs mb-1 block font-medium">{l} Date</label>
                <input type="date" value={form[k]} onChange={e => f(k, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create Dialer Subscription')}
          </button>
        </div>
      </div>
    </div>
  )
}

const DIALER_BADGES = {
  google_voice: 'bg-blue-500/15 text-blue-400',
  ring_central: 'bg-orange-500/15 text-orange-400',
  nux_call: 'bg-[#4BBFBF]/15 text-[#4BBFBF]',
  vonage: 'bg-red-500/15 text-red-400',
  mighty_call: 'bg-purple-500/15 text-purple-400',
  twilio: 'bg-pink-500/15 text-pink-400',
  other: 'bg-slate-500/15 text-slate-400',
}

export default function DialerSubscriptionsPage({ user }) {
  const [subs, setSubs] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')

  const canManage = ['admin', 'sales'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let q = []
      if (statusFilter) q.push(`status=${statusFilter}`)
      if (typeFilter) q.push(`dialer_type=${typeFilter}`)
      if (regionFilter) q.push(`region=${regionFilter}`)
      const qs = q.length ? `?${q.join('&')}` : ''
      const [subRes, custRes, prodRes] = await Promise.all([
        api.get(`/store/dialer-subscriptions/${qs}`),
        api.get('/store/customers/'),
        api.get('/store/products/?type=dialer'),
      ])
      setSubs(Array.isArray(subRes.data) ? subRes.data : subRes.data.results || [])
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.results || [])
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [statusFilter, typeFilter, regionFilter])

  useEffect(() => { load() }, [load])

  const filtered = subs.filter(s =>
    !search ||
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.domain_email?.toLowerCase().includes(search.toLowerCase()) ||
    s.dialer_username?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone_number?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dialer Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-1">Google Voice, Ring Central, NuxCall & more</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
            <option value="" className="bg-[#0e1420]">All Types</option>
            {DIALER_TYPES.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
          </select>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
            <option value="" className="bg-[#0e1420]">All Regions</option>
            {REGIONS.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
            <option value="" className="bg-[#0e1420]">All Status</option>
            {['active','pending','temp_off','cancelled','expired'].map(s => (
              <option key={s} value={s} className="bg-[#0e1420]">{s.replace('_',' ')}</option>
            ))}
          </select>
          <button onClick={load} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#0e1420] font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              <HiOutlinePlus className="w-4 h-4" /> Add Dialer Seat
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, email, username, number…"
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
                {['Customer','Dialer','Region','Domain Email','Username','Phone','Net Price','Register','Next Due','SMS','Status',''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="text-center text-slate-500 py-12">No dialer subscriptions found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white text-sm font-medium whitespace-nowrap">{s.customer_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${DIALER_BADGES[s.dialer_type] || ''}`}>
                      {DIALER_TYPES.find(([v]) => v === s.dialer_type)?.[1] || s.dialer_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700/50 text-slate-400 uppercase">{s.region}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{s.domain_email}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.dialer_username || '—'}</td>
                  <td className="px-4 py-3">
                    {s.phone_number ? (
                      <div className="flex items-center gap-1 text-slate-300 text-xs">
                        <HiOutlinePhone className="w-3 h-3 text-[#4BBFBF]" />
                        {s.seat_number && <span className="text-slate-500">{s.seat_number}/</span>}
                        {s.phone_number}
                      </div>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium text-sm whitespace-nowrap">{s.currency} {parseFloat(s.net_price || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{s.register_date || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{s.next_due_date || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${s.sms_status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {s.sms_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[s.status] || ''}`}>
                      {s.status.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <button onClick={() => setModal(s)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <DialerModal
          sub={modal === 'new' ? null : modal}
          customers={customers}
          products={products}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
