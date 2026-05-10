import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineSearch, HiOutlinePhone, HiOutlineReceiptTax,
  HiOutlineCalendar, HiOutlineExclamation,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'
const inp = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50'

const DIALER_TYPES = [
  ['google_voice','Google Voice'],['ring_central','Ring Central'],
  ['nux_call','NuxCall'],['vonage','Vonage'],
  ['mighty_call','Mighty Call'],['twilio','Twilio'],['other','Other'],
]
const EXPENSE_TYPES = [
  ['account_purchase','Account Purchase'],['subscription_renewal','Subscription Renewal'],
  ['number_purchase','Number Purchase'],['upgrade','Upgrade'],['other','Other'],
]
const EXPIRY_COLORS = {
  expired: 'bg-red-500/15 text-red-400',
  expiring_soon: 'bg-orange-500/15 text-orange-400',
  expiring_month: 'bg-yellow-500/15 text-yellow-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  no_expiry: 'bg-slate-500/15 text-slate-400',
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

function ExpenseModal({ expense, onClose, onSaved }) {
  const isEdit = !!expense?.id
  const EMPTY = {
    dialer_type: 'google_voice', dialer_account_email: '',
    expense_type: 'subscription_renewal', description: '',
    amount: '', currency: 'PKR', expense_date: new Date().toISOString().slice(0,10),
    expiry_date: '', reminder_date: '', seats_count: 1, notes: '',
  }
  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...expense } : EMPTY)
  const [receipt, setReceipt] = useState(null)
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.description || !form.amount || !form.expense_date)
      return toast.error('Description, amount, and date required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
      if (receipt) fd.append('receipt', receipt)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) { await api.patch(`/store/dialer-expenses/${expense.id}/`, fd, cfg); toast.success('Updated') }
      else { await api.post('/store/dialer-expenses/', fd, cfg); toast.success('Expense recorded') }
      onSaved(); onClose()
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
           style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">{isEdit ? 'Edit' : 'Record'} Dialer Expense</h3>
            <p className="text-slate-500 text-xs mt-0.5">Track company dialer account costs</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Dialer Type *</label>
              <select value={form.dialer_type} onChange={e => f('dialer_type', e.target.value)} className={inp}>
                {DIALER_TYPES.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Expense Type *</label>
              <select value={form.expense_type} onChange={e => f('expense_type', e.target.value)} className={inp}>
                {EXPENSE_TYPES.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Account Email / Identifier</label>
            <input type="email" value={form.dialer_account_email} onChange={e => f('dialer_account_email', e.target.value)}
              placeholder="e.g. company@gmail.com for Google Voice" className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Description *</label>
            <input value={form.description} onChange={e => f('description', e.target.value)}
              placeholder="e.g. Google Voice 10 numbers renewal — May 2026" className={inp} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Amount *</label>
              <input type="number" value={form.amount} onChange={e => f('amount', e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Currency</label>
              <select value={form.currency} onChange={e => f('currency', e.target.value)} className={inp}>
                {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Seats / Numbers</label>
              <input type="number" value={form.seats_count} onChange={e => f('seats_count', e.target.value)} min="1" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['expense_date','Expense Date *'],['expiry_date','Expiry Date'],['reminder_date','Reminder Date']].map(([k,l]) => (
              <div key={k}>
                <label className="text-slate-400 text-xs mb-1 block font-medium">{l}</label>
                <input type="date" value={form[k]} onChange={e => f(k, e.target.value)} className={inp} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block font-medium">Receipt / Invoice</label>
            {receipt ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#4BBFBF]/10 border border-[#4BBFBF]/20">
                <HiOutlineReceiptTax className="w-4 h-4 text-[#4BBFBF]" />
                <span className="text-slate-300 text-sm flex-1 truncate">{receipt.name}</span>
                <button onClick={() => setReceipt(null)} className="text-slate-500 hover:text-red-400"><HiOutlineX className="w-4 h-4" /></button>
              </div>
            ) : (
              <label className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-[#4BBFBF]/40 text-sm">
                <HiOutlineReceiptTax className="w-5 h-5" /> Upload receipt
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setReceipt(e.target.files[0])} />
              </label>
            )}
            {isEdit && expense.receipt && !receipt && (
              <a href={expense.receipt} target="_blank" rel="noreferrer" className="text-[#4BBFBF] text-xs mt-1 hover:underline block">
                View current receipt
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Record Expense')}
          </button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

export default function DialerExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let q = '?page_size=500'
      if (typeFilter) q += '&dialer_type=' + typeFilter
      if (expenseTypeFilter) q += '&expense_type=' + expenseTypeFilter
      const { data } = await api.get('/store/dialer-expenses/' + q)
      setExpenses(Array.isArray(data) ? data : data.results || [])
      setPage(1)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [typeFilter, expenseTypeFilter])

  useEffect(() => { load() }, [load])

  const filtered = expenses.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return e.description?.toLowerCase().includes(q) ||
      e.dialer_account_email?.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const expiring = expenses.filter(e => e.expiry_status === 'expired' || e.expiry_status === 'expiring_soon').length
  const byType = DIALER_TYPES.reduce((acc, [v]) => {
    acc[v] = expenses.filter(e => e.dialer_type === v).reduce((s, e) => s + parseFloat(e.amount||0), 0)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Dialer Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">Track company dialer account costs — Google Voice, Ring Central, NuxCall & more</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            <HiOutlinePlus className="w-4 h-4" /> Record Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(75,191,191,0.12)' }}>
          <div className="text-2xl font-bold text-[#4BBFBF]">PKR {totalSpent.toLocaleString()}</div>
          <div className="text-white text-xs font-medium mt-0.5">Total Spent</div>
          <div className="text-slate-500 text-xs">{expenses.length} records</div>
        </div>
        {DIALER_TYPES.slice(0,3).map(([v,l]) => (
          byType[v] > 0 && (
            <div key={v} className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xl font-bold text-white">PKR {byType[v].toLocaleString()}</div>
              <div className="text-slate-400 text-xs font-medium mt-0.5">{l}</div>
            </div>
          )
        ))}
        {expiring > 0 && (
          <div className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="text-2xl font-bold text-red-400">{expiring}</div>
            <div className="text-white text-xs font-medium mt-0.5">Expiring/Expired</div>
            <div className="text-red-400 text-xs">Action needed</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search description, email, notes…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
          <option value="" className="bg-[#0e1420]">All Dialers</option>
          {DIALER_TYPES.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
        </select>
        <select value={expenseTypeFilter} onChange={e => setExpenseTypeFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
          <option value="" className="bg-[#0e1420]">All Types</option>
          {EXPENSE_TYPES.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} /></div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <HiOutlinePhone className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                No expenses yet. Record your first dialer expense.
              </div>
            ) : paged.map(e => (
              <div key={e.id} className="glass-light rounded-2xl p-4 flex items-start gap-4"
                style={{ border: '1px solid ' + (e.expiry_status === 'expired' ? 'rgba(239,68,68,0.2)' : e.expiry_status === 'expiring_soon' ? 'rgba(249,115,22,0.2)' : 'rgba(75,191,191,0.08)') }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (DIALER_BADGES[e.dialer_type] || '')}>
                      {DIALER_TYPES.find(([v])=>v===e.dialer_type)?.[1] || e.dialer_type}
                    </span>
                    <span className="text-slate-500 text-xs px-2 py-0.5 rounded-full bg-white/5">
                      {EXPENSE_TYPES.find(([v])=>v===e.expense_type)?.[1] || e.expense_type}
                    </span>
                    {e.expiry_status && e.expiry_status !== 'no_expiry' && (
                      <span className={'px-2 py-0.5 rounded-full text-xs ' + (EXPIRY_COLORS[e.expiry_status] || '')}>
                        {e.expiry_status.replace(/_/g,' ')}
                      </span>
                    )}
                  </div>
                  <div className="text-white font-semibold mb-1">{e.description}</div>
                  {e.dialer_account_email && <div className="text-slate-500 text-xs mb-2">{e.dialer_account_email}</div>}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div><div className="text-slate-500 text-xs">Amount</div><div className="text-emerald-400 font-bold">{e.currency} {parseFloat(e.amount).toLocaleString()}</div></div>
                    <div><div className="text-slate-500 text-xs">Seats</div><div className="text-white">{e.seats_count}</div></div>
                    <div><div className="text-slate-500 text-xs">Date</div><div className="text-slate-300">{e.expense_date}</div></div>
                    <div><div className="text-slate-500 text-xs">Expiry</div><div className={e.expiry_status === 'expired' ? 'text-red-400' : 'text-slate-300'}>{e.expiry_date || '—'}</div></div>
                  </div>
                  {e.notes && <div className="text-slate-600 text-xs mt-2 italic">{e.notes}</div>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {e.receipt && (
                    <a href={e.receipt} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-[#4BBFBF] text-xs hover:underline">
                      <HiOutlineReceiptTax className="w-3.5 h-3.5" /> Receipt
                    </a>
                  )}
                  <button onClick={() => setModal(e)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">{filtered.length} total · page {page}/{totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-400 disabled:opacity-40 hover:bg-white/5">Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {modal && <ExpenseModal expense={modal==='new'?null:modal} onClose={() => setModal(null)} onSaved={load} />}
    </div>
  )
}
