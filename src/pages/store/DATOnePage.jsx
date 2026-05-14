import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineRefresh, HiOutlineDatabase, HiOutlineUsers,
  HiOutlineExclamation, HiOutlineCloudDownload,
  HiOutlineSearch, HiOutlinePencil, HiOutlineX, HiOutlinePlus,
  HiOutlineWifi, HiOutlineLocationMarker,
  HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineCheckCircle,
  HiOutlineSwitchHorizontal, HiOutlineArrowRight,
} from 'react-icons/hi'

const TEAL = '#f97316'
const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50'

const EXPIRY_COLORS = {
  expired: 'text-red-400 bg-red-500/15',
  expiring_soon: 'text-orange-400 bg-orange-500/15',
  expiring_month: 'text-yellow-400 bg-yellow-500/15',
  active: 'text-emerald-400 bg-emerald-500/15',
  no_expiry: 'text-slate-400 bg-slate-500/15',
}

// ── Bulk assign multiple users to one customer ────────────────────────────────
function BulkAssignModal({ selectedUsers, customers, onClose, onSaved }) {
  const [form, setForm] = useState({ customer: '', currency: 'PKR' })
  const [prices, setPrices] = useState({})
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.customer) return toast.error('Select a customer')
    const missing = selectedUsers.filter(u => !prices[u.id])
    if (missing.length) return toast.error('Set a price for each user')
    setSaving(true)
    try {
      await Promise.all(selectedUsers.map(u =>
        api.post('/store/customer-seats/', {
          customer: form.customer,
          mongo_user: u.id,
          monthly_price: parseFloat(prices[u.id]),
          currency: form.currency,
        })
      ))
      toast.success(selectedUsers.length + ' users assigned to customer')
      onSaved(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || 'Failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">Assign {selectedUsers.length} User{selectedUsers.length > 1 ? 's' : ''} to Customer</h3>
            <p className="text-slate-500 text-xs mt-0.5">Set individual price per seat</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Customer *</label>
            <select value={form.customer} onChange={e => f('customer', e.target.value)} className={inp}>
              <option value="" className="bg-[#0e1420]">— Select Customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0e1420]">
                  {c.contact_person}{c.company_name ? ' (' + c.company_name + ')' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Currency</label>
            <select value={form.currency} onChange={e => f('currency', e.target.value)} className={inp} style={{ maxWidth: 120 }}>
              {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-medium">Price per seat ({form.currency})</label>
            {selectedUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{u.name}</div>
                  <div className="text-slate-500 text-xs truncate">{u.email} · {u.dat_account_name || 'No account'}</div>
                </div>
                <input type="number" placeholder="Price" value={prices[u.id] || ''}
                  onChange={e => setPrices(p => ({ ...p, [u.id]: e.target.value }))}
                  className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Assigning…' : 'Assign Seats'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit existing seat ────────────────────────────────────────────────────────
function EditSeatModal({ seat, customers, onClose, onSaved }) {
  const [mode, setMode] = useState(seat._openMode || 'edit') // 'edit' | 'reassign'
  const [form, setForm] = useState({
    monthly_price: seat.monthly_price || '',
    currency: seat.currency || 'PKR',
    start_date: seat.start_date || '',
    expiry_date: seat.expiry_date || '',
    reminder_date: seat.reminder_date || '',
    is_active: seat.is_active ?? true,
    notes: seat.notes || '',
  })
  const [newCustomer, setNewCustomer] = useState('')
  const [newPrice, setNewPrice] = useState(seat.monthly_price || '')
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/store/customer-seats/' + seat.id + '/', form)
      toast.success('Seat updated'); onSaved(); onClose()
    } catch { toast.error('Failed to update seat') } finally { setSaving(false) }
  }

  const reassign = async () => {
    if (!newCustomer) return toast.error('Select a customer to reassign to')
    if (newCustomer === String(seat.customer)) return toast.error('Same customer selected')
    setSaving(true)
    try {
      await api.delete('/store/customer-seats/' + seat.id + '/')
      await api.post('/store/customer-seats/', {
        customer: newCustomer,
        mongo_user: seat.mongo_user,
        monthly_price: parseFloat(newPrice) || 0,
        currency: form.currency,
        start_date: form.start_date || null,
        expiry_date: form.expiry_date || null,
        reminder_date: form.reminder_date || null,
        is_active: form.is_active,
        notes: form.notes,
      })
      const cname = customers.find(c => String(c.id) === String(newCustomer))?.contact_person || 'new customer'
      toast.success(seat.mongo_user_name + ' reassigned to ' + cname)
      onSaved(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || 'Reassign failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-md" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold">{mode === 'edit' ? 'Edit Seat' : 'Reassign Seat'}</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              <span className="text-white font-medium">{seat.mongo_user_name}</span>
              <span className="text-slate-500"> currently: </span>
              <span className="text-[#f97316]">{seat.customer_name}</span>
            </p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="flex gap-1 m-4 mb-0 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button onClick={() => setMode('edit')}
            className={'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ' + (mode === 'edit' ? 'text-[#f97316]' : 'text-slate-400 hover:text-white')}
            style={mode === 'edit' ? { background: 'rgba(75,191,191,0.12)', border: '1px solid rgba(75,191,191,0.2)' } : {}}>
            <HiOutlinePencil className="w-3.5 h-3.5" /> Edit Pricing & Dates
          </button>
          <button onClick={() => setMode('reassign')}
            className={'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ' + (mode === 'reassign' ? 'text-orange-400' : 'text-slate-400 hover:text-white')}
            style={mode === 'reassign' ? { background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' } : {}}>
            <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" /> Reassign Customer
          </button>
        </div>

        {mode === 'edit' && (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-slate-400 text-xs mb-1 block">Monthly Price</label>
                <input type="number" value={form.monthly_price} onChange={e => f('monthly_price', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Currency</label>
                <select value={form.currency} onChange={e => f('currency', e.target.value)} className={inp}>
                  {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['start_date','Start'],['expiry_date','Expiry'],['reminder_date','Reminder']].map(([k, l]) => (
                <div key={k}>
                  <label className="text-slate-400 text-xs mb-1 block">{l}</label>
                  <input type="date" value={form[k]} onChange={e => f(k, e.target.value)} className={inp} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => f('notes', e.target.value)} className={inp} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => f('is_active', !form.is_active)}
                className={'w-10 h-5 rounded-full relative transition-colors ' + (form.is_active ? 'bg-[#f97316]' : 'bg-white/10')}>
                <div className={'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ' + (form.is_active ? 'left-5' : 'left-0.5')} />
              </div>
              <span className="text-slate-300 text-sm">Active Seat</span>
            </label>
          </div>
        )}

        {mode === 'reassign' && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <div className="text-orange-300 font-semibold mb-1">Reassigning this seat</div>
              <div className="text-slate-400">
                The current link to <span className="text-white font-medium">{seat.customer_name}</span> will be removed and a new link will be created for the customer you select below. Pricing and dates carry over unless you change them.
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">New Customer *</label>
              <select value={newCustomer} onChange={e => setNewCustomer(e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— Select New Customer —</option>
                {(customers || []).filter(c => String(c.id) !== String(seat.customer)).map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0e1420]">
                    {c.contact_person}{c.company_name ? ' (' + c.company_name + ')' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Monthly Price</label>
                <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label>
                <select value={form.currency} onChange={e => f('currency', e.target.value)} className={inp}>
                  {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
                </select>
              </div>
            </div>
            {newCustomer && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(75,191,191,0.08)', border: '1px solid rgba(75,191,191,0.15)' }}>
                <HiOutlineSwitchHorizontal className="w-4 h-4 text-[#f97316] flex-shrink-0" />
                <span className="text-slate-400 text-xs">
                  <span className="text-white font-medium">{seat.mongo_user_name}</span>
                  {' '}will move from{' '}
                  <span className="text-red-400">{seat.customer_name}</span>
                  {' '}to{' '}
                  <span className="text-[#f97316] font-semibold">{(customers || []).find(c => String(c.id) === String(newCustomer))?.contact_person}</span>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          {mode === 'edit' ? (
            <button onClick={save} disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          ) : (
            <button onClick={reassign} disabled={saving || !newCustomer}
              className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
              style={{ background: 'rgba(249,115,22,0.3)', border: '1px solid rgba(249,115,22,0.5)' }}>
              {saving ? 'Reassigning…' : 'Confirm Reassign'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Add Proxy modal ───────────────────────────────────────────────────────────
function ProxyModal({ proxy, accounts, onClose, onSaved }) {
  const isEdit = !!proxy?.id
  const EMPTY = { name: '', proxy_string: '', location: '', isp: '', dat_account: '', is_active: true, notes: '' }
  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...proxy, dat_account: proxy.dat_account || '' } : { ...EMPTY })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.proxy_string.trim()) return toast.error('Proxy string required')
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch('/store/proxies/' + proxy.id + '/', form)
        toast.success('Proxy updated')
      } else {
        await api.post('/store/proxies/', form)
        toast.success('Proxy added')
      }
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-md" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-bold">{isEdit ? 'Edit' : 'Add'} Proxy</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Label / Name</label>
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. US Residential #1" className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Proxy String *</label>
            <input value={form.proxy_string} onChange={e => f('proxy_string', e.target.value)}
              placeholder="host:port:user:pass" className={inp + ' font-mono text-xs'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Location / City</label>
              <input value={form.location} onChange={e => f('location', e.target.value)} placeholder="e.g. New York, US" className={inp} />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">ISP / Provider</label>
              <input value={form.isp} onChange={e => f('isp', e.target.value)} placeholder="e.g. Decodo, Bright" className={inp} />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Linked DAT Account</label>
            <select value={form.dat_account} onChange={e => f('dat_account', e.target.value)} className={inp}>
              <option value="" className="bg-[#0e1420]">— Not linked —</option>
              {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#0e1420]">{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} className={inp} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => f('is_active', !form.is_active)}
              className={'w-10 h-5 rounded-full relative transition-colors ' + (form.is_active ? 'bg-[#f97316]' : 'bg-white/10')}>
              <div className={'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ' + (form.is_active ? 'left-5' : 'left-0.5')} />
            </div>
            <span className="text-slate-300 text-sm">Active</span>
          </label>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Add Proxy')}
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Quick Pay Modal for customer ──────────────────────────────────────────────
function CustomerQuickPayModal({ seats, onClose, onSaved }) {
  const totalAmount = seats.reduce((sum, s) => sum + parseFloat(s.monthly_price || 0), 0)
  const currency = seats[0]?.currency || 'PKR'
  const [form, setForm] = useState({
    claimed_amount: totalAmount.toString(),
    currency: currency,
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().slice(0, 10),
    transaction_ref: '',
    customer_notes: '',
    user_links: seats.map(s => s.id),
  })
  const [screenshot, setScreenshot] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const METHODS = ['bank_transfer','easypaisa','jazzcash','cash','stripe','paypal','other']
  const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50'

  const save = async () => {
    if (!form.claimed_amount || !form.payment_date) return toast.error('Amount and date required')
    saving || setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'user_links') v.forEach(id => fd.append('user_links', id))
        else if (v !== '' && v !== null) fd.append(k, v)
      })
      if (screenshot) fd.append('payment_screenshot', screenshot)
      await api.post('/store/payment-claims/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Payment submitted! Admin will review shortly.')
      onSaved()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed to submit') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-light rounded-2xl w-full max-w-md" style={{ border: '1px solid rgba(75,191,191,0.3)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">Submit Payment</h3>
            <p className="text-slate-500 text-xs mt-0.5">For {seats.length} seat{seats.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Selected seats summary */}
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(75,191,191,0.06)', border: '1px solid rgba(75,191,191,0.15)' }}>
            <div className="text-[#f97316] text-xs font-semibold uppercase tracking-widest mb-2">Paying for</div>
            {seats.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{s.mongo_user_name}</span>
                <span className="text-emerald-400 font-medium">{s.currency} {parseFloat(s.monthly_price||0).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-1.5 flex items-center justify-between text-sm font-bold">
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
            <label className="text-slate-400 text-xs mb-1 block font-medium">Transaction ID / Reference</label>
            <input value={form.transaction_ref} onChange={e => f('transaction_ref', e.target.value)}
              placeholder="Bank TXN ID, JazzCash ref…" className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Payment Screenshot</label>
            {screenshot ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f97316]/10 border border-orange-500/20">
                <span className="text-slate-300 text-sm flex-1 truncate">{screenshot.name}</span>
                <button onClick={() => setScreenshot(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-orange-500/40 text-sm transition-colors">
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
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Submitting…' : 'Submit Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DATOnePage({ user }) {
  const [accounts, setAccounts] = useState([])
  const [mongoUsers, setMongoUsers] = useState([])
  const [seats, setSeats] = useState([])
  const [customers, setCustomers] = useState([])
  const [proxies, setProxies] = useState([])
  const [syncStatus, setSyncStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const [search, setSearch] = useState('')
  const [activeAccount, setActiveAccount] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [bulkModal, setBulkModal] = useState(false)
  const [expiryFilter, setExpiryFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [editModal, setEditModal] = useState(null)
  const [proxyModal, setProxyModal] = useState(null)
  const [assignModal, setAssignModal] = useState(null)
  const [userSubTab, setUserSubTab] = useState('active')
  const navigate = useNavigate()
  const [tab, setTab] = useState('seats')
  const [pageSize, setPageSize] = useState(15)
  const [usersPage, setUsersPage] = useState(1)
  const [seatsPage, setSeatsPage] = useState(1)

  const isCustomer = user?.role === 'customer'
  const canManage = ['admin','sales'].includes(user?.role)
  const canSync = user?.role === 'admin' || (user?.role === 'sales' && user?.is_dept_head)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const calls = [
        api.get('/store/customer-seats/?page_size=500'),
        api.get('/store/sync/status/').catch(() => ({ data: null })),
      ]
      if (!isCustomer) {
        calls.push(api.get('/store/dat-accounts/?page_size=100'))
        calls.push(api.get('/store/mongo-users/?page_size=500'))
        calls.push(api.get('/store/customers/?page_size=200'))
        calls.push(api.get('/store/proxies/?page_size=200').catch(() => ({ data: [] })))
      }
      const results = await Promise.all(calls)
      setSeats(Array.isArray(results[0].data) ? results[0].data : results[0].data.results || [])
      setSyncStatus(results[1].data)
      if (!isCustomer) {
        setAccounts(Array.isArray(results[2].data) ? results[2].data : results[2].data.results || [])
        setMongoUsers(Array.isArray(results[3].data) ? results[3].data : results[3].data.results || [])
        setCustomers(Array.isArray(results[4].data) ? results[4].data : results[4].data.results || [])
        setProxies(Array.isArray(results[5].data) ? results[5].data : results[5].data.results || [])
      }
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [isCustomer])

  useEffect(() => { load() }, [load])

  const doSync = async () => {
    setSyncing(true)
    try {
      const { data } = await api.post('/store/sync/import/', { dry_run: false })
      const r = data.result || {}
      const acc = r.dat_accounts || {}
      const usr = r.mongo_users || {}
      const mc = r.mongo_counts || {}
      if (r.connection && r.connection !== 'ok') {
        toast.error('MongoDB connection failed: ' + r.connection); return
      }
      const hasNew = (acc.new || 0) + (usr.new || 0) > 0
      const hasErr = (acc.errors || 0) + (usr.errors || 0) > 0
      const msg = (mc.datasessions !== undefined ? 'MongoDB: ' + mc.datasessions + ' sessions, ' + mc.users + ' users | ' : '') +
        'Accounts: ' + (acc.new||0) + ' new | Users: ' + (usr.new||0) + ' new'
      if (hasErr) toast.error('Sync had errors — check server logs')
      else if (hasNew) toast.success(msg)
      else toast(msg + ' — already up to date', { icon: '✓' })
      load()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Sync failed')
    } finally { setSyncing(false) }
  }

  const toggleSelectUser = (u) => {
    setSelectedUsers(p => p.find(x => x.id === u.id) ? p.filter(x => x.id !== u.id) : [...p, u])
  }

  const toggleUserActive = async (u) => {
    const action = u.is_active_in_cms ? 'deactivate' : 'activate'
    const confirmed = window.confirm(
      u.is_active_in_cms
        ? 'Deactivate ' + u.name + '? The customer will see this seat as Blocked.'
        : 'Activate ' + u.name + '?'
    )
    if (!confirmed) return
    try {
      await api.patch('/store/mongo-users/' + u.id + '/update_cms_fields/', { is_active_in_cms: !u.is_active_in_cms })
      toast.success(u.name + ' ' + action + 'd')
      load()
    } catch { toast.error('Failed') }
  }

  const filteredUsers = mongoUsers.filter(u => {
    if (activeAccount !== 'all' && String(u.dat_account) !== String(activeAccount)) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
        !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredSeats = seats.filter(s => {
    if (activeAccount !== 'all' && !mongoUsers.find(u => u.id === s.mongo_user && String(u.dat_account) === String(activeAccount))) return false
    if (search && !s.mongo_user_name?.toLowerCase().includes(search.toLowerCase()) &&
        !s.customer_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (expiryFilter && s.expiry_status !== expiryFilter) return false
    if (customerFilter && String(s.customer) !== String(customerFilter)) return false
    return true
  })

  const totalRevenue = seats.filter(s => s.is_active).reduce((sum, s) => sum + parseFloat(s.monthly_price || 0), 0)

  // ── CUSTOMER PORTAL VIEW ──────────────────────────────────────────────────
  if (isCustomer) {
    const thisMonthSeats = seats.filter(s => s.is_active)
    const totalDue = thisMonthSeats.reduce((sum, s) => sum + parseFloat(s.monthly_price || 0), 0)
    const expiringSoon = seats.filter(s => s.expiry_status === 'expiring_soon' || s.expiry_status === 'expiring_month')
    const filteredCustomerSeats = seats.filter(s =>
      !search || s.mongo_user_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.mongo_user_email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">My DAT One</h1>
          <p className="text-slate-500 text-sm mt-1">Your active DAT LoadBoard seats and subscription status</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { value: thisMonthSeats.length, label: 'Active Seats', sub: 'this month', color: 'text-[#f97316]' },
            { value: 'PKR ' + totalDue.toLocaleString(), label: 'Monthly Total', sub: 'sum of all seats', color: 'text-emerald-400' },
            { value: expiringSoon.length, label: 'Expiring Soon', sub: 'within 30 days', color: 'text-orange-400',
              onClick: expiringSoon.length > 0 ? () => { setAssignModal({ prefill: expiringSoon, type: 'expiring' }) } : null },
            { value: seats.filter(s => s.expiry_status === 'expired').length, label: 'Expired', sub: 'click to pay',
              color: 'text-red-400',
              onClick: seats.filter(s => s.expiry_status === 'expired').length > 0 ? () => { setAssignModal({ prefill: seats.filter(s => s.expiry_status === 'expired'), type: 'expired' }) } : null },
          ].map(s => (
            <div key={s.label}
              onClick={s.onClick}
              className={'glass-light rounded-2xl p-4 ' + (s.onClick ? 'cursor-pointer hover:bg-white/[0.06] transition-colors' : '')}
              style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
              <div className={'text-2xl font-bold ' + s.color}>{s.value}</div>
              <div className="text-white text-xs font-medium mt-0.5">{s.label}</div>
              <div className="text-slate-500 text-xs">{s.sub}</div>
              {s.onClick && <div className="text-[#f97316] text-xs mt-1">→ Pay Now</div>}
            </div>
          ))}
        </div>

        {/* Search filter */}
        {seats.length > 1 && (
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search user name or email…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} /></div>
        ) : filteredCustomerSeats.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <HiOutlineDatabase className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>No DAT seats assigned yet. Contact your account manager.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomerSeats.map(s => (
              <div key={s.id} className="glass-light rounded-2xl p-4"
                style={{ border: '1px solid ' + (s.expiry_status === 'expired' ? 'rgba(239,68,68,0.2)' : s.expiry_status === 'expiring_soon' ? 'rgba(249,115,22,0.2)' : 'rgba(75,191,191,0.1)') }}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-semibold">{s.mongo_user_name}</span>
                      {!s.is_active && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400">Blocked</span>}
                      {s.is_active && (
                        <span className={'px-2 py-0.5 rounded-full text-xs ' + (EXPIRY_COLORS[s.expiry_status] || '')}>
                          {(s.expiry_status || '').replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-xs mb-3">{s.mongo_user_email}</div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-slate-500 text-xs">Monthly Price</div>
                        <div className="text-emerald-400 font-bold">{s.currency} {parseFloat(s.monthly_price || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Expiry Date</div>
                        <div className={s.expiry_status === 'expired' ? 'text-red-400 font-medium' : 'text-slate-300'}>{s.expiry_date || '—'}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Searches</div>
                        <div className="text-[#f97316] font-medium">{s.permissions_summary?.searches || 0} per session</div>
                      </div>
                    </div>
                    {s.permissions_summary?.active_perms?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.permissions_summary.active_perms.map(p => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-[#f97316]/10 text-[#f97316]">{p.replace('perm_','').replace(/_/g,' ')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Pay button for expired/expiring */}
                  {s.is_active && (s.expiry_status === 'expired' || s.expiry_status === 'expiring_soon' || s.expiry_status === 'expiring_month') && (
                    <button
                      onClick={() => setAssignModal({ prefill: [s], type: s.expiry_status })}
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#0e1420' }}>
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Pay Modal for customer */}
        {assignModal && (
          <CustomerQuickPayModal
            seats={assignModal.prefill}
            onClose={() => setAssignModal(null)}
            onSaved={() => { setAssignModal(null); load() }}
          />
        )}
      </div>
    )
  }

  // ── STAFF VIEW ────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'seats', label: 'Customer Seats' },
    { id: 'users', label: 'All DAT Users' },
    { id: 'proxies', label: 'Proxies' },
    { id: 'accounts', label: 'DAT Accounts' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">DAT One</h1>
          <p className="text-slate-500 text-sm mt-1">LoadBoard accounts synced from MongoDB · assign to customers · manage payments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          {canSync && (
            <button onClick={doSync} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'rgba(75,191,191,0.15)', border: '1px solid rgba(75,191,191,0.3)' }}>
              <HiOutlineCloudDownload className={'w-4 h-4 ' + (syncing ? 'animate-bounce' : '')} />
              {syncing ? 'Syncing…' : 'Import from MongoDB'}
            </button>
          )}
        </div>
      </div>

      {/* Conflict banner */}
      {syncStatus && (syncStatus.dat_account_conflicts > 0 || syncStatus.mongo_user_conflicts > 0) && (
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(239,154,50,0.1)', border: '1px solid rgba(239,154,50,0.25)' }}>
          <div className="flex items-center gap-3">
            <HiOutlineExclamation className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div>
              <div className="text-orange-300 font-semibold text-sm">
                {syncStatus.dat_account_conflicts + syncStatus.mongo_user_conflicts} conflict(s) need resolution
              </div>
              <div className="text-slate-500 text-xs">MongoDB data changed after your last edit.</div>
            </div>
          </div>
          <button onClick={() => navigate('/store/conflicts')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/30">
            Review <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'DAT Accounts', value: accounts.length, sub: accounts.filter(a => a.is_logged_in).length + ' logged in', color: 'text-white' },
          { label: 'Total Seats (Users)', value: mongoUsers.length, sub: mongoUsers.filter(u => !u.assigned_to).length + ' unassigned', color: 'text-[#f97316]' },
          { label: 'Customer Seats', value: seats.filter(s => s.is_active).length, sub: 'active this month', color: 'text-emerald-400' },
          { label: 'Monthly Revenue', value: 'PKR ' + totalRevenue.toLocaleString(), sub: 'from active seats', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
            <div className={'text-xl font-bold ' + s.color}>{s.value}</div>
            <div className="text-white text-xs font-medium mt-0.5">{s.label}</div>
            <div className="text-slate-500 text-xs">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all ' + (tab === t.id ? 'text-[#f97316]' : 'text-slate-400 hover:text-white')}
            style={tab === t.id ? { background: 'rgba(75,191,191,0.12)', border: '1px solid rgba(75,191,191,0.2)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + filter row */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50" />
        </div>
        {(tab === 'seats' || tab === 'users') && (
          <select value={activeAccount} onChange={e => setActiveAccount(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm">
            <option value="all" className="bg-[#0e1420]">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id} className="bg-[#0e1420]">{a.name}</option>)}
          </select>
        )}
        {tab === 'seats' && (
          <>
            <select value={expiryFilter} onChange={e => setExpiryFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
              <option value="" className="bg-[#0e1420]">All Expiry</option>
              {['expired','expiring_soon','expiring_month','active','no_expiry'].map(s =>
                <option key={s} value={s} className="bg-[#0e1420]">{s.replace(/_/g,' ')}</option>
              )}
            </select>
            <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
              <option value="" className="bg-[#0e1420]">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}</option>)}
            </select>
          </>
        )}
        {tab === 'users' && selectedUsers.length > 0 && (
          <button onClick={() => setBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <HiOutlinePlus className="w-4 h-4" /> Assign {selectedUsers.length} selected
          </button>
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 text-xs">Show</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setUsersPage(1); setSeatsPage(1) }}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs">
            {[10,15,25,50].map(n => <option key={n} value={n} className="bg-[#0e1420]">{n}</option>)}
          </select>
        </div>
        {tab === 'proxies' && canManage && (
          <button onClick={() => setProxyModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <HiOutlinePlus className="w-4 h-4" /> Add Proxy
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} /></div>
      ) : (
        <>
          {/* ── Customer Seats Tab ── */}
          {tab === 'seats' && (
            <>
            <div className="glass-light rounded-2xl overflow-auto" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
              <table className="w-full min-w-[750px]">
                <thead><tr className="border-b border-white/10">
                  {['User Name','Email','DAT Account','Searches','Price / mo','Expiry','Status','actions'].map((h,i) => (
                    <th key={h+i} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h === 'actions' ? '' : h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredSeats.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-slate-500 py-12">No seats assigned yet</td></tr>
                  ) : filteredSeats.slice((seatsPage-1)*pageSize, seatsPage*pageSize).map(s => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="text-white text-sm font-medium">{s.mongo_user_name}</div>
                        <div className="text-slate-500 text-xs">{s.customer_name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{s.mongo_user_email}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{s.dat_account_name || '—'}</td>
                      <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] text-xs">{s.permissions_summary?.searches || 0}</span></td>
                      <td className="px-4 py-3 text-emerald-400 font-medium text-sm">{s.currency} {parseFloat(s.monthly_price || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{s.expiry_date || '—'}</td>
                      <td className="px-4 py-3"><span className={'px-2 py-0.5 rounded-full text-xs ' + (EXPIRY_COLORS[s.expiry_status] || '')}>{(s.expiry_status || '—').replace(/_/g, ' ')}</span></td>
                      <td className="px-4 py-3">
                        {canManage && (
                        <div className="flex gap-1">
                          <button onClick={() => setEditModal(s)} title="Edit seat" className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"><HiOutlinePencil className="w-4 h-4" /></button>
                          <button onClick={() => { setEditModal({...s, _openMode:'reassign'}) }} title="Reassign to another customer" className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"><HiOutlineSwitchHorizontal className="w-4 h-4" /></button>
                        </div>
                      )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Math.ceil(filteredSeats.length / pageSize) > 1 && (
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-slate-500 text-sm">{filteredSeats.length} seats · page {seatsPage} of {Math.ceil(filteredSeats.length/pageSize)}</span>
                <div className="flex gap-2">
                  <button onClick={()=>setSeatsPage(p=>Math.max(1,p-1))} disabled={seatsPage===1} className="px-3 py-1 rounded-lg text-xs border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">← Prev</button>
                  <button onClick={()=>setSeatsPage(p=>Math.min(Math.ceil(filteredSeats.length/pageSize),p+1))} disabled={seatsPage===Math.ceil(filteredSeats.length/pageSize)} className="px-3 py-1 rounded-lg text-xs border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">Next →</button>
                </div>
              </div>
            )}
            </>
          )}

          {/* ── All DAT Users Tab ── */}
          {tab === 'users' && (
            <>
            {/* Sub-tabs: Active vs Blocked */}
            {!userSubTab && setUserSubTab('active') /* init */}
            <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <button onClick={() => setUserSubTab('active')}
                className={'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ' + (userSubTab !== 'blocked' ? 'text-[#f97316]' : 'text-slate-400 hover:text-white')}
                style={userSubTab !== 'blocked' ? { background: 'rgba(75,191,191,0.12)', border: '1px solid rgba(75,191,191,0.2)' } : {}}>
                Active Users ({filteredUsers.filter(u => u.is_active_in_cms).length})
              </button>
              <button onClick={() => setUserSubTab('blocked')}
                className={'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ' + (userSubTab === 'blocked' ? 'text-red-400' : 'text-slate-400 hover:text-white')}
                style={userSubTab === 'blocked' ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' } : {}}>
                Blocked ({filteredUsers.filter(u => !u.is_active_in_cms).length})
              </button>
            </div>
            <div className="glass-light rounded-2xl overflow-auto" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
              <table className="w-full min-w-[800px]">
                <thead><tr className="border-b border-white/10">
                  {userSubTab !== 'blocked' && <th className="px-4 py-3 w-10">
                    <input type="checkbox" className="accent-[#f97316]"
                      checked={selectedUsers.length === filteredUsers.filter(u => u.is_active_in_cms && !u.assigned_to).length && filteredUsers.filter(u => u.is_active_in_cms && !u.assigned_to).length > 0}
                      onChange={e => setSelectedUsers(e.target.checked ? filteredUsers.filter(u => u.is_active_in_cms && !u.assigned_to) : [])} />
                  </th>}
                  {(userSubTab === 'blocked' ? ['sel','User','Email','DAT Account','Blocked Reason','actions'] : ['sel','User','Email','DAT Account','Searches','Assigned To','Sync','actions']).map(h => (
                    <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h === 'sel' || h === 'actions' ? '' : h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-slate-500 py-12">No users — run "Import from MongoDB"</td></tr>
                  ) : filteredUsers.filter(u => userSubTab === 'blocked' ? !u.is_active_in_cms : u.is_active_in_cms).slice((usersPage-1)*pageSize, usersPage*pageSize).map(u => {
                    const isSelected = selectedUsers.some(x => x.id === u.id)
                    const userSeat = seats.find(s => s.mongo_user === u.id)
                    const isExpiredSeat = userSeat?.expiry_status === 'expired'
                    const isBlocked = !u.is_active_in_cms
                    return (
                      <tr key={u.id}
                        className={'border-b border-white/5 hover:bg-white/[0.02] ' + (isBlocked ? 'opacity-40 ' : isExpiredSeat ? 'bg-red-500/[0.04] ' : '')}
                        style={isExpiredSeat && !isBlocked ? { borderLeft: '2px solid rgba(239,68,68,0.35)' } : {}}>
                        <td className="px-4 py-3">
                          {!u.assigned_to && (
                            <input type="checkbox" className="accent-[#f97316]" checked={isSelected} onChange={() => toggleSelectUser(u)} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium">{u.name}</span>
                            {u.is_banned && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400">DAT Banned</span>}
                            {isBlocked && <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/20 text-slate-400">Blocked</span>}
                            {!isBlocked && isExpiredSeat && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400">Expired</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{u.dat_account_name || <span className="text-slate-600">—</span>}</td>
                        <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] text-xs">{u.searches_allowed}</span></td>
                        <td className="px-4 py-3">
                          {u.assigned_to ? (
                            <div>
                              <div className="text-white text-xs">{u.assigned_to.customer_name}</div>
                              <div className="text-[#f97316] text-xs">{u.assigned_to.price}/mo</div>
                            </div>
                          ) : (
                            <span className="text-yellow-400 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={'px-2 py-0.5 rounded-full text-xs ' + (u.sync_status === 'ok' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400')}>
                            {u.sync_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {canManage && !u.assigned_to && (
                              <button onClick={() => { setSelectedUsers([u]); setBulkModal(true) }}
                                className="px-2 py-1 rounded-lg text-xs font-medium"
                                style={{ background: 'rgba(75,191,191,0.15)', color: '#f97316' }}>
                                Assign
                              </button>
                            )}
                            {canManage && (
                              u.is_active_in_cms ? (
                                <button onClick={() => toggleUserActive(u)}
                                  title="Block this user"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-colors">
                                  <HiOutlineLockClosed className="w-3.5 h-3.5" /> Block
                                </button>
                              ) : (
                                <button onClick={() => toggleUserActive(u)}
                                  title="Unblock this user"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
                                  <HiOutlineLockOpen className="w-3.5 h-3.5" /> Unblock
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {Math.ceil(filteredUsers.filter(u => userSubTab === 'blocked' ? !u.is_active_in_cms : u.is_active_in_cms).length / pageSize) > 1 && (
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-slate-500 text-sm">{filteredUsers.filter(u=>userSubTab==='blocked'?!u.is_active_in_cms:u.is_active_in_cms).length} users · page {usersPage} of {Math.ceil(filteredUsers.filter(u=>userSubTab==='blocked'?!u.is_active_in_cms:u.is_active_in_cms).length/pageSize)}</span>
                <div className="flex gap-2">
                  <button onClick={()=>setUsersPage(p=>Math.max(1,p-1))} disabled={usersPage===1} className="px-3 py-1 rounded-lg text-xs border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">← Prev</button>
                  <button onClick={()=>setUsersPage(p=>Math.min(Math.ceil(filteredUsers.filter(u=>userSubTab==='blocked'?!u.is_active_in_cms:u.is_active_in_cms).length/pageSize),p+1))} disabled={usersPage===Math.ceil(filteredUsers.filter(u=>userSubTab==='blocked'?!u.is_active_in_cms:u.is_active_in_cms).length/pageSize)} className="px-3 py-1 rounded-lg text-xs border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">Next →</button>
                </div>
              </div>
            )}
            </>
          )}

          {/* ── Proxies Tab ── */}
          {tab === 'proxies' && (
            <div className="space-y-3">
              {proxies.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <HiOutlineWifi className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  No proxies recorded yet. Add one to track your proxy pool.
                </div>
              ) : proxies.filter(p => !search || p.proxy_string?.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())).map(p => (
                <div key={p.id} className="glass-light rounded-2xl p-4 flex items-center gap-4"
                  style={{ border: '1px solid ' + (p.is_active ? 'rgba(75,191,191,0.12)' : 'rgba(255,255,255,0.05)') }}>
                  <div className={'w-2 h-2 rounded-full flex-shrink-0 ' + (p.is_active ? 'bg-emerald-400' : 'bg-slate-600')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      {p.name && <span className="text-white text-sm font-medium">{p.name}</span>}
                      {p.location && (
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <HiOutlineLocationMarker className="w-3 h-3" />{p.location}
                        </span>
                      )}
                      {p.isp && <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/15 text-purple-400">{p.isp}</span>}
                    </div>
                    <div className="text-slate-400 text-xs font-mono truncate">{p.proxy_string}</div>
                    {p.dat_account_name && (
                      <div className="text-[#f97316] text-xs mt-1">Used by: {p.dat_account_name}</div>
                    )}
                  </div>
                  {canManage && (
                    <button onClick={() => setProxyModal(p)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white flex-shrink-0">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── DAT Accounts Tab ── */}
          {tab === 'accounts' && (
            <div className="space-y-3">
              {accounts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No DAT accounts — run "Import from MongoDB"</div>
              ) : accounts.map(a => (
                <div key={a.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid ' + (a.sync_status === 'conflict' ? 'rgba(239,154,50,0.3)' : 'rgba(255,255,255,0.07)') }}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={'px-2 py-0.5 rounded-full text-xs font-semibold ' + (a.account_type === 'dat_one' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400')}>
                          {a.account_type === 'dat_one' ? 'DAT One' : 'DAT Power'}
                        </span>
                        <span className="text-white font-semibold">{a.name}</span>
                        {a.is_logged_in && <span className="text-emerald-400 text-xs flex items-center gap-1"><HiOutlineWifi className="w-3 h-3" /> Logged In</span>}
                        {a.sync_status === 'conflict' && <span className="text-orange-400 text-xs flex items-center gap-1"><HiOutlineExclamation className="w-3 h-3" /> Conflict</span>}
                      </div>
                      <div className="text-slate-500 text-xs font-mono truncate max-w-lg">{a.proxy}</div>
                      {a.conflict_data && (
                        <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: 'rgba(239,154,50,0.08)', border: '1px solid rgba(239,154,50,0.2)' }}>
                          <div className="text-orange-300 font-medium mb-1">MongoDB changed:</div>
                          {Object.entries(a.conflict_data).map(([k, v]) => (
                            <div key={k} className="text-slate-400"><span className="text-orange-300">{k}</span>: CMS="{v.cms}" → Mongo="{v.mongo}"</div>
                          ))}
                          <button onClick={async () => {
                            await api.post('/store/conflicts/resolve/dat-account/' + a.id + '/')
                            toast.success('Resolved — keeping CMS version'); load()
                          }} className="mt-2 px-2 py-1 rounded bg-orange-500/20 text-orange-300 hover:bg-orange-500/30">
                            Keep CMS version
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[#f97316] font-bold text-lg">{a.active_seat_count || 0}</div>
                      <div className="text-slate-500 text-xs">/ {a.seat_count || 0} seats</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {bulkModal && <BulkAssignModal selectedUsers={selectedUsers} customers={customers} onClose={() => { setBulkModal(false); setSelectedUsers([]) }} onSaved={load} />}
      {editModal && <EditSeatModal seat={editModal} customers={customers} onClose={() => setEditModal(null)} onSaved={load} />}
      {proxyModal && <ProxyModal proxy={proxyModal === 'new' ? null : proxyModal} accounts={accounts} onClose={() => setProxyModal(null)} onSaved={load} />}
    </div>
  )
}
