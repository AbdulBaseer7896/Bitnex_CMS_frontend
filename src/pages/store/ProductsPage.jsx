import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye,
  HiOutlineEyeOff, HiOutlineCurrencyDollar, HiOutlineRefresh,
  HiOutlineCheck, HiOutlineX, HiOutlineShoppingBag,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'
const BILLING_LABELS = {
  one_time: 'One Time', monthly: 'Monthly', quarterly: 'Quarterly',
  annually: 'Annually', custom: 'Custom',
}

const EMPTY_FORM = {
  name: '', description: '', short_description: '', category: '',
  billing_type: 'monthly', base_price: '', currency: 'PKR',
  is_active: true, show_price_to_customer: true, is_publicly_listed: true,
  features: '',
}

function buildForm(product) {
  if (!product) return { ...EMPTY_FORM }
  return {
    ...EMPTY_FORM,
    ...product,
    features: Array.isArray(product.features)
      ? product.features.join('\n')
      : (product.features || ''),
  }
}

function ProductModal({ product, onClose, onSaved }) {
  const isEdit = !!product?.id
  const [form, setForm] = useState(() => buildForm(product))
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return toast.error('Product name required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        base_price: parseFloat(form.base_price) || 0,
        features: form.features ? form.features.split('\n').map(x => x.trim()).filter(Boolean) : [],
      }
      if (isEdit) {
        await api.patch(`/store/products/${product.id}/`, payload)
        toast.success('Product updated')
      } else {
        await api.post('/store/products/', payload)
        toast.success('Product created')
      }
      onSaved(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save product')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           style={{ border: '1px solid rgba(75,191,191,0.2)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiOutlineX className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-slate-400 text-sm mb-1 block">Product Name *</label>
              <input value={form.name} onChange={e => f('name', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Category</label>
              <input value={form.category} onChange={e => f('category', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Billing Type</label>
              <select value={form.billing_type} onChange={e => f('billing_type', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                {Object.entries(BILLING_LABELS).map(([v, l]) => (
                  <option key={v} value={v} className="bg-[#0e1420]">{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Base Price</label>
              <input type="number" value={form.base_price} onChange={e => f('base_price', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">Currency</label>
              <select value={form.currency} onChange={e => f('currency', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50">
                {['PKR','USD','GBP','EUR','AED'].map(c => (
                  <option key={c} value={c} className="bg-[#0e1420]">{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Short Description</label>
            <input value={form.short_description} onChange={e => f('short_description', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Full Description</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Features (one per line)</label>
            <textarea value={form.features} onChange={e => f('features', e.target.value)} rows={4}
              placeholder={"24/7 support\nUnlimited users\nAdvanced analytics"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#4BBFBF]/50 font-mono text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              ['is_active', 'Active'],
              ['show_price_to_customer', 'Show Price to Customers'],
              ['is_publicly_listed', 'Publicly Listed'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => f(key, !form[key])}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form[key] ? 'bg-[#4BBFBF]' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form[key] ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-slate-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create Product')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage({ user }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [toggling, setToggling] = useState({})

  const canManage = user?.role === 'admin' || (user?.role === 'sales' && user?.is_dept_head)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/store/products/')
      setProducts(Array.isArray(data) ? data : data.results || [])
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleVisibility = async (product, field) => {
    const key = `${product.id}-${field}`
    setToggling(p => ({ ...p, [key]: true }))
    try {
      const endpoint = field === 'show_price_to_customer'
        ? `/store/products/${product.id}/toggle_price_visibility/`
        : `/store/products/${product.id}/toggle_public_listing/`
      await api.post(endpoint)
      toast.success('Updated')
      load()
    } catch { toast.error('Failed to toggle') }
    finally { setToggling(p => ({ ...p, [key]: false })) }
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/store/products/${id}/`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your service offerings</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold"
              style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              <HiOutlinePlus className="w-4 h-4" /> New Product
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
        </div>
      ) : products.length === 0 ? (
        <div className="glass-light rounded-2xl p-16 text-center" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
          <HiOutlineShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No products yet</p>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="mt-4 px-6 py-2 rounded-xl text-[#0e1420] font-semibold"
              style={{ background: TEAL }}>
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="glass-light rounded-2xl p-5 flex flex-col gap-4"
                 style={{ border: `1px solid ${p.is_active ? 'rgba(75,191,191,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold">{p.name}</span>
                    {!p.is_active && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">Inactive</span>}
                  </div>
                  {p.category && <span className="text-xs px-2 py-0.5 rounded-full bg-[#4BBFBF]/10 text-[#4BBFBF]">{p.category}</span>}
                </div>
                <div className="text-right">
                  {p.show_price_to_customer && p.base_price !== undefined
                    ? <div className="text-[#4BBFBF] font-bold text-lg">{p.currency} {parseFloat(p.base_price).toLocaleString()}</div>
                    : <div className="text-slate-500 text-sm italic">Price hidden</div>
                  }
                  <div className="text-slate-500 text-xs">{BILLING_LABELS[p.billing_type]}</div>
                </div>
              </div>

              {p.short_description && <p className="text-slate-400 text-sm">{p.short_description}</p>}

              {Array.isArray(p.features) && p.features.length > 0 && (
                <ul className="space-y-1">
                  {p.features.slice(0, 4).map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-400 text-xs">
                      <HiOutlineCheck className="w-3 h-3 text-[#4BBFBF] flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                  {p.features.length > 4 && <li className="text-slate-600 text-xs">+{p.features.length - 4} more</li>}
                </ul>
              )}

              {canManage && (
                <div className="text-xs text-slate-500">
                  {p.subscription_count || 0} active subscription{p.subscription_count !== 1 ? 's' : ''}
                </div>
              )}

              {canManage && (
                <div className="flex gap-2 pt-1 border-t border-white/5">
                  <button
                    onClick={() => toggleVisibility(p, 'show_price_to_customer')}
                    disabled={toggling[`${p.id}-show_price_to_customer`]}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${p.show_price_to_customer ? 'bg-[#4BBFBF]/15 text-[#4BBFBF]' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}>
                    <HiOutlineCurrencyDollar className="w-3.5 h-3.5" />
                    {p.show_price_to_customer ? 'Price Visible' : 'Price Hidden'}
                  </button>
                  <button
                    onClick={() => toggleVisibility(p, 'is_publicly_listed')}
                    disabled={toggling[`${p.id}-is_publicly_listed`]}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${p.is_publicly_listed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}>
                    {p.is_publicly_listed ? <HiOutlineEye className="w-3.5 h-3.5" /> : <HiOutlineEyeOff className="w-3.5 h-3.5" />}
                    {p.is_publicly_listed ? 'Public' : 'Private'}
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => setModal(p)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                    <HiOutlinePencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
