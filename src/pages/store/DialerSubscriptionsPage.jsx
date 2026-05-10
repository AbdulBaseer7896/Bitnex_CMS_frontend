import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineSearch, HiOutlinePhone, HiOutlineCreditCard,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'
const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50'

const STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  temp_off: 'bg-orange-500/15 text-orange-400',
  cancelled: 'bg-red-500/15 text-red-400',
  expired: 'bg-slate-500/15 text-slate-400',
}
const EXPIRY_COLORS = {
  expired: 'bg-red-500/15 text-red-400',
  expiring_soon: 'bg-orange-500/15 text-orange-400',
  expiring_month: 'bg-yellow-500/15 text-yellow-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  no_expiry: 'bg-slate-500/15 text-slate-400',
}
const DIALER_TYPES = [
  ['google_voice','Google Voice'],['ring_central','Ring Central'],
  ['nux_call','NuxCall'],['vonage','Vonage'],
  ['mighty_call','Mighty Call'],['twilio','Twilio'],['other','Other'],
]
const REGIONS = [['us','US'],['uk','UK'],['other','Other']]
const SMS_STATUS = [['active','Active'],['inactive','Inactive'],['pending','Pending']]
const DIALER_BADGES = {
  google_voice: 'bg-blue-500/15 text-blue-400',
  ring_central: 'bg-orange-500/15 text-orange-400',
  nux_call: 'bg-[#4BBFBF]/15 text-[#4BBFBF]',
  vonage: 'bg-red-500/15 text-red-400',
  mighty_call: 'bg-purple-500/15 text-purple-400',
  twilio: 'bg-pink-500/15 text-pink-400',
  other: 'bg-slate-500/15 text-slate-400',
}

const EMPTY = {
  customer: '', status: 'pending', dialer_type: 'google_voice', region: 'us',
  domain_email: '', dialer_username: '', phone_number: '', seat_number: '', domain: '',
  list_price: '', discount: 0, net_price: '', currency: 'PKR',
  register_date: '', next_due_date: '', reminder_date: '',
  sms_status: 'active', rating: '', feedback: '', notes: '',
}

function buildForm(s) {
  if (!s) return { ...EMPTY }
  return { ...EMPTY, ...s, customer: s.customer ?? '' }
}

function DialerModal({ sub, customers, onClose, onSaved }) {
  const isEdit = !!sub?.id
  const [form, setForm] = useState(() => buildForm(sub))
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const calcNet = (list, disc) => Math.max(0, (parseFloat(list) || 0) - (parseFloat(disc) || 0))

  const save = async () => {
    if (!form.customer || !form.domain_email) return toast.error('Customer and domain email required')
    setSaving(true)
    try {
      const payload = { ...form, product: form.product || null }
      if (isEdit) { await api.patch('/store/dialer-subscriptions/' + sub.id + '/', payload); toast.success('Updated') }
      else { await api.post('/store/dialer-subscriptions/', payload); toast.success('Created') }
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit' : 'New'} Dialer Subscription</h2>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Customer *</label>
            <select value={form.customer} onChange={e => f('customer', e.target.value)} className={inp}>
              <option value="" className="bg-[#0e1420]">— Select —</option>
              {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}{c.company_name ? ' (' + c.company_name + ')' : ''}</option>)}
            </select>
          </div>
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(75,191,191,0.05)', border: '1px solid rgba(75,191,191,0.12)' }}>
            <h3 className="text-[#4BBFBF] text-xs font-semibold uppercase tracking-widest">Dialer Details</h3>
            <div className="grid grid-cols-3 gap-3">
              {[['dialer_type','Type','select',DIALER_TYPES],['region','Region','select',REGIONS],['status','Status','select',['active','pending','temp_off','cancelled','expired'].map(s=>[s,s.replace('_',' ')])],
                ['domain_email','Domain Email *','email',[]],['dialer_username','Username','text',[]],['domain','Domain','text',[]],
                ['phone_number','Phone','text',[]],['seat_number','Seat #','text',[]],['sms_status','SMS Status','select',SMS_STATUS]
              ].map(([k,l,t,opts]) => (
                <div key={k}>
                  <label className="text-slate-400 text-xs mb-1 block font-medium">{l}</label>
                  {t === 'select' ? (
                    <select value={form[k]} onChange={e => f(k, e.target.value)} className={inp}>
                      {opts.map(([v,lbl]) => <option key={v} value={v} className="bg-[#0e1420]">{lbl}</option>)}
                    </select>
                  ) : (
                    <input type={t} value={form[k]} onChange={e => f(k, e.target.value)} className={inp} />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-slate-400 text-xs mb-1 block font-medium">Rating</label><input value={form.rating} onChange={e => f('rating', e.target.value)} className={inp} /></div>
              <div><label className="text-slate-400 text-xs mb-1 block font-medium">Feedback</label><input value={form.feedback} onChange={e => f('feedback', e.target.value)} className={inp} /></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">List Price</label><input type="number" value={form.list_price} onChange={e => { f('list_price',e.target.value); f('net_price', calcNet(e.target.value, form.discount)) }} className={inp} /></div>
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Discount</label><input type="number" value={form.discount} onChange={e => { f('discount',e.target.value); f('net_price', calcNet(form.list_price, e.target.value)) }} className={inp} /></div>
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Net Price</label><input type="number" value={form.net_price} onChange={e => f('net_price', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[#4BBFBF] font-medium text-sm focus:outline-none focus:border-[#4BBFBF]/50" /></div>
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label><select value={form.currency} onChange={e => f('currency', e.target.value)} className={inp}>{['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['register_date','Register'],['next_due_date','Next Due'],['reminder_date','Reminder']].map(([k,l]) => (
              <div key={k}><label className="text-slate-400 text-xs mb-1 block font-medium">{l}</label><input type="date" value={form[k]} onChange={e => f(k, e.target.value)} className={inp} /></div>
            ))}
          </div>
          <div><label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label><textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} className={inp} /></div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Quick Dialer Pay Modal ────────────────────────────────────────────────────
function QuickPayDialerModal({ seats, onClose, onSaved }) {
  const allSeats = Array.isArray(seats) ? seats : [seats]
  const totalAmount = allSeats.reduce((sum, s) => sum + parseFloat(s.net_price || 0), 0)
  const currency = allSeats[0]?.currency || 'PKR'
  const [form, setForm] = useState({
    claimed_amount: totalAmount.toString(), currency,
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().slice(0, 10),
    transaction_ref: '', customer_notes: '',
    dialer_subscriptions: allSeats.map(s => s.id),
  })
  const [screenshot, setScreenshot] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const METHODS = ['bank_transfer','easypaisa','jazzcash','cash','stripe','paypal','other']
  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50'

  const save = async () => {
    if (!form.claimed_amount || !form.payment_date) return toast.error('Amount and date required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'dialer_subscriptions') v.forEach(id => fd.append('dialer_subscriptions', id))
        else if (v !== '' && v !== null) fd.append(k, v)
      })
      if (screenshot) fd.append('payment_screenshot', screenshot)
      await api.post('/store/dialer-payment-claims/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Dialer payment submitted! Admin will review shortly.')
      onSaved()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to submit') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-light rounded-2xl w-full max-w-md" style={{ border: '1px solid rgba(75,191,191,0.3)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">Submit Dialer Payment</h3>
            <p className="text-slate-500 text-xs mt-0.5">For {allSeats.length} seat{allSeats.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(75,191,191,0.06)', border: '1px solid rgba(75,191,191,0.15)' }}>
            <div className="text-[#4BBFBF] text-xs font-semibold uppercase tracking-widest mb-2">Paying for</div>
            {allSeats.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{s.domain_email}</span>
                <span className="text-emerald-400 font-medium">{s.currency} {parseFloat(s.net_price||0).toLocaleString()}/mo</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold text-sm">
              <span className="text-white">Total</span>
              <span className="text-emerald-400">{currency} {totalAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 text-xs mb-1 block font-medium">Amount *</label>
              <input type="number" value={form.claimed_amount} onChange={e => f('claimed_amount', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label>
              <select value={form.currency} onChange={e => f('currency', e.target.value)} className={inp}>
                {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Method</label>
              <select value={form.payment_method} onChange={e => f('payment_method', e.target.value)} className={inp}>
                {METHODS.map(m => <option key={m} value={m} className="bg-[#0e1420]">{m.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Date *</label>
              <input type="date" value={form.payment_date} onChange={e => f('payment_date', e.target.value)} className={inp} />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Transaction Reference</label>
            <input value={form.transaction_ref} onChange={e => f('transaction_ref', e.target.value)} placeholder="TXN ID, ref number…" className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Payment Screenshot</label>
            {screenshot ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#4BBFBF]/10 border border-[#4BBFBF]/20">
                <span className="text-slate-300 text-sm flex-1 truncate">{screenshot.name}</span>
                <button onClick={() => setScreenshot(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-[#4BBFBF]/40 text-sm transition-colors">
                Upload screenshot
                <input type="file" accept="image/*" className="hidden" onChange={e => setScreenshot(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Submitting…' : 'Submit Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 15

export default function DialerSubscriptionsPage({ user }) {
  const navigate = useNavigate()
  const [subs, setSubs] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [page, setPage] = useState(1)

  const isCustomer = user?.role === 'customer'
  const canManage = ['admin','sales'].includes(user?.role)
  const [payModal, setPayModal] = useState(null) // seat to pay for

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let q = []
      if (statusFilter) q.push('status=' + statusFilter)
      if (typeFilter) q.push('dialer_type=' + typeFilter)
      if (regionFilter) q.push('region=' + regionFilter)
      const qs = q.length ? '?' + q.join('&') : ''
      const calls = [api.get('/store/dialer-subscriptions/' + qs)]
      if (!isCustomer) calls.push(api.get('/store/customers/'))
      const results = await Promise.all(calls)
      setSubs(Array.isArray(results[0].data) ? results[0].data : results[0].data.results || [])
      if (!isCustomer) setCustomers(Array.isArray(results[1].data) ? results[1].data : results[1].data.results || [])
      setPage(1)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [statusFilter, typeFilter, regionFilter, isCustomer])

  useEffect(() => { load() }, [load])

  const filtered = subs.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.customer_name?.toLowerCase().includes(q) || s.domain_email?.toLowerCase().includes(q) ||
      s.dialer_username?.toLowerCase().includes(q) || s.phone_number?.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const expiredCount = subs.filter(s => s.expiry_status === 'expired').length
  const activeCount = subs.filter(s => s.expiry_status === 'active').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{isCustomer ? 'My Dialers' : 'Dialer Subscriptions'}</h1>
          <p className="text-slate-500 text-sm mt-1">Google Voice, Ring Central, NuxCall & more</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white"><HiOutlineRefresh className="w-4 h-4" /></button>
          {isCustomer && expiredCount > 0 && (
            <button onClick={() => setPayModal('all_expired')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10">
              <HiOutlineCreditCard className="w-4 h-4" /> Pay {expiredCount} Expired
            </button>
          )}
          {canManage && (
            <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              <HiOutlinePlus className="w-4 h-4" /> Add Dialer Seat
            </button>
          )}
        </div>
      </div>

      {/* Summary pills */}
      {!isCustomer && (
        <div className="flex gap-3 flex-wrap">
          <div className="glass-light rounded-xl px-3 py-2 text-sm"><span className="text-emerald-400 font-bold">{activeCount}</span> <span className="text-slate-400">Active</span></div>
          <div className="glass-light rounded-xl px-3 py-2 text-sm"><span className="text-red-400 font-bold">{expiredCount}</span> <span className="text-slate-400">Expired</span></div>
          <div className="glass-light rounded-xl px-3 py-2 text-sm"><span className="text-[#4BBFBF] font-bold">{subs.length}</span> <span className="text-slate-400">Total</span></div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search customer, email, username…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
        </div>
        {!isCustomer && (
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
            <option value="" className="bg-[#0e1420]">All Types</option>
            {DIALER_TYPES.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
          </select>
        )}
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
          <option value="" className="bg-[#0e1420]">All Regions</option>
          {REGIONS.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
          <option value="" className="bg-[#0e1420]">All Status</option>
          {['active','pending','temp_off','cancelled','expired'].map(s => <option key={s} value={s} className="bg-[#0e1420]">{s.replace('_',' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} /></div>
      ) : (
        <>
          <div className="glass-light rounded-2xl overflow-auto" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10">
                  {(!isCustomer ? ['Customer','Dialer','Region','Domain Email','Username','Phone','Net Price','Next Due','Due Status','SMS','Status',''] :
                    ['Dialer','Region','Domain Email','Phone','Net Price','Next Due','Due Status','SMS','']).map(h => (
                    <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={12} className="text-center text-slate-500 py-12">
                    <HiOutlinePhone className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    No dialer subscriptions found
                  </td></tr>
                ) : paged.map(s => (
                  <tr key={s.id} className={'border-b border-white/5 hover:bg-white/[0.02] ' + (s.expiry_status === 'expired' ? 'bg-red-500/[0.03]' : '')}
                    style={s.expiry_status === 'expired' ? { borderLeft: '2px solid rgba(239,68,68,0.3)' } : {}}>
                    {!isCustomer && <td className="px-4 py-3 text-white text-sm font-medium">{s.customer_name}</td>}
                    <td className="px-4 py-3"><span className={'px-2 py-0.5 rounded-full text-xs ' + (DIALER_BADGES[s.dialer_type] || '')}>{DIALER_TYPES.find(([v])=>v===s.dialer_type)?.[1]||s.dialer_type}</span></td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400 uppercase">{s.region}</span></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.domain_email}</td>
                    {!isCustomer && <td className="px-4 py-3 text-slate-400 text-xs">{s.dialer_username || '—'}</td>}
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.phone_number || '—'}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium text-sm">{s.currency} {parseFloat(s.net_price||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.next_due_date || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={'px-2 py-0.5 rounded-full text-xs ' + (EXPIRY_COLORS[s.expiry_status] || '')}>
                        {(s.expiry_status || 'no_expiry').replace(/_/g,' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={'px-2 py-0.5 rounded-full text-xs ' + (s.sms_status==='active'?'bg-emerald-500/15 text-emerald-400':s.sms_status==='inactive'?'bg-red-500/15 text-red-400':'bg-yellow-500/15 text-yellow-400')}>{s.sms_status}</span></td>
                    {!isCustomer && <td className="px-4 py-3"><span className={'px-2 py-0.5 rounded-full text-xs ' + (STATUS_COLORS[s.status]||'')}>{s.status?.replace('_',' ')}</span></td>}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {isCustomer && (s.expiry_status === 'expired' || s.expiry_status === 'expiring_soon') && (
                          <button onClick={() => setPayModal(s)}
                            className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25">
                            Pay Now
                          </button>
                        )}
                        {canManage && (
                          <button onClick={() => setModal(s)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{filtered.length} total · page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">← Prev</button>
                {Array.from({length: Math.min(totalPages,7)}, (_,i) => {
                  const p = totalPages <= 7 ? i+1 : page <= 4 ? i+1 : page >= totalPages-3 ? totalPages-6+i : page-3+i
                  return <button key={p} onClick={() => setPage(p)} className={'px-3 py-1.5 rounded-lg text-sm ' + (p===page ? 'text-[#4BBFBF] border border-[#4BBFBF]/30' : 'border border-white/10 text-slate-400 hover:bg-white/5')}>{p}</button>
                })}
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {modal && <DialerModal sub={modal==='new'?null:modal} customers={customers} onClose={() => setModal(null)} onSaved={load} />}
      {payModal && (
        <QuickPayDialerModal
          seats={payModal === 'all_expired' ? subs.filter(s => s.expiry_status === 'expired' || s.expiry_status === 'expiring_soon') : [payModal]}
          onClose={() => setPayModal(null)}
          onSaved={() => { setPayModal(null); load() }}
        />
      )}
    </div>
  )
}
