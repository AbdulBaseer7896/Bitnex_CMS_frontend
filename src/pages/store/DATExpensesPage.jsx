import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { HiOutlinePlus, HiOutlineX, HiOutlineRefresh, HiOutlineSearch, HiOutlinePencil } from 'react-icons/hi'

const TEAL = '#f97316'
const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"
const EXPENSE_TYPES = [
  ['account_purchase','Account Purchase'],['proxy_renewal','Proxy Renewal'],
  ['proxy_purchase','Proxy Purchase'],['subscription_renewal','Subscription Renewal'],['other','Other'],
]

const EMPTY = { dat_account:'', expense_type:'subscription_renewal', description:'', amount:'', currency:'PKR', expense_date:new Date().toISOString().slice(0,10), expiry_date:'', reminder_date:'', notes:'' }

function ExpenseModal({ expense, accounts, onClose, onSaved }) {
  const isEdit = !!expense?.id
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
      else { await api.post('/store/dat-expenses/', fd, cfg); toast.success('Expense added') }
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail||'Failed') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ border:'1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">{isEdit?'Edit':'Add'} DAT Expense</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400"/></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">DAT Account</label>
              <select value={form.dat_account} onChange={e=>f('dat_account',e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— General —</option>
                {accounts.map(a=><option key={a.id} value={a.id} className="bg-[#0e1420]">{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Expense Type</label>
              <select value={form.expense_type} onChange={e=>f('expense_type',e.target.value)} className={inp}>
                {EXPENSE_TYPES.map(([v,l])=><option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Description *</label>
            <input value={form.description} onChange={e=>f('description',e.target.value)} placeholder="e.g. DAT One monthly subscription" className={inp}/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 text-xs mb-1 block font-medium">Amount *</label>
              <input type="number" value={form.amount} onChange={e=>f('amount',e.target.value)} className={inp}/>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label>
              <select value={form.currency} onChange={e=>f('currency',e.target.value)} className={inp}>
                {['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['expense_date','Expense Date *'],['expiry_date','Expiry Date'],['reminder_date','Reminder']].map(([k,l])=>(
              <div key={k}>
                <label className="text-slate-400 text-xs mb-1 block">{l}</label>
                <input type="date" value={form[k]} onChange={e=>f(k,e.target.value)} className={inp}/>
              </div>
            ))}
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label>
            <textarea value={form.notes} onChange={e=>f('notes',e.target.value)} rows={2} className={inp}/>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Receipt</label>
            {receipt ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#f97316]/10 text-sm">
                <span className="text-slate-300 flex-1 truncate">{receipt.name}</span>
                <button onClick={()=>setReceipt(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4"/></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-orange-500/40 text-sm">
                Upload receipt (optional)
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>setReceipt(e.target.files[0])}/>
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving?'Saving…':(isEdit?'Update':'Add Expense')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DATExpensesPage({ user }) {
  const [expenses, setExpenses] = useState([])
  const [accounts, setAccounts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [accountFilter, setAccountFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [search, setSearch] = useState('')

  const canManage = user?.role === 'admin' || (user?.role === 'sales' && user?.is_dept_head) || user?.role === 'accountant'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let q = []
      if (accountFilter) q.push(`dat_account=${accountFilter}`)
      if (monthFilter) { const [y,m] = monthFilter.split('-'); q.push(`year=${y}&month=${m}`) }
      const qs = q.length ? `?${q.join('&')}` : ''
      const [expR, accR, sumR] = await Promise.all([
        api.get(`/store/dat-expenses/${qs}`),
        api.get('/store/dat-accounts/'),
        api.get(`/store/dat-expenses/summary/${qs}`).catch(()=>({data:null})),
      ])
      setExpenses(Array.isArray(expR.data) ? expR.data : expR.data.results || [])
      setAccounts(Array.isArray(accR.data) ? accR.data : accR.data.results || [])
      setSummary(sumR.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [accountFilter, monthFilter])

  useEffect(() => { load() }, [load])

  const filtered = expenses.filter(e => !search || e.description?.toLowerCase().includes(search.toLowerCase()) || e.dat_account_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">DAT Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">Track account purchases, proxy renewals and subscription costs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white"><HiOutlineRefresh className="w-5 h-5"/></button>
          {canManage && (
            <button onClick={()=>setModal('new')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm" style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <HiOutlinePlus className="w-4 h-4"/> Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-light rounded-2xl p-4 col-span-2" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
            <div className="text-2xl font-bold text-red-400">PKR {parseFloat(summary.total||0).toLocaleString()}</div>
            <div className="text-slate-500 text-sm">Total Expenses</div>
          </div>
          {(summary.by_type||[]).slice(0,2).map(t => (
            <div key={t.expense_type} className="glass-light rounded-2xl p-4" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
              <div className="text-xl font-bold text-white">PKR {parseFloat(t.total||0).toLocaleString()}</div>
              <div className="text-slate-500 text-xs capitalize">{t.expense_type?.replace(/_/g,' ')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"/>
        </div>
        <select value={accountFilter} onChange={e=>setAccountFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm">
          <option value="" className="bg-[#0e1420]">All Accounts</option>
          {accounts.map(a=><option key={a.id} value={a.id} className="bg-[#0e1420]">{a.name}</option>)}
        </select>
        <input type="month" value={monthFilter} onChange={e=>setMonthFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"/>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(75,191,191,0.2)', borderTopColor:TEAL }}/></div>
      ) : (
        <div className="glass-light rounded-2xl overflow-auto" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
          <table className="w-full">
            <thead><tr className="border-b border-white/10">
              {['Account','Type','Description','Amount','Date','Expiry','Reminder','Added By',''].map(h=>(
                <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-slate-500 py-12">No expenses yet</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-300 text-sm">{e.dat_account_name||'—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 capitalize">{e.expense_type?.replace(/_/g,' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{e.description}</td>
                  <td className="px-4 py-3 text-red-400 font-medium text-sm">{e.currency} {parseFloat(e.amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.expense_date}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.expiry_date||'—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.reminder_date||'—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.added_by_name||'—'}</td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <button onClick={()=>setModal(e)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                        <HiOutlinePencil className="w-4 h-4"/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <ExpenseModal expense={modal==='new'?null:modal} accounts={accounts} onClose={()=>setModal(null)} onSaved={load}/>}
    </div>
  )
}
