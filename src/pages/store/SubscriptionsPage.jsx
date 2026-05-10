import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'
const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  paused: 'bg-blue-500/15 text-blue-400',
  cancelled: 'bg-red-500/15 text-red-400',
  expired: 'bg-slate-500/15 text-slate-400',
}

const EMPTY_FORM = {
  customer: '', product: '', status: 'pending', agreed_price: '',
  currency: 'PKR', discount: 0, start_date: '', end_date: '',
  next_billing_date: '', notes: '',
}

function buildForm(sub) {
  if (!sub) return { ...EMPTY_FORM }
  return {
    ...EMPTY_FORM,
    ...sub,
    customer: sub.customer ?? '',
    product: sub.product ?? '',
  }
}

function SubModal({ sub, customers, products, onClose, onSaved }) {
  const isEdit = !!sub?.id
  const [form, setForm] = useState(() => buildForm(sub))
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleProductChange = (pid) => {
    f('product', pid)
    const prod = products.find(p => String(p.id) === String(pid))
    if (prod && !isEdit) f('agreed_price', prod.base_price)
  }

  const save = async () => {
    if (!form.customer || !form.product) return toast.error('Customer and product required')
    setSaving(true)
    try {
      const payload = { ...form, discount: parseFloat(form.discount) || 0, agreed_price: parseFloat(form.agreed_price) || 0 }
      if (isEdit) {
        await api.patch(`/store/subscriptions/${sub.id}/`, payload)
        toast.success('Subscription updated')
      } else {
        await api.post('/store/subscriptions/', payload)
        toast.success('Subscription created')
      }
      onSaved(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="glass-light rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ border: '1px solid rgba(75,191,191,0.2)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Subscription' : 'New Subscription'}</h2>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Customer *</label>
            <select value={form.customer} onChange={e => f('customer', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
              <option value="" className="bg-[#0e1420]">— Select Customer —</option>
              {customers.map(c => <option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Product *</label>
            <select value={form.product} onChange={e => handleProductChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
              <option value="" className="bg-[#0e1420]">— Select Product —</option>
              {products.map(p => <option key={p.id} value={p.id} className="bg-[#0e1420]">{p.name} ({p.currency} {p.base_price})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Agreed Price</label>
              <input type="number" value={form.agreed_price} onChange={e => f('agreed_price', e.target.value)}
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
              <label className="text-slate-400 text-sm mb-1 block">Discount %</label>
              <input type="number" min="0" max="100" value={form.discount} onChange={e => f('discount', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Status</label>
            <select value={form.status} onChange={e => f('status', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
              {['pending','active','paused','cancelled','expired'].map(s => (
                <option key={s} value={s} className="bg-[#0e1420]">{s.charAt(0).toUpperCase()+s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['start_date','Start Date'],['end_date','End Date'],['next_billing_date','Next Billing']].map(([k, l]) => (
              <div key={k}>
                <label className="text-slate-400 text-sm mb-1 block">{l}</label>
                <input type="date" value={form[k]} onChange={e => f(k, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionsPage({ user }) {
  const [subs, setSubs] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  const canManage = ['admin', 'sales'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const [subRes, custRes, prodRes] = await Promise.all([
        api.get(`/store/subscriptions/${params}`),
        api.get('/store/customers/'),
        api.get('/store/products/'),
      ])
      setSubs(Array.isArray(subRes.data) ? subRes.data : subRes.data.results || [])
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.results || [])
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-1">Customer product subscriptions</p>
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
            <option value="" className="bg-[#0e1420]">All Status</option>
            {['pending','active','paused','cancelled','expired'].map(s => (
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
              <HiOutlinePlus className="w-4 h-4" /> New Subscription
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
        </div>
      ) : (
        <div className="glass-light rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Customer','Product','Status','Price','Discount','Final','Start','Next Billing',''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-slate-500 py-12">No subscriptions found</td></tr>
              ) : subs.map(s => {
                const finalPrice = parseFloat(s.agreed_price) * (1 - parseFloat(s.discount || 0) / 100)
                return (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white text-sm">{s.customer_name}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{s.product_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[s.status] || ''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{s.currency} {parseFloat(s.agreed_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{s.discount ? `${s.discount}%` : '—'}</td>
                    <td className="px-4 py-3 text-[#4BBFBF] font-medium text-sm">{s.currency} {finalPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{s.start_date || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{s.next_billing_date || '—'}</td>
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
          products={products}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
