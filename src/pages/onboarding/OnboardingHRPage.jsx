// ─────────────────────────────────────────────────────────────────────────────
// OnboardingHRPage — Admin/HR review and approval of employee onboarding
// submissions.
//
// Left pane: list of all onboarding records with status filter chips and search.
// Right pane / modal: full editable form replicating the official paper form.
// HR can: edit any field, approve, request changes (with notes), download
// the printable PDF using the same letterhead system as the HR letters.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineCheck, HiOutlineExclamation,
  HiOutlineDownload, HiOutlineRefresh, HiOutlineX, HiOutlinePencil,
} from 'react-icons/hi'
import { downloadLetterPDF, buildFilename } from '../documents/pdfGenerator'
import { LetterHeader, LetterFooter } from '../documents/LetterPreview'
import { PAKISTANI_BANKS } from '../../utils/pakistaniBanks'
import OnboardingFormPrint from './OnboardingFormPrint'

const BRAND = '#44BDB2'

const STATUS_META = {
  draft:             { label: 'Draft',             color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  submitted:         { label: 'Submitted',         color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  changes_requested: { label: 'Changes Requested', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  approved:          { label: 'Approved',          color: BRAND,     bg: 'rgba(68,189,178,0.15)' },
}

// Tiny labelled-field input used in the review form
const F = ({ label, children, full }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{label}</div>
    {children}
  </div>
)
const Inp = (p) => (
  <input {...p}
    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-teal-400/60"/>
)
const TA = (p) => (
  <textarea {...p}
    className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-teal-400/60"/>
)

export default function OnboardingHRPage() {
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [tabFilter, setTab]     = useState('submitted')
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/onboarding/')
      setRows(data.results || data || [])
    } catch {
      toast.error('Failed to load onboarding records')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      if (tabFilter !== 'all' && r.status !== tabFilter) return false
      if (!q) return true
      const blob = `${r.full_name||''} ${r.user_username||''} ${r.user_email||''} ${r.cnic_number||''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search, tabFilter])

  const counts = useMemo(() => {
    const c = { all: rows.length, draft:0, submitted:0, changes_requested:0, approved:0 }
    for (const r of rows) c[r.status] = (c[r.status] || 0) + 1
    return c
  }, [rows])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-white text-2xl">Onboarding</h2>
        <p className="text-slate-500 text-sm mt-1">
          Review and approve new-employee information forms. You can edit any field, request changes,
          or download the official printable form.
        </p>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {[
          ['submitted',         'Submitted',     counts.submitted],
          ['changes_requested', 'Changes Req.',  counts.changes_requested],
          ['approved',          'Approved',      counts.approved],
          ['draft',             'In Progress',   counts.draft],
          ['all',               'All',           counts.all],
        ].map(([k, l, n]) => {
          const active = tabFilter === k
          return (
            <button key={k} onClick={() => setTab(k)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: active ? `${BRAND}1f` : 'rgba(255,255,255,0.04)',
                border: active ? `1px solid ${BRAND}66` : '1px solid rgba(255,255,255,0.06)',
                color: active ? BRAND : '#cbd5e1',
              }}>
              {l}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background:'rgba(255,255,255,0.08)' }}>{n}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, username or CNIC…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400/60"/>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background:'rgba(255,255,255,0.03)' }}>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">CNIC</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                No records match this filter.
              </td></tr>
            ) : filtered.map(r => {
              const s = STATUS_META[r.status] || STATUS_META.draft
              return (
                <tr key={r.id} className="hover:bg-white/[0.02] border-t border-white/5">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{r.full_name || r.user_username}</div>
                    <div className="text-slate-500 text-xs">{r.user_email || r.user_username}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{r.cnic_number || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{r.position || r.user_designation || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: s.bg, color: s.color, border:`1px solid ${s.color}33` }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(r)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: `${BRAND}1f`, color: BRAND, border:`1px solid ${BRAND}33` }}>
                      Review
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <ReviewModal
          record={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setRows(rs => rs.map(r => r.id === updated.id ? updated : r))
            setSelected(updated)
          }}/>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Review modal — full editable form
// ─────────────────────────────────────────────────────────────────────────────
function ReviewModal({ record, onClose, onSaved }) {
  const [form, setForm]   = useState(record)
  const [saving, setSaving] = useState(false)
  const [reqNotes, setReqNotes] = useState('')
  const [showReqBox, setShowReqBox] = useState(false)
  const status = STATUS_META[form.status] || STATUS_META.draft

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const fields = [
        'full_name','father_name','cnic_number','date_of_birth','gender','marital_status',
        'personal_number','father_number','emergency_number','personal_email','address','city',
        'husband_name','husband_profession','husband_number',
        'position','department','date_of_training','joining_date',
        'bank_name','bank_branch','account_title','account_number','iban',
      ]
      const payload = {}
      for (const k of fields) payload[k] = form[k] ?? ''
      const { data } = await api.patch(`/onboarding/${form.id}/`, payload)
      toast.success('Changes saved')
      onSaved(data)
    } catch {
      toast.error('Failed to save')
    } finally { setSaving(false) }
  }

  const handleApprove = async () => {
    setSaving(true)
    try {
      const { data } = await api.post(`/onboarding/${form.id}/approve/`)
      toast.success('Approved! Employee will see the welcome screen on their next login.')
      onSaved(data)
    } catch {
      toast.error('Failed to approve')
    } finally { setSaving(false) }
  }

  const handleRequestChanges = async () => {
    if (!reqNotes.trim()) { toast.error('Please describe what needs to change'); return }
    setSaving(true)
    try {
      const { data } = await api.post(`/onboarding/${form.id}/request-changes/`,
        { hr_notes: reqNotes.trim() })
      toast.success('Changes requested — the employee can now edit again.')
      onSaved(data)
      setShowReqBox(false)
      setReqNotes('')
    } catch {
      toast.error('Failed')
    } finally { setSaving(false) }
  }

  const handleDownload = async () => {
    // Pull current letterhead default for HR stamp (signature is not used on
    // the onboarding form per spec — only HR's approval stamp appears).
    let stamp = null
    try {
      const { data } = await api.get('/letterhead/', { params: { kind: 'stamp' } })
      const stmps = data.results || data || []
      stamp = stmps.find(a => a.is_default) || null
    } catch {}

    const filename = buildFilename(form.full_name || form.user_username || 'employee', 'information_form')
    const toastId = toast.loading('Generating PDF…')
    try {
      await downloadLetterPDF({
        filename,
        renderHeader: (host) => new Promise(resolve => {
          const root = createRoot(host)
          root.render(<LetterHeader/>)
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        }),
        renderBody: (host) => new Promise(resolve => {
          const root = createRoot(host)
          root.render(<OnboardingFormPrint
            form={form}
            stampUrl={stamp?.image_url || ''}/>)
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        }),
        renderFooter: (host, p, t) => new Promise(resolve => {
          const root = createRoot(host)
          root.render(<LetterFooter pageNum={p} totalPages={t}/>)
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        }),
      })
      toast.success('PDF downloaded', { id: toastId })
    } catch {
      toast.error('PDF generation failed', { id: toastId })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="glass-light rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-white text-lg">
                {form.full_name || form.user_username}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: status.bg, color: status.color, border:`1px solid ${status.color}33` }}>
                {status.label}
              </span>
            </div>
            <div className="text-slate-500 text-xs">
              {form.user_email || form.user_username}
              {form.submitted_at && <> · submitted {new Date(form.submitted_at).toLocaleString('en-GB')}</>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-5 h-5"/>
          </button>
        </div>

        {/* HR notes box for change-requested records */}
        {form.status === 'changes_requested' && form.hr_notes && (
          <div className="mx-5 mt-4 rounded-xl p-3 text-xs"
               style={{ background:'rgba(251,146,60,0.08)',
                        border:'1px solid rgba(251,146,60,0.2)' }}>
            <div className="text-orange-400 font-semibold uppercase tracking-widest text-[10px] mb-1">
              Previous HR Note
            </div>
            <div className="text-orange-100 whitespace-pre-wrap">{form.hr_notes}</div>
          </div>
        )}

        {/* Body — editable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Identity images */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ['cnic_front_url','CNIC Front'],
              ['cnic_back_url', 'CNIC Back'],
              ['selfie_url',    'Selfie'],
            ].map(([k, l]) => (
              <div key={k} className="rounded-xl overflow-hidden"
                   style={{ background:'rgba(255,255,255,0.03)',
                            border:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="aspect-video flex items-center justify-center bg-black/30">
                  {form[k]
                    ? <img src={form[k]} alt={l} className="max-h-full max-w-full object-contain"/>
                    : <span className="text-rose-400 text-xs">missing</span>}
                </div>
                <div className="px-2 py-1.5 text-xs text-slate-400">{l}</div>
              </div>
            ))}
          </section>

          {/* Document uploads (PDF/image) — clickable links */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['latest_degree_url', 'Latest Degree'],
              ['cv_url',            'CV'],
            ].map(([k, l]) => (
              <a key={k}
                 href={form[k] || undefined}
                 target="_blank"
                 rel="noreferrer"
                 className="rounded-xl px-3 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                 style={{ background:'rgba(255,255,255,0.03)',
                          border:'1px solid rgba(255,255,255,0.06)',
                          pointerEvents: form[k] ? 'auto' : 'none' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                     style={{ background: form[k] ? `${BRAND}22` : 'rgba(244,63,94,0.15)' }}>
                  {form[k] ? '📄' : '✕'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{l}</div>
                  <div className="text-xs"
                       style={{ color: form[k] ? BRAND : '#fb7185' }}>
                    {form[k] ? 'View / download' : 'not uploaded'}
                  </div>
                </div>
              </a>
            ))}
          </section>

          {/* Personal */}
          <section>
            <SectionTitle>Personal Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Full Name"><Inp value={form.full_name || ''} onChange={e => set('full_name', e.target.value)}/></F>
              <F label="Father's Name"><Inp value={form.father_name || ''} onChange={e => set('father_name', e.target.value)}/></F>
              <F label="CNIC"><Inp value={form.cnic_number || ''} onChange={e => set('cnic_number', e.target.value)}/></F>
              <F label="Date of Birth"><Inp type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)}/></F>
              <F label="Gender">
                <select value={form.gender || ''} onChange={e => set('gender', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm">
                  <option value="">—</option><option value="male">Male</option><option value="female">Female</option>
                </select>
              </F>
              <F label="Marital Status">
                <select value={form.marital_status || ''} onChange={e => set('marital_status', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm">
                  <option value="">—</option>
                  <option value="single">Single</option><option value="married">Married</option>
                  <option value="divorced">Divorced</option><option value="widowed">Widowed</option>
                </select>
              </F>
            </div>
          </section>

          {/* Contact */}
          <section>
            <SectionTitle>Contact Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Personal Number"><Inp value={form.personal_number || ''} onChange={e => set('personal_number', e.target.value)}/></F>
              <F label="Father's Number"><Inp value={form.father_number || ''} onChange={e => set('father_number', e.target.value)}/></F>
              <F label="Emergency Contact"><Inp value={form.emergency_number || ''} onChange={e => set('emergency_number', e.target.value)}/></F>
              <F label="Personal Email"><Inp type="email" value={form.personal_email || ''} onChange={e => set('personal_email', e.target.value)}/></F>
              <F label="Address" full><TA rows={2} value={form.address || ''} onChange={e => set('address', e.target.value)}/></F>
              <F label="City"><Inp value={form.city || ''} onChange={e => set('city', e.target.value)}/></F>
            </div>
          </section>

          {/* Spouse (if applicable) */}
          {form.gender === 'female' && form.marital_status === 'married' && (
            <section>
              <SectionTitle>Husband Details</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Husband's Name"><Inp value={form.husband_name || ''} onChange={e => set('husband_name', e.target.value)}/></F>
                <F label="Profession"><Inp value={form.husband_profession || ''} onChange={e => set('husband_profession', e.target.value)}/></F>
                <F label="Contact Number"><Inp value={form.husband_number || ''} onChange={e => set('husband_number', e.target.value)}/></F>
              </div>
            </section>
          )}

          {/* Employment */}
          <section>
            <SectionTitle>Employment Details</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Position"><Inp value={form.position || ''} onChange={e => set('position', e.target.value)}/></F>
              <F label="Department"><Inp value={form.department || ''} onChange={e => set('department', e.target.value)}/></F>
              <F label="Date of Training"><Inp value={form.date_of_training || ''} onChange={e => set('date_of_training', e.target.value)}/></F>
              <F label="Joining / Payroll Date"><Inp type="date" value={form.joining_date || ''} onChange={e => set('joining_date', e.target.value)}/></F>
            </div>
          </section>

          {/* Banking */}
          <section>
            <SectionTitle>Banking</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Bank">
                <select value={form.bank_name || ''} onChange={e => set('bank_name', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm">
                  <option value="">— Select bank —</option>
                  {PAKISTANI_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </F>
              <F label="Branch"><Inp value={form.bank_branch || ''} onChange={e => set('bank_branch', e.target.value)}/></F>
              <F label="Account Title"><Inp value={form.account_title || ''} onChange={e => set('account_title', e.target.value)}/></F>
              <F label="Account Number"><Inp value={form.account_number || ''} onChange={e => set('account_number', e.target.value)}/></F>
              <F label="IBAN" full><Inp value={form.iban || ''} onChange={e => set('iban', e.target.value)}/></F>
            </div>
          </section>

          {showReqBox && (
            <section className="rounded-xl p-3 space-y-2"
                     style={{ background:'rgba(251,146,60,0.08)',
                              border:'1px solid rgba(251,146,60,0.2)' }}>
              <div className="text-orange-400 text-xs font-semibold uppercase tracking-widest">
                What needs to change?
              </div>
              <TA rows={3} value={reqNotes} onChange={e => setReqNotes(e.target.value)}
                  placeholder="Tell the employee what to update…"/>
              <div className="flex gap-2">
                <button onClick={handleRequestChanges} disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-50"
                  style={{ background:'rgba(251,146,60,0.5)' }}>
                  Send Request
                </button>
                <button onClick={() => setShowReqBox(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-300">
                  Cancel
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 flex-wrap gap-2">
          <div className="flex gap-2">
            <button onClick={handleDownload}
              className="px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
              style={{ background:'rgba(255,255,255,0.04)' }}>
              <HiOutlineDownload className="w-4 h-4"/> Download PDF
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              style={{ background:'rgba(255,255,255,0.05)', color:'#cbd5e1' }}>
              <HiOutlinePencil className="w-4 h-4"/> Save Changes
            </button>
            <button onClick={() => setShowReqBox(true)} disabled={saving || form.status === 'changes_requested'}
              className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              style={{ background:'rgba(251,146,60,0.2)', color:'#fb923c', border:'1px solid rgba(251,146,60,0.3)' }}>
              <HiOutlineRefresh className="w-4 h-4"/> Request Changes
            </button>
            <button onClick={handleApprove} disabled={saving || form.status === 'approved'}
              className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: BRAND, color: '#0f172a' }}>
              <HiOutlineCheck className="w-4 h-4"/>
              {form.status === 'approved' ? 'Approved' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }}/>
      <div className="text-[10px] font-semibold uppercase tracking-widest"
           style={{ color: BRAND }}>{children}</div>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }}/>
    </div>
  )
}
