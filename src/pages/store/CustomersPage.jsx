import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineSearch, HiOutlineMail, HiOutlinePhone, HiOutlineLockClosed,
  HiOutlineKey, HiOutlineCheck, HiOutlineUser, HiOutlineDatabase,
  HiOutlineCurrencyDollar, HiOutlineCalendar, HiOutlineSwitchHorizontal,
  HiOutlineTrash, HiOutlineChevronRight, HiOutlineClock, HiOutlineExclamation,
  HiOutlineBan, HiOutlineCheckCircle,
} from 'react-icons/hi'

const TEAL = '#f97316'
const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50'

const EXPIRY_COLORS = {
  expired:       'text-red-400 bg-red-500/15 border-red-500/20',
  expiring_soon: 'text-orange-400 bg-orange-500/15 border-orange-500/20',
  expiring_month:'text-yellow-400 bg-yellow-500/15 border-yellow-500/20',
  active:        'text-emerald-400 bg-emerald-500/15 border-emerald-500/20',
  no_expiry:     'text-slate-400 bg-slate-500/15 border-slate-500/20',
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer form modal (add / edit)
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_CUSTOMER = {
  contact_person: '', email: '', phone: '', company_name: '',
  address: '', country: 'Pakistan', notes: '', assigned_sales: '',
  create_login: false, username: '', password: '',
}

function CustomerModal({ customer, salesUsers, onClose, onSaved }) {
  const isEdit = !!customer?.id
  const [form, setForm] = useState(() => customer
    ? { ...EMPTY_CUSTOMER, ...customer, assigned_sales: customer.assigned_sales ?? '', create_login: false, username: '', password: '' }
    : { ...EMPTY_CUSTOMER })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.contact_person.trim() || !form.email.trim()) return toast.error('Name and email required')
    if (!isEdit && form.create_login && (!form.username || !form.password)) return toast.error('Username and password required')
    setSaving(true)
    try {
      const payload = { ...form, assigned_sales: form.assigned_sales || null }
      if (isEdit) await api.patch(`/store/customers/${customer.id}/`, payload)
      else await api.post('/store/customers/', payload)
      toast.success(isEdit ? 'Customer updated' : 'Customer added')
      onSaved(); onClose()
    } catch (e) {
      const err = e.response?.data
      toast.error(err?.email?.[0] || err?.username?.[0] || err?.detail || 'Failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{isEdit ? 'Update customer details' : 'Add a customer and optionally create portal login'}</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[['contact_person','Contact Person *'],['company_name','Company Name'],['email','Email *'],['phone','Phone']].map(([k,l]) => (
              <div key={k}>
                <label className="text-slate-400 text-xs mb-1 block font-medium">{l}</label>
                <input type={k==='email'?'email':'text'} value={form[k]} onChange={e=>f(k,e.target.value)} className={inp} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Country</label>
              <input value={form.country} onChange={e=>f('country',e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Assigned Sales Rep</label>
              <select value={form.assigned_sales} onChange={e=>f('assigned_sales',e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— None —</option>
                {salesUsers.map(s=><option key={s.id} value={s.id} className="bg-[#0e1420]">{s.first_name} {s.last_name} ({s.username})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Address</label>
            <textarea rows={2} value={form.address} onChange={e=>f('address',e.target.value)} className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e=>f('notes',e.target.value)} className={inp} />
          </div>
          {!isEdit && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <div onClick={()=>f('create_login',!form.create_login)}
                  className={'w-10 h-5 rounded-full relative transition-colors '+(form.create_login?'bg-[#f97316]':'bg-white/10')}>
                  <div className={'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all '+(form.create_login?'left-5':'left-0.5')}/>
                </div>
                <span className="text-slate-300 text-sm font-medium">Create Portal Login Account</span>
              </label>
              {form.create_login && (
                <div className="grid grid-cols-2 gap-3 pl-12">
                  {[['username','Username'],['password','Password']].map(([k,l])=>(
                    <div key={k}>
                      <label className="text-slate-400 text-xs mb-1 block">{l}</label>
                      <input type={k==='password'?'password':'text'} value={form[k]} onChange={e=>f(k,e.target.value)} className={inp} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset Password modal
// ─────────────────────────────────────────────────────────────────────────────
function ResetPasswordModal({ customer, onClose }) {
  const [pw, setPw] = useState('')
  const [saving, setSaving] = useState(false)
  const reset = async () => {
    if (pw.length < 6) return toast.error('Min 6 characters')
    setSaving(true)
    try {
      await api.post(`/store/customers/${customer.id}/reset_password/`, { password: pw })
      toast.success('Password reset'); onClose()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-light rounded-2xl w-full max-w-sm" style={{ border: '1px solid rgba(249,115,22,0.3)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-bold">Reset Password</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-slate-400 text-sm">Reset portal password for <span className="text-white font-medium">{customer.contact_person}</span></div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="New password (min 6 chars)" className={inp} />
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={reset} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: 'rgba(249,115,22,0.3)', border: '1px solid rgba(249,115,22,0.5)' }}>
            {saving ? 'Resetting…' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Seat modal (pricing + dates + REASSIGN)
// ─────────────────────────────────────────────────────────────────────────────
function EditSeatModal({ seat, customers, onClose, onSaved }) {
  const [mode, setMode] = useState('edit')
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
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const reassign = async () => {
    if (!newCustomer) return toast.error('Select a customer')
    if (newCustomer === String(seat.customer)) return toast.error('Same customer selected')
    setSaving(true)
    try {
      await api.delete('/store/customer-seats/' + seat.id + '/')
      await api.post('/store/customer-seats/', {
        customer: newCustomer, mongo_user: seat.mongo_user,
        monthly_price: parseFloat(newPrice) || 0, currency: form.currency,
        start_date: form.start_date || null, expiry_date: form.expiry_date || null,
        reminder_date: form.reminder_date || null, is_active: form.is_active, notes: form.notes,
      })
      const cname = customers.find(c => String(c.id) === String(newCustomer))?.contact_person || 'new customer'
      toast.success(seat.mongo_user_name + ' reassigned to ' + cname)
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || 'Reassign failed') }
    finally { setSaving(false) }
  }

  const remove = async () => {
    if (!window.confirm(`Remove ${seat.mongo_user_name} from this customer? The user will become unassigned.`)) return
    setSaving(true)
    try {
      await api.delete('/store/customer-seats/' + seat.id + '/')
      toast.success('Seat removed'); onSaved(); onClose()
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-light rounded-2xl w-full max-w-md" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold">{mode === 'edit' ? 'Edit Seat' : mode === 'reassign' ? 'Reassign Seat' : 'Remove Seat'}</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              <span className="text-white">{seat.mongo_user_name}</span>
              <span className="text-slate-600"> · </span>
              <span className="text-[#f97316]">{seat.customer_name}</span>
            </p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 m-4 mb-0 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'edit', label: 'Edit', icon: HiOutlinePencil, active: 'text-[#f97316]', activeBg: 'rgba(75,191,191,0.12)', activeBorder: 'rgba(75,191,191,0.2)' },
            { id: 'reassign', label: 'Reassign', icon: HiOutlineSwitchHorizontal, active: 'text-orange-400', activeBg: 'rgba(249,115,22,0.12)', activeBorder: 'rgba(249,115,22,0.2)' },
            { id: 'remove', label: 'Remove', icon: HiOutlineTrash, active: 'text-red-400', activeBg: 'rgba(239,68,68,0.12)', activeBorder: 'rgba(239,68,68,0.2)' },
          ].map(t => {
            const Icon = t.icon
            const isActive = mode === t.id
            return (
              <button key={t.id} onClick={() => setMode(t.id)}
                className={'flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ' + (isActive ? t.active : 'text-slate-400 hover:text-white')}
                style={isActive ? { background: t.activeBg, border: `1px solid ${t.activeBorder}` } : {}}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            )
          })}
        </div>

        {/* Edit mode */}
        {mode === 'edit' && (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-slate-400 text-xs mb-1 block">Monthly Price</label>
                <input type="number" value={form.monthly_price} onChange={e=>f('monthly_price',e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Currency</label>
                <select value={form.currency} onChange={e=>f('currency',e.target.value)} className={inp}>
                  {['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['start_date','Start'],['expiry_date','Expiry'],['reminder_date','Reminder']].map(([k,l])=>(
                <div key={k}>
                  <label className="text-slate-400 text-xs mb-1 block">{l}</label>
                  <input type="date" value={form[k]} onChange={e=>f(k,e.target.value)} className={inp} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Notes</label>
              <input value={form.notes} onChange={e=>f('notes',e.target.value)} className={inp} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={()=>f('is_active',!form.is_active)} className={'w-10 h-5 rounded-full relative transition-colors '+(form.is_active?'bg-[#f97316]':'bg-white/10')}>
                <div className={'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all '+(form.is_active?'left-5':'left-0.5')}/>
              </div>
              <span className="text-slate-300 text-sm">Active Seat</span>
            </label>
          </div>
        )}

        {/* Reassign mode */}
        {mode === 'reassign' && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <div className="text-orange-300 font-semibold mb-1">Move this seat to a different customer</div>
              <div className="text-slate-400">The current assignment to <span className="text-white font-medium">{seat.customer_name}</span> will be deleted and a new one created. Pricing and dates carry over unless you change them below.</div>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">New Customer *</label>
              <select value={newCustomer} onChange={e=>setNewCustomer(e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— Select Customer —</option>
                {(customers||[]).filter(c=>String(c.id)!==String(seat.customer)).map(c=>(
                  <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}{c.company_name?' ('+c.company_name+')':''}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Monthly Price</label>
                <input type="number" value={newPrice} onChange={e=>setNewPrice(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Currency</label>
                <select value={form.currency} onChange={e=>f('currency',e.target.value)} className={inp}>
                  {['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
                </select>
              </div>
            </div>
            {newCustomer && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(75,191,191,0.08)', border: '1px solid rgba(75,191,191,0.15)' }}>
                <HiOutlineSwitchHorizontal className="w-4 h-4 text-[#f97316] flex-shrink-0" />
                <span className="text-slate-400">
                  <span className="text-white font-medium">{seat.mongo_user_name}</span> will move from{' '}
                  <span className="text-red-400 font-medium">{seat.customer_name}</span> →{' '}
                  <span className="text-[#f97316] font-semibold">{(customers||[]).find(c=>String(c.id)===String(newCustomer))?.contact_person}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Remove mode */}
        {mode === 'remove' && (
          <div className="p-5">
            <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="text-red-300 font-semibold mb-2">Remove this seat assignment</div>
              <div className="text-slate-400 text-sm">
                <span className="text-white font-medium">{seat.mongo_user_name}</span> will be unassigned from <span className="text-white font-medium">{seat.customer_name}</span>. The DAT user will still exist in the system but won't be linked to any customer.
              </div>
              <div className="mt-3 text-slate-500 text-xs">Monthly revenue impact: <span className="text-red-400 font-bold">{seat.currency} {parseFloat(seat.monthly_price||0).toLocaleString()}/mo lost</span></div>
            </div>
          </div>
        )}

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          {mode === 'edit' && (
            <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
          {mode === 'reassign' && (
            <button onClick={reassign} disabled={saving||!newCustomer} className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40" style={{ background: 'rgba(249,115,22,0.3)', border: '1px solid rgba(249,115,22,0.5)' }}>
              {saving ? 'Reassigning…' : 'Confirm Reassign'}
            </button>
          )}
          {mode === 'remove' && (
            <button onClick={remove} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>
              {saving ? 'Removing…' : 'Remove Seat'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign New Seat modal (assign unassigned DAT user to this customer)
// ─────────────────────────────────────────────────────────────────────────────
function AssignSeatModal({ customer, onClose, onSaved }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('PKR')
  const [expiry, setExpiry] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/store/mongo-users/?page_size=500').then(r => {
      const all = Array.isArray(r.data) ? r.data : r.data.results || []
      // Show unassigned users
      setUsers(all.filter(u => u.is_active_in_cms && !u.assigned_to))
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const save = async () => {
    if (!selected) return toast.error('Select a user')
    if (!price) return toast.error('Enter monthly price')
    setSaving(true)
    try {
      await api.post('/store/customer-seats/', {
        customer: customer.id, mongo_user: selected.id,
        monthly_price: parseFloat(price), currency,
        expiry_date: expiry || null,
      })
      toast.success(selected.name + ' assigned to ' + customer.contact_person)
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-light rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-white font-bold">Assign DAT Seat</h3>
            <p className="text-slate-500 text-xs mt-0.5">Assign an unassigned user to <span className="text-[#f97316]">{customer.contact_person}</span></p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search user name or email…" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50" />
          </div>

          {loading ? (
            <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }}/></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No unassigned users available</div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filtered.map(u => (
                <div key={u.id} onClick={() => setSelected(u)}
                  className={'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ' + (selected?.id === u.id ? 'border' : 'border border-transparent hover:bg-white/5')}
                  style={selected?.id === u.id ? { background: 'rgba(75,191,191,0.1)', borderColor: 'rgba(75,191,191,0.3)' } : {}}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0e1420] flex-shrink-0" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                    {(u.name?.[0]||'?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{u.name}</div>
                    <div className="text-slate-500 text-xs truncate">{u.email} · {u.dat_account_name||'No account'}</div>
                  </div>
                  {selected?.id === u.id && <HiOutlineCheck className="w-4 h-4 text-[#f97316] flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="col-span-2">
              <label className="text-slate-400 text-xs mb-1 block font-medium">Monthly Price *</label>
              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 6000" className={inp} />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label>
              <select value={currency} onChange={e=>setCurrency(e.target.value)} className={inp}>
                {['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Expiry Date</label>
            <input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} className={inp} />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving||!selected} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving ? 'Assigning…' : 'Assign Seat'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer detail panel (right side)
// ─────────────────────────────────────────────────────────────────────────────
function CustomerDetail({ customer, canManage, canReset, customers, onEdit, onResetPw, onSeatChange }) {
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [editSeat, setEditSeat] = useState(null)
  const [assignModal, setAssignModal] = useState(false)
  const [seatSearch, setSeatSearch] = useState('')

  const loadSeats = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/store/customer-seats/?customer=${customer.id}&page_size=200`)
      setSeats(Array.isArray(r.data) ? r.data : r.data.results || [])
    } catch {} finally { setLoading(false) }
  }, [customer.id])

  useEffect(() => { loadSeats() }, [loadSeats])

  const handleSeatSaved = () => { loadSeats(); onSeatChange() }

  const totalRevenue = seats.filter(s=>s.is_active).reduce((sum,s)=>sum+parseFloat(s.monthly_price||0), 0)
  const activeSeats  = seats.filter(s=>s.is_active)
  const expiredSeats = seats.filter(s=>s.expiry_status==='expired')
  const filteredSeats = seats.filter(s => !seatSearch ||
    s.mongo_user_name?.toLowerCase().includes(seatSearch.toLowerCase()) ||
    s.mongo_user_email?.toLowerCase().includes(seatSearch.toLowerCase()))

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-5">
      {/* Customer info card */}
      <div className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(75,191,191,0.12)' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg text-[#0e1420]" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {(customer.contact_person?.[0]||'?').toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold">{customer.contact_person}</div>
              {customer.company_name && <div className="text-slate-500 text-xs">{customer.company_name}</div>}
              {!customer.is_active && <span className="text-xs text-red-400">Inactive</span>}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-1.5">
              <button onClick={onEdit} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white" title="Edit customer">
                <HiOutlinePencil className="w-4 h-4" />
              </button>
              {canReset && customer.has_login && (
                <button onClick={onResetPw} className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" title="Reset password">
                  <HiOutlineKey className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 text-xs mb-3">
          <div className="flex items-center gap-2 text-slate-400"><HiOutlineMail className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />{customer.email}</div>
          {customer.phone && <div className="flex items-center gap-2 text-slate-400"><HiOutlinePhone className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />{customer.phone}</div>}
          {customer.has_login && (
            <div className="flex items-center gap-2 text-emerald-400"><HiOutlineLockClosed className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />Portal: @{customer.username}</div>
          )}
          {customer.assigned_sales_name && (
            <div className="flex items-center gap-2 text-slate-400"><HiOutlineUser className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />Sales: {customer.assigned_sales_name}</div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Active Seats', value: activeSeats.length, color: 'text-[#f97316]' },
            { label: 'Monthly Rev', value: `PKR ${totalRevenue.toLocaleString()}`, color: 'text-emerald-400' },
            { label: 'Expired', value: expiredSeats.length, color: expiredSeats.length > 0 ? 'text-red-400' : 'text-slate-500' },
          ].map(s=>(
            <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-[10px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Seats section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <HiOutlineDatabase className="w-4 h-4 text-slate-500" /> DAT Seats ({seats.length})
          </h3>
          {canManage && (
            <button onClick={() => setAssignModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#0e1420]"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <HiOutlinePlus className="w-3.5 h-3.5" /> Assign
            </button>
          )}
        </div>

        {seats.length > 4 && (
          <div className="relative mb-2">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input value={seatSearch} onChange={e=>setSeatSearch(e.target.value)} placeholder="Search seats…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-orange-500/50" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }}/></div>
        ) : filteredSeats.length === 0 ? (
          <div className="text-center py-8 rounded-2xl text-slate-500 text-sm" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            {seats.length === 0 ? 'No seats assigned yet' : 'No seats match search'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSeats.map(s => (
              <div key={s.id} className="glass-light rounded-xl p-3" style={{ border: `1px solid ${s.expiry_status==='expired'?'rgba(239,68,68,0.2)':s.expiry_status==='expiring_soon'?'rgba(249,115,22,0.2)':'rgba(255,255,255,0.06)'}` }}>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0e1420] flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                    {(s.mongo_user_name?.[0]||'?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">{s.mongo_user_name}</span>
                      <span className={'px-1.5 py-0.5 rounded-full text-[10px] border '+( EXPIRY_COLORS[s.expiry_status]||EXPIRY_COLORS.no_expiry)}>
                        {(s.expiry_status||'').replace(/_/g,' ') || 'no expiry'}
                      </span>
                      {!s.is_active && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-500/15 text-slate-500">Blocked</span>}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{s.mongo_user_email}</div>
                    {s.dat_account_name && <div className="text-slate-600 text-xs">{s.dat_account_name}</div>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-emerald-400 font-bold text-xs">{s.currency} {parseFloat(s.monthly_price||0).toLocaleString()}/mo</span>
                      {s.expiry_date && (
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <HiOutlineCalendar className="w-3 h-3" />{s.expiry_date}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <button onClick={() => setEditSeat(s)}
                      className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white flex-shrink-0">
                      <HiOutlinePencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editSeat && (
        <EditSeatModal seat={editSeat} customers={customers} onClose={() => setEditSeat(null)} onSaved={handleSeatSaved} />
      )}
      {assignModal && (
        <AssignSeatModal customer={customer} onClose={() => setAssignModal(false)} onSaved={handleSeatSaved} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page — sidebar + detail panel
// ─────────────────────────────────────────────────────────────────────────────
export default function CustomersPage({ user }) {
  const [customers, setCustomers]   = useState([])
  const [salesUsers, setSalesUsers] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [modal, setModal]           = useState(null)   // null | 'new' | customer obj
  const [resetModal, setResetModal] = useState(null)
  const [summary, setSummary]       = useState(null)

  const canManage = ['admin', 'sales'].includes(user?.role)
  const canReset  = user?.role === 'admin' || (user?.role === 'sales' && user?.is_dept_head)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [custRes, sumRes] = await Promise.all([
        api.get('/store/customers/?page_size=200'),
        api.get('/store/customers/summary/').catch(() => ({ data: null })),
      ])
      const list = Array.isArray(custRes.data) ? custRes.data : custRes.data.results || []
      setCustomers(list)
      setSummary(sumRes.data)
      // Keep selected in sync
      setSelected(prev => prev ? (list.find(c => c.id === prev.id) || null) : null)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    if (canManage) {
      api.get('/users/?role=sales').then(r => setSalesUsers(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => {})
    }
  }, [load, canManage])

  const filtered = customers.filter(c =>
    !search ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCustomer = selected ? customers.find(c => c.id === selected.id) || selected : null

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-500 text-sm">Manage clients · assign DAT seats · track revenue</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <HiOutlinePlus className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b border-white/[0.06] flex-shrink-0">
          {[
            { label: 'Total', value: summary.total, color: 'text-white' },
            { label: 'Active', value: summary.active, color: 'text-emerald-400' },
            { label: 'With Login', value: summary.with_login, color: 'text-[#f97316]' },
            { label: 'Revenue', value: `PKR ${parseFloat(summary.total_revenue||0).toLocaleString()}`, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="glass-light rounded-xl p-3" style={{ border: '1px solid rgba(75,191,191,0.08)' }}>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT SIDEBAR — customer list */}
        <div className="w-72 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && customers.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm px-4">No customers found</div>
            ) : (
              filtered.map(c => {
                const isSelected = selected?.id === c.id
                const hasExpired = (c.active_subscriptions === 0 && c.active_dat_seats === 0)
                return (
                  <div key={c.id} onClick={() => setSelected(c)}
                    className={'flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/[0.04] transition-all ' + (isSelected ? 'bg-[#f97316]/10' : 'hover:bg-white/[0.03]')}
                    style={isSelected ? { borderLeft: '3px solid #f97316' } : { borderLeft: '3px solid transparent' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-[#0e1420] flex-shrink-0"
                      style={{ background: isSelected ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'rgba(75,191,191,0.2)' }}>
                      {(c.contact_person?.[0]||'?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{c.contact_person}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-xs">{c.active_dat_seats || 0} seats</span>
                        {c.has_login && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Has login" />}
                        {!c.is_active && <span className="text-red-400 text-[10px]">Inactive</span>}
                      </div>
                    </div>
                    <HiOutlineChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-[#f97316]' : 'text-slate-600'}`} />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL — customer detail */}
        <div className="flex-1 min-w-0 flex flex-col">
          {!selectedCustomer ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(75,191,191,0.1)', border: '1px solid rgba(75,191,191,0.15)' }}>
                <HiOutlineUser className="w-8 h-8 text-slate-500" />
              </div>
              <div>
                <div className="text-slate-400 font-medium">Select a customer</div>
                <div className="text-slate-600 text-sm mt-1">Click any customer on the left to view their details, seats, and perform actions</div>
              </div>
            </div>
          ) : (
            <CustomerDetail
              key={selectedCustomer.id}
              customer={selectedCustomer}
              canManage={canManage}
              canReset={canReset}
              customers={customers}
              onEdit={() => setModal(selectedCustomer)}
              onResetPw={() => setResetModal(selectedCustomer)}
              onSeatChange={load}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <CustomerModal
          customer={modal === 'new' ? null : modal}
          salesUsers={salesUsers}
          onClose={() => setModal(null)}
          onSaved={() => { load(); if (modal !== 'new') setSelected(modal) }}
        />
      )}
      {resetModal && <ResetPasswordModal customer={resetModal} onClose={() => setResetModal(null)} />}
    </div>
  )
}
