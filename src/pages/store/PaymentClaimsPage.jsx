import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlineX, HiOutlineRefresh, HiOutlineCheck,
  HiOutlinePhotograph, HiOutlineSearch, HiOutlinePencil,
  HiOutlineChevronRight, HiOutlineDatabase, HiOutlinePhone,
} from 'react-icons/hi'

const TEAL = '#f97316'
const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50'
const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
}
const METHODS = ['bank_transfer','easypaisa','jazzcash','cash','stripe','paypal','other']

// ── Submit Modal (DAT) ────────────────────────────────────────────────────────
function SubmitDATClaimModal({ seats, customers, isCustomer, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer: '', claimed_amount: '', currency: 'PKR',
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().slice(0,10),
    transaction_ref: '', customer_notes: '', user_links: [],
  })
  const [screenshot, setScreenshot] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const seatsForCustomer = isCustomer ? seats : seats.filter(s => !form.customer || String(s.customer) === String(form.customer))

  const save = async () => {
    if (!isCustomer && !form.customer) return toast.error('Select a customer')
    if (!form.claimed_amount || !form.payment_date) return toast.error('Amount and date required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'user_links') v.forEach(id => fd.append('user_links', id))
        else if (v !== '' && v !== null) fd.append(k, v)
      })
      if (screenshot) fd.append('payment_screenshot', screenshot)
      await api.post('/store/payment-claims/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('DAT payment submitted'); onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">Submit DAT One Payment</h3>
            <p className="text-slate-500 text-xs mt-0.5">Payment for LoadBoard seat subscriptions</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!isCustomer && (
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Customer *</label>
              <select value={form.customer} onChange={e => f('customer', e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— Select —</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}{c.company_name ? ' (' + c.company_name + ')' : ''}</option>)}
              </select>
            </div>
          )}
          {seatsForCustomer.length > 0 && (
            <div>
              <label className="text-slate-400 text-xs mb-2 block font-medium">Select seats (optional)</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {seatsForCustomer.map(s => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                    <input type="checkbox" checked={form.user_links.includes(s.id)}
                      onChange={() => f('user_links', form.user_links.includes(s.id) ? form.user_links.filter(x=>x!==s.id) : [...form.user_links, s.id])}
                      className="w-4 h-4 rounded accent-[#f97316]" />
                    <span className="text-slate-300 text-sm flex-1">{s.mongo_user_name}</span>
                    <span className="text-[#f97316] text-sm">{s.currency} {parseFloat(s.monthly_price||0).toLocaleString()}/mo</span>
                  </label>
                ))}
              </div>
            </div>
          )}
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
            <input value={form.transaction_ref} onChange={e => f('transaction_ref', e.target.value)} placeholder="Bank TXN ID…" className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Screenshot</label>
            {screenshot ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f97316]/10 border border-orange-500/20">
                <span className="text-slate-300 text-sm flex-1 truncate">{screenshot.name}</span>
                <button onClick={() => setScreenshot(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4" /></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-orange-500/40 text-sm">
                <HiOutlinePhotograph className="w-5 h-5" /> Upload screenshot
                <input type="file" accept="image/*" className="hidden" onChange={e => setScreenshot(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Submit Dialer Payment Modal ───────────────────────────────────────────────
function SubmitDialerClaimModal({ dialerSubs, customers, isCustomer, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer: '', claimed_amount: '', currency: 'PKR',
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().slice(0,10),
    transaction_ref: '', customer_notes: '', dialer_subscriptions: [],
  })
  const [screenshot, setScreenshot] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const subsForCustomer = isCustomer ? dialerSubs : dialerSubs.filter(s => !form.customer || String(s.customer) === String(form.customer))
  const totalSelected = subsForCustomer.filter(s => form.dialer_subscriptions.includes(s.id))
    .reduce((sum, s) => sum + parseFloat(s.net_price || 0), 0)

  const save = async () => {
    if (!isCustomer && !form.customer) return toast.error('Select a customer')
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
      toast.success('Dialer payment submitted'); onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">Submit Dialer Payment</h3>
            <p className="text-slate-500 text-xs mt-0.5">Payment for Google Voice, Ring Central, etc.</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!isCustomer && (
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Customer *</label>
              <select value={form.customer} onChange={e => f('customer', e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— Select —</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}</option>)}
              </select>
            </div>
          )}
          {subsForCustomer.length > 0 && (
            <div>
              <label className="text-slate-400 text-xs mb-2 block font-medium">Select dialer seats</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {subsForCustomer.map(s => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                    <input type="checkbox" checked={form.dialer_subscriptions.includes(s.id)}
                      onChange={() => f('dialer_subscriptions', form.dialer_subscriptions.includes(s.id) ? form.dialer_subscriptions.filter(x=>x!==s.id) : [...form.dialer_subscriptions, s.id])}
                      className="w-4 h-4 rounded accent-[#f97316]" />
                    <span className="text-slate-300 text-sm flex-1">{s.domain_email}</span>
                    <span className={'text-xs px-1.5 py-0.5 rounded ' + (s.expiry_status === 'expired' ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-400')}>{s.expiry_status?.replace(/_/g,' ')}</span>
                    <span className="text-emerald-400 text-sm">{s.currency} {parseFloat(s.net_price||0).toLocaleString()}/mo</span>
                  </label>
                ))}
              </div>
              {totalSelected > 0 && (
                <div className="text-right text-[#f97316] text-sm mt-1">Total: {form.currency} {totalSelected.toLocaleString()}</div>
              )}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 text-xs mb-1 block font-medium">Amount *</label>
              <input type="number" value={form.claimed_amount} onChange={e => f('claimed_amount', e.target.value)}
                placeholder={totalSelected > 0 ? String(totalSelected) : ''} className={inp} />
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
            <input value={form.transaction_ref} onChange={e => f('transaction_ref', e.target.value)} placeholder="TXN ID…" className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Screenshot</label>
            {screenshot ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f97316]/10 border border-orange-500/20">
                <span className="text-slate-300 text-sm flex-1 truncate">{screenshot.name}</span>
                <button onClick={() => setScreenshot(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4" /></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-orange-500/40 text-sm">
                <HiOutlinePhotograph className="w-5 h-5" /> Upload screenshot
                <input type="file" accept="image/*" className="hidden" onChange={e => setScreenshot(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({ claim, type, onClose, onSaved }) {
  const [form, setForm] = useState({ approved_amount: claim.claimed_amount || '', approval_notes: '', sets_expiry_date: '', sets_next_due_date: '' })
  const [saving, setSaving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const endpoint = type === 'dialer' ? '/store/dialer-payment-claims/' : '/store/payment-claims/'

  const approve = async () => {
    setSaving(true)
    try {
      const payload = {
        approved_amount: form.approved_amount,
        approval_notes: form.approval_notes,
      }
      if (type === 'dialer' && form.sets_next_due_date) payload.sets_next_due_date = form.sets_next_due_date
      if (type !== 'dialer' && form.sets_expiry_date) payload.sets_expiry_date = form.sets_expiry_date
      if (type !== 'dialer' && form.sets_reminder_date) payload.sets_reminder_date = form.sets_reminder_date
      await api.post(endpoint + claim.id + '/approve/', payload)
      toast.success('Payment approved'); onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const reject = async () => {
    if (!form.approval_notes.trim()) return toast.error('Reason required')
    setRejecting(true)
    try {
      await api.post(endpoint + claim.id + '/reject/', { reason: form.approval_notes })
      toast.success('Claim rejected'); onSaved(); onClose()
    } catch { toast.error('Failed') }
    finally { setRejecting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-lg" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">Review {type === 'dialer' ? 'Dialer' : 'DAT'} Payment</h3>
            <p className="text-slate-500 text-xs">#{claim.claim_id_short} · {claim.customer_name}</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(75,191,191,0.05)', border: '1px solid rgba(75,191,191,0.12)' }}>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Claimed</span><span className="text-white font-bold">{claim.currency} {parseFloat(claim.claimed_amount).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Date</span><span className="text-slate-300">{claim.payment_date}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-400">Method</span><span className="text-slate-300 capitalize">{claim.payment_method?.replace(/_/g,' ')}</span></div>
            {claim.transaction_ref && <div className="flex justify-between text-sm"><span className="text-slate-400">TXN Ref</span><span className="text-slate-300 font-mono">{claim.transaction_ref}</span></div>}
            {claim.payment_screenshot && <a href={claim.payment_screenshot} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#f97316] text-sm hover:underline"><HiOutlinePhotograph className="w-4 h-4" /> View Screenshot</a>}
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Approved Amount</label>
            <input type="number" value={form.approved_amount} onChange={e => f('approved_amount', e.target.value)} className={inp} />
          </div>
          {type === 'dialer' ? (
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Set Next Due Date <span className="text-slate-600">(optional)</span></label>
              <input type="date" value={form.sets_next_due_date} onChange={e => f('sets_next_due_date', e.target.value)} className={inp} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Set Expiry Date <span className="text-slate-600">(optional)</span></label>
                <input type="date" value={form.sets_expiry_date} onChange={e => f('sets_expiry_date', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Reminder Date <span className="text-slate-600">(optional)</span></label>
                <input type="date" value={form.sets_reminder_date} onChange={e => f('sets_reminder_date', e.target.value)} className={inp} />
              </div>
            </div>
          )}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Notes (required for rejection)</label>
            <textarea value={form.approval_notes} onChange={e => f('approval_notes', e.target.value)} rows={2} className={inp} />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={reject} disabled={rejecting} className="px-4 py-2.5 rounded-xl text-red-400 text-sm font-medium border border-red-500/20 hover:bg-red-500/10">
            {rejecting ? 'Rejecting…' : 'Reject'}
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={approve} disabled={saving} className="px-6 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Claims List ───────────────────────────────────────────────────────────────
function ClaimsList({ claims, type, canApprove, onApprove, loading }) {
  const [search, setSearch] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filtered = claims.filter(c => {
    if (search && !c.customer_name?.toLowerCase().includes(search.toLowerCase()) &&
        !c.claim_id_short?.toLowerCase().includes(search.toLowerCase()) &&
        !c.transaction_ref?.toLowerCase().includes(search.toLowerCase())) return false
    if (minAmount && parseFloat(c.claimed_amount) < parseFloat(minAmount)) return false
    if (maxAmount && parseFloat(c.claimed_amount) > parseFloat(maxAmount)) return false
    if (fromDate && c.payment_date < fromDate) return false
    if (toDate && c.payment_date > toDate) return false
    return true
  })

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search claim ID, customer, TXN ref…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="Min amount"
            className="flex-1 min-w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50" />
          <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="Max amount"
            className="flex-1 min-w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50" />
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="flex-1 min-w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50" />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="flex-1 min-w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50" />
          {(search||minAmount||maxAmount||fromDate||toDate) && (
            <button onClick={()=>{setSearch('');setMinAmount('');setMaxAmount('');setFromDate('');setToDate('')}}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 border border-white/10 hover:text-white">Clear</button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">No {type === 'dialer' ? 'dialer' : 'DAT'} payment claims</div>
      ) : filtered.map(c => (
        <div key={c.id} className="glass-light rounded-2xl p-4"
          style={{ border: '1px solid ' + (c.status === 'pending' ? 'rgba(234,179,8,0.2)' : c.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)') }}>
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-mono text-xs text-slate-500">#{c.claim_id_short}</span>
                <span className="text-white font-semibold">{c.customer_name}</span>
                <span className={'px-2 py-0.5 rounded-full text-xs ' + (STATUS_COLORS[c.status] || '')}>{c.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><div className="text-slate-500 text-xs">Claimed</div><div className="text-[#f97316] font-bold">{c.currency} {parseFloat(c.claimed_amount).toLocaleString()}</div></div>
                {c.approved_amount && <div><div className="text-slate-500 text-xs">Approved</div><div className="text-emerald-400 font-bold">{c.currency} {parseFloat(c.approved_amount).toLocaleString()}</div></div>}
                <div><div className="text-slate-500 text-xs">Date</div><div className="text-slate-300">{c.payment_date}</div></div>
              </div>
              {c.transaction_ref && <div className="text-slate-500 text-xs mt-1">Ref: <span className="font-mono text-slate-400">{c.transaction_ref}</span></div>}
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {c.payment_screenshot && <a href={c.payment_screenshot} target="_blank" rel="noreferrer" className="text-[#f97316] text-xs hover:underline flex items-center gap-1"><HiOutlinePhotograph className="w-3.5 h-3.5" /> Screenshot</a>}
              {canApprove && c.status === 'pending' && (
                <button onClick={() => onApprove(c)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(75,191,191,0.15)', color: '#f97316', border: '1px solid rgba(75,191,191,0.2)' }}>
                  <HiOutlinePencil className="w-3 h-3" /> Review
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentClaimsPage({ user }) {
  const location = useLocation()
  const urlType = new URLSearchParams(location.search).get('type')
  const [datClaims, setDatClaims] = useState([])
  const [dialerClaims, setDialerClaims] = useState([])
  const [customers, setCustomers] = useState([])
  const [datSeats, setDatSeats] = useState([])
  const [dialerSubs, setDialerSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState(urlType === 'dialer' ? 'dialer' : 'dat')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [submitDATModal, setSubmitDATModal] = useState(false)
  const [submitDialerModal, setSubmitDialerModal] = useState(false)
  const [approveModal, setApproveModal] = useState(null)
  const [approveType, setApproveType] = useState('dat')
  const [statusFilter, setStatusFilter] = useState('')

  const isCustomer = user?.role === 'customer'
  const canApprove = ['admin','sales','accountant'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const calls = [
        api.get('/store/payment-claims/?page_size=200' + (statusFilter ? '&status=' + statusFilter : '')),
        api.get('/store/dialer-payment-claims/?page_size=200' + (statusFilter ? '&status=' + statusFilter : '')),
      ]
      if (!isCustomer) {
        calls.push(api.get('/store/customers/?page_size=200'))
        calls.push(api.get('/store/customer-seats/?page_size=500'))
        calls.push(api.get('/store/dialer-subscriptions/?page_size=500'))
      } else {
        calls.push(api.get('/store/customer-seats/?page_size=500'))
        calls.push(api.get('/store/dialer-subscriptions/?page_size=500'))
      }
      const results = await Promise.all(calls)
      const newDat = Array.isArray(results[0].data) ? results[0].data : results[0].data.results || []
      const newDialer = Array.isArray(results[1].data) ? results[1].data : results[1].data.results || []
      setDatClaims(newDat)
      setDialerClaims(newDialer)
      // Auto-switch: if URL doesn't specify type, switch to dialer if only dialer has pending
      if (!urlType) {
        const datPending = newDat.filter(c => c.status === 'pending').length
        const dialerPending = newDialer.filter(c => c.status === 'pending').length
        if (dialerPending > 0 && datPending === 0) setActiveType('dialer')
        else if (datPending > 0) setActiveType('dat')
      }
      if (!isCustomer) {
        setCustomers(Array.isArray(results[2].data) ? results[2].data : results[2].data.results || [])
        setDatSeats(Array.isArray(results[3].data) ? results[3].data : results[3].data.results || [])
        setDialerSubs(Array.isArray(results[4].data) ? results[4].data : results[4].data.results || [])
      } else {
        setDatSeats(Array.isArray(results[2].data) ? results[2].data : results[2].data.results || [])
        setDialerSubs(Array.isArray(results[3].data) ? results[3].data : results[3].data.results || [])
      }
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [statusFilter, isCustomer])

  useEffect(() => { load() }, [load])

  // Customer list for sidebar (non-customer users)
  const customerList = [...new Set([
    ...datClaims.map(c => ({ id: c.customer, name: c.customer_name })),
    ...dialerClaims.map(c => ({ id: c.customer, name: c.customer_name })),
  ].map(x => JSON.stringify(x)))].map(x => JSON.parse(x))

  const filteredDatClaims = selectedCustomer ? datClaims.filter(c => String(c.customer) === String(selectedCustomer)) : datClaims
  const filteredDialerClaims = selectedCustomer ? dialerClaims.filter(c => String(c.customer) === String(selectedCustomer)) : dialerClaims

  const pendingDat = datClaims.filter(c => c.status === 'pending').length
  const pendingDialer = dialerClaims.filter(c => c.status === 'pending').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">DAT One and Dialer payment claims — separate tracking</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
            <option value="" className="bg-[#0e1420]">All Status</option>
            {['pending','approved','rejected'].map(s => <option key={s} value={s} className="bg-[#0e1420]">{s}</option>)}
          </select>
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white"><HiOutlineRefresh className="w-5 h-5" /></button>
          <button onClick={() => setSubmitDATModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <HiOutlineDatabase className="w-4 h-4" /> DAT Payment
          </button>
          <button onClick={() => setSubmitDialerModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <HiOutlinePhone className="w-4 h-4" /> Dialer Payment
          </button>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <button onClick={() => setActiveType('dat')}
          className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ' + (activeType === 'dat' ? 'text-[#f97316]' : 'text-slate-400 hover:text-white')}
          style={activeType === 'dat' ? { background: 'rgba(75,191,191,0.12)', border: '1px solid rgba(75,191,191,0.2)' } : {}}>
          <HiOutlineDatabase className="w-4 h-4" /> DAT One
          {pendingDat > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400">{pendingDat}</span>}
        </button>
        <button onClick={() => setActiveType('dialer')}
          className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ' + (activeType === 'dialer' ? 'text-purple-400' : 'text-slate-400 hover:text-white')}
          style={activeType === 'dialer' ? { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' } : {}}>
          <HiOutlinePhone className="w-4 h-4" /> Dialers
          {pendingDialer > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400">{pendingDialer}</span>}
        </button>
      </div>

      <div className={'flex gap-5 ' + (isCustomer ? '' : 'lg:flex-row flex-col')}>
        {/* Customer sidebar (staff only) */}
        {!isCustomer && customerList.length > 0 && (
          <div className="lg:w-56 flex-shrink-0">
            <div className="glass-light rounded-2xl p-3" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-2 py-2">Filter by Customer</div>
              <button onClick={() => setSelectedCustomer(null)}
                className={'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm mb-1 ' + (!selectedCustomer ? 'text-[#f97316] bg-[#f97316]/10' : 'text-slate-400 hover:text-white hover:bg-white/5')}>
                All Customers
              </button>
              <div className="space-y-0.5 max-h-72 overflow-y-auto">
                {customerList.map(c => (
                  <button key={c.id} onClick={() => setSelectedCustomer(c.id === selectedCustomer ? null : c.id)}
                    className={'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm ' + (selectedCustomer === c.id ? 'text-[#f97316] bg-[#f97316]/10' : 'text-slate-400 hover:text-white hover:bg-white/5')}>
                    <span className="truncate">{c.name}</span>
                    <HiOutlineChevronRight className="w-3 h-3 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Claims list */}
        <div className="flex-1 min-w-0">
          {activeType === 'dat' ? (
            <ClaimsList claims={filteredDatClaims} type="dat" canApprove={canApprove} loading={loading}
              onApprove={c => { setApproveModal(c); setApproveType('dat') }} />
          ) : (
            <ClaimsList claims={filteredDialerClaims} type="dialer" canApprove={canApprove} loading={loading}
              onApprove={c => { setApproveModal(c); setApproveType('dialer') }} />
          )}
        </div>
      </div>

      {submitDATModal && <SubmitDATClaimModal seats={datSeats} customers={customers} isCustomer={isCustomer} onClose={() => setSubmitDATModal(false)} onSaved={load} />}
      {submitDialerModal && <SubmitDialerClaimModal dialerSubs={dialerSubs} customers={customers} isCustomer={isCustomer} onClose={() => setSubmitDialerModal(false)} onSaved={load} />}
      {approveModal && <ApproveModal claim={approveModal} type={approveType} onClose={() => setApproveModal(null)} onSaved={load} />}
    </div>
  )
}
