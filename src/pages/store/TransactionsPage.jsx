import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineCheck, HiOutlinePhotograph,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'
const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-red-500/15 text-red-400',
  refunded: 'bg-purple-500/15 text-purple-400',
}
const METHODS = ['bank_transfer','cash','easypaisa','jazzcash','stripe','paypal','crypto','cheque','other']

const EMPTY_FORM = {
  customer: '', product: '', subscription: '', amount: '', currency: 'PKR',
  payment_method: 'bank_transfer', status: 'pending',
  transaction_date: new Date().toISOString().slice(0, 10),
  description: '',
}

function buildForm(txn) {
  if (!txn) return { ...EMPTY_FORM }
  return {
    ...EMPTY_FORM,
    ...txn,
    customer: txn.customer ?? '',
    product: txn.product ?? '',
    subscription: txn.subscription ?? '',
  }
}

function TxnModal({ txn, customers, products, subscriptions, onClose, onSaved }) {
  const isEdit = !!txn?.id
  const [form, setForm] = useState(() => buildForm(txn))
  const [screenshot, setScreenshot] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const filteredSubs = subscriptions.filter(s => !form.customer || String(s.customer) === String(form.customer))

  const save = async () => {
    if (!form.customer || !form.amount) return toast.error('Customer and amount required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v)
      })
      if (screenshot) fd.append('payment_screenshot', screenshot)
      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) {
        await api.patch(`/store/transactions/${txn.id}/`, fd, config)
        toast.success('Transaction updated')
      } else {
        await api.post('/store/transactions/', fd, config)
        toast.success('Transaction recorded')
      }
      onSaved(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="glass-light rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid rgba(75,191,191,0.2)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Transaction' : 'Record Transaction'}</h2>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 text-sm mb-1 block">Customer *</label>
              <select value={form.customer} onChange={e => { f('customer', e.target.value); f('subscription', '') }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="" className="bg-[#0e1420]">— Select Customer —</option>
                {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Product</label>
              <select value={form.product} onChange={e => f('product', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="" className="bg-[#0e1420]">— Select Product —</option>
                {products.map(p => <option key={p.id} value={p.id} className="bg-[#0e1420]">{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Subscription</label>
              <select value={form.subscription} onChange={e => f('subscription', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="" className="bg-[#0e1420]">— None —</option>
                {filteredSubs.map(s => <option key={s.id} value={s.id} className="bg-[#0e1420]">{s.product_name} ({s.status})</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Amount *</label>
              <input type="number" value={form.amount} onChange={e => f('amount', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Currency</label>
              <select value={form.currency} onChange={e => f('currency', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                {['PKR','USD','GBP','EUR','AED'].map(c => <option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Payment Method</label>
              <select value={form.payment_method} onChange={e => f('payment_method', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                {METHODS.map(m => (
                  <option key={m} value={m} className="bg-[#0e1420]">
                    {m.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Status</label>
              <select value={form.status} onChange={e => f('status', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                {['pending','completed','failed','refunded'].map(s => (
                  <option key={s} value={s} className="bg-[#0e1420]">{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Transaction Date</label>
              <input type="date" value={form.transaction_date} onChange={e => f('transaction_date', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Description / Notes</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-2 block">Payment Screenshot / Proof</label>
            {txn?.payment_screenshot && !screenshot && (
              <div className="mb-2">
                <a href={txn.payment_screenshot} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-[#4BBFBF] text-sm hover:underline">
                  <HiOutlinePhotograph className="w-4 h-4" /> View existing screenshot
                </a>
              </div>
            )}
            {screenshot ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#4BBFBF]/10 border border-[#4BBFBF]/20">
                <HiOutlinePhotograph className="w-5 h-5 text-[#4BBFBF]" />
                <span className="text-slate-300 text-sm flex-1 truncate">{screenshot.name}</span>
                <button onClick={() => setScreenshot(null)} className="text-slate-500 hover:text-red-400">
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current.click()}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:border-[#4BBFBF]/40 hover:text-slate-300 transition-colors">
                <HiOutlinePhotograph className="w-5 h-5" />
                Upload payment screenshot
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => setScreenshot(e.target.files[0])} />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Record Transaction')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage({ user }) {
  const [txns, setTxns] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const canManage = ['admin', 'sales', 'accountant'].includes(user?.role)
  const canApprove = ['admin', 'accountant'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const [txnRes, custRes, prodRes, subRes, sumRes] = await Promise.all([
        api.get(`/store/transactions/${params}`),
        api.get('/store/customers/'),
        api.get('/store/products/'),
        api.get('/store/subscriptions/'),
        api.get('/store/transactions/summary/').catch(() => ({ data: null })),
      ])
      setTxns(Array.isArray(txnRes.data) ? txnRes.data : txnRes.data.results || [])
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.results || [])
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || [])
      setSubscriptions(Array.isArray(subRes.data) ? subRes.data : subRes.data.results || [])
      setSummary(sumRes.data)
    } catch { toast.error('Failed to load transactions') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const approve = async (id) => {
    try {
      await api.post(`/store/transactions/${id}/approve/`)
      toast.success('Transaction approved')
      load()
    } catch { toast.error('Failed to approve') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Payment records & history</p>
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
            <option value="" className="bg-[#0e1420]">All Status</option>
            {['pending','completed','failed','refunded'].map(s => (
              <option key={s} value={s} className="bg-[#0e1420]">{s}</option>
            ))}
          </select>
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold"
              style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              <HiOutlinePlus className="w-4 h-4" /> Record Transaction
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Received', value: `PKR ${parseFloat(summary.total_amount||0).toLocaleString()}`, color: 'text-emerald-400' },
            { label: 'Pending', value: `PKR ${parseFloat(summary.pending_amount||0).toLocaleString()}`, color: 'text-yellow-400' },
            { label: 'Total Transactions', value: summary.total_transactions, color: 'text-white' },
            { label: 'Top Method', value: summary.by_method?.[0]?.payment_method?.replace(/_/g,' ') || '—', color: 'text-[#4BBFBF]' },
          ].map(s => (
            <div key={s.label} className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
        </div>
      ) : (
        <div className="glass-light rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['TXN ID','Customer','Product','Amount','Method','Status','Date','Proof','Recorded By',''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-slate-500 py-12">No transactions found</td></tr>
              ) : txns.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="text-slate-400 text-xs font-mono">{String(t.transaction_id).slice(0, 8).toUpperCase()}</span>
                    {t.is_approved && <span className="ml-1 text-emerald-400 text-xs">✓</span>}
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{t.customer_name}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{t.product_name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-sm text-[#4BBFBF]">{t.currency} {parseFloat(t.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs capitalize">{t.payment_method?.replace(/_/g,' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[t.status] || ''}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{t.transaction_date}</td>
                  <td className="px-4 py-3">
                    {t.payment_screenshot
                      ? <a href={t.payment_screenshot} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-[#4BBFBF] hover:underline text-xs">
                          <HiOutlinePhotograph className="w-3.5 h-3.5" />View
                        </a>
                      : <span className="text-slate-600 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{t.recorded_by_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canApprove && !t.is_approved && t.status === 'pending' && (
                        <button onClick={() => approve(t.id)} title="Approve"
                          className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25">
                          <HiOutlineCheck className="w-4 h-4" />
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => setModal(t)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
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
      )}

      {modal && (
        <TxnModal
          txn={modal === 'new' ? null : modal}
          customers={customers}
          products={products}
          subscriptions={subscriptions}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
