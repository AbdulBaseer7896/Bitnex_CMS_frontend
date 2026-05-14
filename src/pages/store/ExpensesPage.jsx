import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlineX, HiOutlineRefresh, HiOutlineSearch,
  HiOutlinePencil, HiOutlineReceiptTax, HiOutlineDatabase, HiOutlinePhone,
} from 'react-icons/hi'

const TEAL = '#f97316'
const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50'

const EXPIRY_COLORS = {
  expired: 'bg-red-500/15 text-red-400',
  expiring_soon: 'bg-orange-500/15 text-orange-400',
  expiring_month: 'bg-yellow-500/15 text-yellow-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  no_expiry: 'bg-slate-500/15 text-slate-400',
}
const DAT_EXPENSE_TYPES = [
  ['account_purchase','Account Purchase'],['proxy_renewal','Proxy Renewal'],
  ['proxy_purchase','Proxy Purchase'],['subscription_renewal','Subscription Renewal'],['other','Other'],
]
const DIALER_EXPENSE_TYPES = [
  ['account_purchase','Account Purchase'],['subscription_renewal','Subscription Renewal'],
  ['number_purchase','Number Purchase'],['upgrade','Upgrade'],['other','Other'],
]
const DIALER_TYPES = [
  ['google_voice','Google Voice'],['ring_central','Ring Central'],['nux_call','NuxCall'],
  ['vonage','Vonage'],['mighty_call','Mighty Call'],['twilio','Twilio'],['other','Other'],
]
const DIALER_BADGES = {
  google_voice:'bg-blue-500/15 text-blue-400', ring_central:'bg-orange-500/15 text-orange-400',
  nux_call:'bg-[#f97316]/15 text-[#f97316]', vonage:'bg-red-500/15 text-red-400',
  mighty_call:'bg-purple-500/15 text-purple-400', twilio:'bg-pink-500/15 text-pink-400',
  other:'bg-slate-500/15 text-slate-400',
}

// ── DAT Expense Modal ─────────────────────────────────────────────────────────
function DATExpenseModal({ expense, accounts, onClose, onSaved }) {
  const isEdit = !!expense?.id
  const EMPTY = { dat_account:'', expense_type:'subscription_renewal', description:'', amount:'', currency:'PKR', expense_date:new Date().toISOString().slice(0,10), expiry_date:'', reminder_date:'', notes:'' }
  const [form, setForm] = useState(() => isEdit ? {...EMPTY,...expense, dat_account:expense.dat_account??''} : {...EMPTY})
  const [receipt, setReceipt] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const save = async () => {
    if (!form.description || !form.amount || !form.expense_date) return toast.error('Description, amount and date required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => { if (v !== '' && v !== null) fd.append(k, v) })
      if (receipt) fd.append('receipt', receipt)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) { await api.patch(`/store/dat-expenses/${expense.id}/`, fd, cfg); toast.success('Updated') }
      else { await api.post('/store/dat-expenses/', fd, cfg); toast.success('DAT expense recorded') }
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail||'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ border:'1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">{isEdit?'Edit':'Add'} DAT One Expense</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400"/></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">DAT Account (optional)</label>
            <select value={form.dat_account} onChange={e=>f('dat_account',e.target.value)} className={inp}>
              <option value="" className="bg-[#0e1420]">— General / Not linked —</option>
              {accounts.map(a=><option key={a.id} value={a.id} className="bg-[#0e1420]">{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Expense Type</label>
            <select value={form.expense_type} onChange={e=>f('expense_type',e.target.value)} className={inp}>
              {DAT_EXPENSE_TYPES.map(([v,l])=><option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Description *</label>
            <input value={form.description} onChange={e=>f('description',e.target.value)} placeholder="e.g. Dream DAT subscription renewal" className={inp}/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className="text-slate-400 text-xs mb-1 block font-medium">Amount *</label><input type="number" value={form.amount} onChange={e=>f('amount',e.target.value)} className={inp}/></div>
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label><select value={form.currency} onChange={e=>f('currency',e.target.value)} className={inp}>{['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['expense_date','Date *'],['expiry_date','Expiry'],['reminder_date','Reminder']].map(([k,l])=>(
              <div key={k}><label className="text-slate-400 text-xs mb-1 block font-medium">{l}</label><input type="date" value={form[k]} onChange={e=>f(k,e.target.value)} className={inp}/></div>
            ))}
          </div>
          <div><label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label><textarea value={form.notes} onChange={e=>f('notes',e.target.value)} rows={2} className={inp}/></div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Receipt</label>
            {receipt ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f97316]/10 border border-orange-500/20">
                <span className="text-slate-300 text-sm flex-1 truncate">{receipt.name}</span>
                <button onClick={()=>setReceipt(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-orange-500/40 text-sm">
                <HiOutlineReceiptTax className="w-5 h-5"/> Upload receipt
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>setReceipt(e.target.files[0])}/>
              </label>
            )}
            {isEdit && expense.receipt && !receipt && <a href={expense.receipt} target="_blank" rel="noreferrer" className="text-[#f97316] text-xs mt-1 hover:underline block">View current receipt</a>}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>
            {saving?'Saving…':(isEdit?'Update':'Record')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Dialer Expense Modal ──────────────────────────────────────────────────────
function DialerExpenseModal({ expense, onClose, onSaved }) {
  const isEdit = !!expense?.id
  const EMPTY = { dialer_type:'google_voice', dialer_account_email:'', expense_type:'subscription_renewal', description:'', amount:'', currency:'PKR', expense_date:new Date().toISOString().slice(0,10), expiry_date:'', reminder_date:'', seats_count:1, notes:'' }
  const [form, setForm] = useState(isEdit ? {...EMPTY,...expense} : EMPTY)
  const [receipt, setReceipt] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const save = async () => {
    if (!form.description || !form.amount || !form.expense_date) return toast.error('Description, amount and date required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => { if (v !== '' && v !== null) fd.append(k, v) })
      if (receipt) fd.append('receipt', receipt)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) { await api.patch(`/store/dialer-expenses/${expense.id}/`, fd, cfg); toast.success('Updated') }
      else { await api.post('/store/dialer-expenses/', fd, cfg); toast.success('Dialer expense recorded') }
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail||'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ border:'1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">{isEdit?'Edit':'Add'} Dialer Expense</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400"/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Dialer Type *</label><select value={form.dialer_type} onChange={e=>f('dialer_type',e.target.value)} className={inp}>{DIALER_TYPES.map(([v,l])=><option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}</select></div>
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Expense Type</label><select value={form.expense_type} onChange={e=>f('expense_type',e.target.value)} className={inp}>{DIALER_EXPENSE_TYPES.map(([v,l])=><option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}</select></div>
          </div>
          <div><label className="text-slate-400 text-xs mb-1 block font-medium">Account Email</label><input type="email" value={form.dialer_account_email} onChange={e=>f('dialer_account_email',e.target.value)} placeholder="account@gmail.com" className={inp}/></div>
          <div><label className="text-slate-400 text-xs mb-1 block font-medium">Description *</label><input value={form.description} onChange={e=>f('description',e.target.value)} placeholder="e.g. Google Voice 10 numbers — May 2026" className={inp}/></div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2"><label className="text-slate-400 text-xs mb-1 block font-medium">Amount *</label><input type="number" value={form.amount} onChange={e=>f('amount',e.target.value)} className={inp}/></div>
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label><select value={form.currency} onChange={e=>f('currency',e.target.value)} className={inp}>{['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}</select></div>
            <div><label className="text-slate-400 text-xs mb-1 block font-medium">Seats</label><input type="number" value={form.seats_count} min="1" onChange={e=>f('seats_count',e.target.value)} className={inp}/></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['expense_date','Date *'],['expiry_date','Expiry'],['reminder_date','Reminder']].map(([k,l])=>(
              <div key={k}><label className="text-slate-400 text-xs mb-1 block font-medium">{l}</label><input type="date" value={form[k]} onChange={e=>f(k,e.target.value)} className={inp}/></div>
            ))}
          </div>
          <div><label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label><textarea value={form.notes} onChange={e=>f('notes',e.target.value)} rows={2} className={inp}/></div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Receipt</label>
            {receipt ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f97316]/10 border border-orange-500/20">
                <span className="text-slate-300 text-sm flex-1 truncate">{receipt.name}</span>
                <button onClick={()=>setReceipt(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-orange-500/40 text-sm">
                <HiOutlineReceiptTax className="w-5 h-5"/> Upload receipt
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>setReceipt(e.target.files[0])}/>
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>
            {saving?'Saving…':(isEdit?'Update':'Record')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Expense row component ─────────────────────────────────────────────────────
function ExpenseRow({ e, type, onEdit }) {
  return (
    <div className="glass-light rounded-2xl p-4 flex items-start gap-4"
      style={{ border: '1px solid ' + (e.expiry_status==='expired'?'rgba(239,68,68,0.2)':e.expiry_status==='expiring_soon'?'rgba(249,115,22,0.2)':'rgba(75,191,191,0.08)') }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          {type === 'dialer' && (
            <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (DIALER_BADGES[e.dialer_type]||'')}>
              {DIALER_TYPES.find(([v])=>v===e.dialer_type)?.[1]||e.dialer_type}
            </span>
          )}
          {type === 'dat' && e.dat_account_name && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#f97316]/10 text-[#f97316]">{e.dat_account_name}</span>
          )}
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-slate-400">
            {(type==='dat'?DAT_EXPENSE_TYPES:DIALER_EXPENSE_TYPES).find(([v])=>v===e.expense_type)?.[1]||e.expense_type}
          </span>
          {e.expiry_status && e.expiry_status !== 'no_expiry' && (
            <span className={'px-2 py-0.5 rounded-full text-xs '+(EXPIRY_COLORS[e.expiry_status]||'')}>{e.expiry_status.replace(/_/g,' ')}</span>
          )}
        </div>
        <div className="text-white font-semibold text-sm mb-1">{e.description}</div>
        {e.dialer_account_email && <div className="text-slate-500 text-xs mb-2">{e.dialer_account_email}</div>}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          <div><div className="text-slate-500 text-xs">Amount</div><div className="text-emerald-400 font-bold">{e.currency} {parseFloat(e.amount).toLocaleString()}</div></div>
          {e.seats_count > 1 && <div><div className="text-slate-500 text-xs">Seats</div><div className="text-white">{e.seats_count}</div></div>}
          <div><div className="text-slate-500 text-xs">Date</div><div className="text-slate-300 text-xs">{e.expense_date}</div></div>
          <div><div className="text-slate-500 text-xs">Expiry</div><div className={'text-xs '+(e.expiry_status==='expired'?'text-red-400':'text-slate-300')}>{e.expiry_date||'—'}</div></div>
        </div>
        {e.notes && <div className="text-slate-600 text-xs mt-2 italic">{e.notes}</div>}
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        {e.receipt && <a href={e.receipt} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#f97316] text-xs hover:underline"><HiOutlineReceiptTax className="w-3.5 h-3.5"/> Receipt</a>}
        <button onClick={()=>onEdit(e)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white"><HiOutlinePencil className="w-4 h-4"/></button>
      </div>
    </div>
  )
}

// ── Page size selector ────────────────────────────────────────────────────────
function PageSizeSelect({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500">Show</span>
      <select value={value} onChange={e=>onChange(Number(e.target.value))}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm">
        {[10,15,25,50].map(n=><option key={n} value={n} className="bg-[#0e1420]">{n}</option>)}
      </select>
      <span className="text-slate-500">per page</span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [tab, setTab] = useState('dat')
  const [datExpenses, setDatExpenses] = useState([])
  const [dialerExpenses, setDialerExpenses] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // {type:'dat'|'dialer', data:null|obj}
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [datRes, dialerRes, accRes] = await Promise.all([
        api.get('/store/dat-expenses/?page_size=500' + (typeFilter&&tab==='dat'?'&expense_type='+typeFilter:'')),
        api.get('/store/dialer-expenses/?page_size=500' + (typeFilter&&tab==='dialer'?'&expense_type='+typeFilter:'')),
        api.get('/store/dat-accounts/?page_size=100'),
      ])
      setDatExpenses(Array.isArray(datRes.data)?datRes.data:datRes.data.results||[])
      setDialerExpenses(Array.isArray(dialerRes.data)?dialerRes.data:dialerRes.data.results||[])
      setAccounts(Array.isArray(accRes.data)?accRes.data:accRes.data.results||[])
      setPage(1)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [typeFilter, tab])

  useEffect(() => { load() }, [load])

  const activeList = tab === 'dat' ? datExpenses : dialerExpenses
  const filtered = activeList.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return e.description?.toLowerCase().includes(q) ||
      e.dat_account_name?.toLowerCase().includes(q) ||
      e.dialer_account_email?.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q)
  })
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page-1)*pageSize, page*pageSize)

  const datTotal = datExpenses.reduce((s,e)=>s+parseFloat(e.amount||0),0)
  const dialerTotal = dialerExpenses.reduce((s,e)=>s+parseFloat(e.amount||0),0)
  const datExpiring = datExpenses.filter(e=>e.expiry_status==='expired'||e.expiry_status==='expiring_soon').length
  const dialerExpiring = dialerExpenses.filter(e=>e.expiry_status==='expired'||e.expiry_status==='expiring_soon').length

  const changePageSize = (n) => { setPageSize(n); setPage(1) }
  const changeTab = (t) => { setTab(t); setPage(1); setSearch(''); setTypeFilter('') }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">Company costs — DAT One accounts and Dialer services</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white"><HiOutlineRefresh className="w-5 h-5"/></button>
          <button onClick={()=>setModal({type:tab,data:null})}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>
            <HiOutlinePlus className="w-4 h-4"/> Record {tab==='dat'?'DAT':'Dialer'} Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-light rounded-2xl p-4" style={{border:'1px solid rgba(75,191,191,0.12)'}}>
          <div className="text-xl font-bold text-[#f97316]">PKR {datTotal.toLocaleString()}</div>
          <div className="text-white text-xs font-medium mt-0.5">DAT One Total</div>
          <div className="text-slate-500 text-xs">{datExpenses.length} records</div>
        </div>
        <div className="glass-light rounded-2xl p-4" style={{border:'1px solid rgba(139,92,246,0.15)'}}>
          <div className="text-xl font-bold text-purple-400">PKR {dialerTotal.toLocaleString()}</div>
          <div className="text-white text-xs font-medium mt-0.5">Dialer Total</div>
          <div className="text-slate-500 text-xs">{dialerExpenses.length} records</div>
        </div>
        <div className="glass-light rounded-2xl p-4" style={{border:'1px solid rgba(75,191,191,0.1)'}}>
          <div className="text-xl font-bold text-white">PKR {(datTotal+dialerTotal).toLocaleString()}</div>
          <div className="text-white text-xs font-medium mt-0.5">Grand Total</div>
          <div className="text-slate-500 text-xs">{datExpenses.length+dialerExpenses.length} records</div>
        </div>
        {(datExpiring+dialerExpiring)>0 && (
          <div className="glass-light rounded-2xl p-4" style={{border:'1px solid rgba(239,68,68,0.2)'}}>
            <div className="text-xl font-bold text-red-400">{datExpiring+dialerExpiring}</div>
            <div className="text-white text-xs font-medium mt-0.5">Expiring / Expired</div>
            <div className="text-slate-500 text-xs">DAT: {datExpiring} · Dialers: {dialerExpiring}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)'}}>
        <button onClick={()=>changeTab('dat')}
          className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 '+(tab==='dat'?'text-[#f97316]':'text-slate-400 hover:text-white')}
          style={tab==='dat'?{background:'rgba(75,191,191,0.12)',border:'1px solid rgba(75,191,191,0.2)'}:{}}>
          <HiOutlineDatabase className="w-4 h-4"/> DAT One Expenses
          <span className="text-[10px] opacity-70">({datExpenses.length})</span>
        </button>
        <button onClick={()=>changeTab('dialer')}
          className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 '+(tab==='dialer'?'text-purple-400':'text-slate-400 hover:text-white')}
          style={tab==='dialer'?{background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.2)'}:{}}>
          <HiOutlinePhone className="w-4 h-4"/> Dialer Expenses
          <span className="text-[10px] opacity-70">({dialerExpenses.length})</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search description, email, notes…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"/>
        </div>
        <select value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1)}}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
          <option value="" className="bg-[#0e1420]">All Types</option>
          {(tab==='dat'?DAT_EXPENSE_TYPES:DIALER_EXPENSE_TYPES).map(([v,l])=><option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
        </select>
        {tab==='dialer' && (
          <select onChange={e=>setSearch(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
            <option value="" className="bg-[#0e1420]">All Dialers</option>
            {DIALER_TYPES.map(([v,l])=><option key={v} value={l} className="bg-[#0e1420]">{l}</option>)}
          </select>
        )}
        <PageSizeSelect value={pageSize} onChange={changePageSize}/>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{borderColor:'rgba(75,191,191,0.2)',borderTopColor:TEAL}}/></div>
      ) : (
        <>
          {paged.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No expenses found.</div>
          ) : (
            <div className="space-y-3">
              {paged.map(e=>(
                <ExpenseRow key={e.id} e={e} type={tab} onEdit={data=>setModal({type:tab,data})}/>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 text-sm">{filtered.length} total · page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">← Prev</button>
                {Array.from({length:Math.min(totalPages,5)},(_,i)=>{
                  const pg=totalPages<=5?i+1:page<=3?i+1:page>=totalPages-2?totalPages-4+i:page-2+i
                  return <button key={pg} onClick={()=>setPage(pg)} className={'px-3 py-1.5 rounded-lg text-sm '+(pg===page?'text-[#f97316] border border-orange-500/30':'border border-white/10 text-slate-400 hover:bg-white/5')}>{pg}</button>
                })}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {modal?.type==='dat' && <DATExpenseModal expense={modal.data} accounts={accounts} onClose={()=>setModal(null)} onSaved={load}/>}
      {modal?.type==='dialer' && <DialerExpenseModal expense={modal.data} onClose={()=>setModal(null)} onSaved={load}/>}
    </div>
  )
}
