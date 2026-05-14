import { useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { HiOutlineX, HiOutlineUpload, HiOutlinePhotograph } from 'react-icons/hi'
import { CURRENCIES } from './utils'

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function ClaimSubmitModal({ claim, employees, canPickEmployee, onClose, onSaved }) {
  const isEdit = !!claim
  const [form, setForm] = useState({
    employee:   claim?.employee || '',
    title:      claim?.title || '',
    reason:     claim?.reason || '',
    amount:     claim?.amount || '',
    currency:   claim?.currency || 'PKR',          // ← default to PKR
    claim_date: claim?.claim_date || todayISO(),
  })
  const [proofFile, setProofFile]  = useState(null)
  const [proofPreview, setPreview] = useState(claim?.proof_url || null)
  const [saving, setSaving]        = useState(false)

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Image only'); return }
    if (f.size > 5 * 1024 * 1024)     { toast.error('Max 5MB'); return }
    setProofFile(f)
    const r = new FileReader()
    r.onload = (ev) => setPreview(ev.target.result)
    r.readAsDataURL(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.reason || !form.amount || !form.claim_date) {
      toast.error('Fill all required fields'); return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v === '' || v == null) return
        fd.append(k, v)
      })
      if (proofFile) fd.append('proof', proofFile)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) await api.patch(`/reimbursements/${claim.id}/`, fd, cfg)
      else        await api.post('/reimbursements/', fd, cfg)
      toast.success(isEdit ? 'Updated' : 'Submitted')
      onSaved()
    } catch (err) {
      const d = err.response?.data
      toast.error(d ? Object.values(d).flat().join(' ') : 'Failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-lg animate-slide-up my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-xl">
            {isEdit ? 'Edit Claim' : 'New Reimbursement Claim'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-6 h-6"/>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {canPickEmployee && employees && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Employee (submit on behalf)</label>
              <select className="input" value={form.employee}
                onChange={e => setForm(p => ({ ...p, employee: e.target.value }))}>
                <option value="" className="bg-slate-900">— Myself —</option>
                {employees.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900">
                    {u.full_name || u.username} ({u.designation || u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title *</label>
            <input required className="input" placeholder="e.g. Client meeting taxi"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Amount *</label>
              <input required type="number" step="0.01" min="0" className="input" placeholder="0.00"
                value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Currency</label>
              <select className="input" value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Date of Expense *</label>
            <input required type="date" className="input" value={form.claim_date}
              onChange={e => setForm(p => ({ ...p, claim_date: e.target.value }))}/>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Reason / Description *</label>
            <textarea required rows={3} className="input resize-none" placeholder="Why this expense was needed..."
              value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}/>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Proof of Purchase <span className="text-slate-600">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="btn-ghost text-sm px-4 py-2 flex items-center gap-2 cursor-pointer">
                <HiOutlineUpload className="w-4 h-4"/>
                {(proofFile || proofPreview) ? 'Change' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={onFile}/>
              </label>
              {proofPreview && (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                  <img src={proofPreview} alt="proof" className="w-full h-full object-cover"/>
                </div>
              )}
              {!proofPreview && <HiOutlinePhotograph className="w-7 h-7 text-slate-600"/>}
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">Max 5MB · Receipt, screenshot, or photo</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm">
              {saving ? 'Saving...' : (isEdit ? 'Update Claim' : 'Submit Claim')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
