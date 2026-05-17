import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HiOutlineX, HiOutlineDownload, HiOutlineSave, HiOutlineEye, HiOutlinePencil } from 'react-icons/hi'
import toast from 'react-hot-toast'
import api from '../../api/client'
import LetterPreview, { LetterHeader, LetterBody, LetterFooter } from './LetterPreview'
import { DOC_LABEL, DOC_FIELDS, buildBody, calcDuration } from './documentTemplates'
import { downloadLetterPDF, buildFilename } from './pdfGenerator'

const todayISO = () => new Date().toISOString().slice(0, 10)

// labels for editable extra fields
const FIELD_LABELS = {
  joining_date:      'Joining Date',
  last_working_date: 'Last Working Date',
  duration_text:     'Service Duration',
  designation:       'Designation',
  department:        'Department',
  gross_salary:      'Gross Monthly Salary',
  reference_purpose: 'Reference Purpose / Context',
  addressed_to:      'Addressed To / Purpose',
  new_designation:   'New Designation',
  new_salary:        'New Gross Salary',
  effective_date:    'Effective Date',
  warning_reason:    'Reason / Details',
  internship_start:  'Internship Start',
  internship_end:    'Internship End',
  resignation_date:  'Resignation Submitted On',
  // Offer / probation extras
  salary_range:      'Salary Range After Training',
  training_days:     'Training Period',
  working_hours:     'Working Hours',
  // Bank / salary certificate extras
  bank_name:         'Bank Name',
  bank_branch:       'Bank Branch',
  cnic_no:           'CNIC Number',
  cnic:              'CNIC Number',
  // Penalty notice extras
  penalty_month:     'Penalty Month',
  penalty_amount:    'Penalty Amount (PKR)',
  penalty_reason:    'Penalty Reason',
}

const DATE_FIELDS = new Set([
  'joining_date','last_working_date','effective_date',
  'internship_start','internship_end','resignation_date',
])
const NUM_FIELDS  = new Set(['gross_salary','new_salary','penalty_amount'])
const LONG_FIELDS = new Set(['reference_purpose','warning_reason','addressed_to','penalty_reason'])

export default function DocumentGeneratorModal({ employee, docType, onClose, onSaved }) {
  const [ctx, setCtx]         = useState(null)   // server-loaded employee context
  const [form, setForm]       = useState({})
  const [body, setBody]       = useState('')
  const [notes, setNotes]     = useState('')
  const [issueDate, setIssue] = useState(todayISO())
  const [bodyEdited, setBE]   = useState(false)
  const [tab, setTab]         = useState('edit')
  const [saving, setSaving]   = useState(false)

  // ── Signature & stamp ─────────────────────────────────────────────────────
  // Lists are loaded from /api/letterhead/?kind=signature & ?kind=stamp.
  // `id` of selected asset; null = "none / no image", which is still allowed
  // (the printed name + handwritten signature space remain).
  const [signatures, setSignatures] = useState([])
  const [stamps, setStamps]         = useState([])
  const [includeSignature, setIncludeSignature] = useState(true)
  const [includeStamp,     setIncludeStamp]     = useState(true)
  const [signatureId, setSignatureId] = useState(null)
  const [stampId,     setStampId]     = useState(null)

  // Editable signatory line — pre-fills from the chosen signature asset's
  // metadata when one is picked, but operator can override per-document.
  const [sigName,  setSigName]  = useState('Muhammad Muaaz Hasni')
  const [sigTitle, setSigTitle] = useState('HR Manager')
  const [sigEmail, setSigEmail] = useState('hr@bitnextechnologies.com')

  // ── 1. Load employee context (salary, joining etc.) ───────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/documents/employee-context/', { params: { employee: employee.id } })
        setCtx(data)
        // pre-fill form with sensible defaults
        const dur = calcDuration(data.joining_date)
        setForm({
          joining_date:      data.joining_date || '',
          designation:       data.designation || '',
          department:        data.department || '',
          gross_salary:      data.gross_salary || 0,
          duration_text:     dur.text,
          last_working_date: '',
          new_designation:   '',
          new_salary:        data.gross_salary || 0,
          effective_date:    todayISO(),
          warning_reason:    '',
          internship_start:  data.joining_date || '',
          internship_end:    todayISO(),
          resignation_date:  todayISO(),
          reference_purpose: '',
          addressed_to:      '',
          // Offer / probation defaults (match the Bitnex sample)
          salary_range:      'PKR 40,000 to 50,000',
          training_days:     '5 to 7 days',
          working_hours:     '5:00 PM to 2:00 AM',
          // Bank / salary cert defaults
          bank_name:         '',
          bank_branch:       '',
          cnic_no:           '',
          cnic:              '',
          // Penalty notice defaults
          penalty_month:     new Date().toLocaleString('en-US',{month:'long',year:'numeric'}),
          penalty_amount:    500,
          penalty_reason:    '',
        })
      } catch { toast.error('Failed to load employee data') }
    })()
  }, [employee.id])

  // ── Load signature + stamp asset lists ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [sigRes, stampRes] = await Promise.all([
          api.get('/letterhead/', { params: { kind: 'signature' } }),
          api.get('/letterhead/', { params: { kind: 'stamp' } }),
        ])
        const sigs   = sigRes.data.results   || sigRes.data   || []
        const stmps  = stampRes.data.results || stampRes.data || []
        setSignatures(sigs)
        setStamps(stmps)
        // Auto-pick the default of each kind, if any
        const defSig = sigs.find(a => a.is_default)
        const defStp = stmps.find(a => a.is_default)
        if (defSig) {
          setSignatureId(defSig.id)
          if (defSig.signatory_name)  setSigName(defSig.signatory_name)
          if (defSig.signatory_title) setSigTitle(defSig.signatory_title)
          if (defSig.signatory_email) setSigEmail(defSig.signatory_email)
        }
        if (defStp) setStampId(defStp.id)
      } catch {
        // letterhead module is non-fatal — just leave dropdowns empty
      }
    })()
  }, [])

  // When user picks a different signature, pre-fill the signatory line from
  // that asset's metadata (if it has any). They can still type over it.
  useEffect(() => {
    const a = signatures.find(s => s.id === signatureId)
    if (!a) return
    if (a.signatory_name)  setSigName(a.signatory_name)
    if (a.signatory_title) setSigTitle(a.signatory_title)
    if (a.signatory_email) setSigEmail(a.signatory_email)
  }, [signatureId, signatures])

  // ── 2. Recompute body when inputs change (unless user edited it) ──────────
  const fields = DOC_FIELDS[docType] || []
  useEffect(() => {
    if (!ctx || bodyEdited) return
    const merged = {
      ...ctx,
      ...form,
      issue_date: issueDate,
      full_name: ctx.full_name,
      employee_id: ctx.employee_id,
    }
    setBody(buildBody(docType, merged))
  }, [ctx, form, issueDate, docType, bodyEdited])

  // recompute service duration whenever joining/last working changes
  useEffect(() => {
    if (!ctx) return
    if (fields.includes('duration_text')) {
      const dur = calcDuration(form.joining_date, form.last_working_date || issueDate)
      setForm(p => ({ ...p, duration_text: dur.text }))
    }
  }, [form.joining_date, form.last_working_date, issueDate, ctx, docType])

  const selectedSignature = useMemo(
    () => signatures.find(s => s.id === signatureId) || null,
    [signatures, signatureId]
  )
  const selectedStamp = useMemo(
    () => stamps.find(s => s.id === stampId) || null,
    [stamps, stampId]
  )

  const docDraft = useMemo(() => ({
    doc_type: docType,
    title: DOC_LABEL[docType],
    issue_date: issueDate,
    notes,
    // Letterhead controls
    include_signature: includeSignature,
    include_stamp:     includeStamp,
    signature_image_url: includeSignature ? (selectedSignature?.image_url || '') : '',
    stamp_image_url:     includeStamp     ? (selectedStamp?.image_url     || '') : '',
    data: {
      ...form,
      body,
      employee_id: ctx?.employee_id,
      full_name: ctx?.full_name,
      department: form.department || ctx?.department,
      designation: form.designation || ctx?.designation,
      signatory_name:  sigName,
      signatory_title: sigTitle,
      signatory_email: sigEmail,
    },
  }), [
    docType, issueDate, notes, form, body, ctx,
    includeSignature, includeStamp, selectedSignature, selectedStamp,
    sigName, sigTitle, sigEmail,
  ])

  const handleSave = async (alsoDownload = false) => {
    setSaving(true)
    try {
      await api.post('/documents/', { ...docDraft, employee: employee.id })
      toast.success('Document saved to history')
      onSaved?.()
      if (alsoDownload) await doDownload()
      else onClose()
    } catch {
      toast.error('Failed to save document')
    } finally { setSaving(false) }
  }

  // ── Generate and download a real .pdf file ────────────────────────────────
  // Filename: {employee_name}_{doc_type}.pdf, e.g. Ali_Khan_experience_letter.pdf
  const doDownload = async () => {
    const filename = buildFilename(ctx?.full_name || employee.username || 'document', docType)
    const toastId = toast.loading('Generating PDF…')
    try {
      await downloadLetterPDF({
        filename,
        renderHeader: (host) => new Promise((resolve) => {
          const root = createRoot(host)
          root.render(<LetterHeader/>)
          // Two frames to be sure layout settled before snapshot.
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        }),
        renderBody: (host) => new Promise((resolve) => {
          const root = createRoot(host)
          root.render(<LetterBody doc={docDraft} forPdf/>)
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        }),
        renderFooter: (host, pageNum, totalPages) => new Promise((resolve) => {
          const root = createRoot(host)
          root.render(<LetterFooter pageNum={pageNum} totalPages={totalPages}/>)
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        }),
      })
      toast.success('PDF downloaded', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF', { id: toastId })
    }
  }

  // ── Render field input by type ────────────────────────────────────────────
  const renderField = (k) => {
    const v = form[k] ?? ''
    if (LONG_FIELDS.has(k)) return (
      <textarea rows={3} className="input" value={v}
        onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}/>
    )
    return (
      <input
        type={DATE_FIELDS.has(k) ? 'date' : NUM_FIELDS.has(k) ? 'number' : 'text'}
        className="input" value={v}
        onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}/>
    )
  }

  if (!ctx) return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
           style={{ borderColor:'rgba(68,189,178,0.2)', borderTopColor:'#44BDB2' }}/>
    </div>
  )

  return (
    <>
      {/* ── Print-only container — only this prints ─────────────────────── */}
      <div id="print-root" className="print-only">
        <LetterPreview doc={docDraft} printable/>
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <div className="screen-only fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
        <div className="glass-light rounded-3xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
            <div>
              <h3 className="font-display font-bold text-white text-lg">{DOC_LABEL[docType]}</h3>
              <p className="text-slate-500 text-xs">For {ctx.full_name} · {ctx.designation || '—'}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <HiOutlineX className="w-5 h-5"/>
            </button>
          </div>

          {/* Mobile tabs */}
          <div className="lg:hidden flex border-b border-white/5 flex-shrink-0">
            {[['edit', HiOutlinePencil, 'Edit'], ['preview', HiOutlineEye, 'Preview']].map(([k, Ic, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  tab === k ? 'border-b-2' : 'text-slate-500'
                }`}
                style={tab === k ? { color: '#44BDB2', borderColor: '#44BDB2' } : undefined}>
                <Ic className="w-4 h-4"/> {l}
              </button>
            ))}
          </div>

          {/* Body — split view */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] overflow-hidden">
            {/* ── Left: Edit form ─────────────────────────────────────── */}
            <div className={`${tab === 'edit' ? '' : 'hidden lg:block'} overflow-y-auto p-5 space-y-4 border-r border-white/5`}>
              {/* Employee summary (read-only) */}
              <div className="glass rounded-xl p-3 text-xs">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div><span className="text-slate-500">Name:</span> <span className="text-white">{ctx.full_name}</span></div>
                  <div><span className="text-slate-500">ID:</span> <span className="text-white">{ctx.employee_id}</span></div>
                  <div><span className="text-slate-500">Dept:</span> <span className="text-white">{ctx.department || '—'}</span></div>
                  <div><span className="text-slate-500">Role:</span> <span className="text-white">{ctx.designation || '—'}</span></div>
                </div>
              </div>

              {/* Issue date */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Issue Date</label>
                <input type="date" className="input" value={issueDate} onChange={e => setIssue(e.target.value)}/>
              </div>

              {/* Dynamic fields */}
              {fields.map(k => (
                <div key={k}>
                  <label className="block text-xs text-slate-400 mb-1.5">{FIELD_LABELS[k] || k}</label>
                  {renderField(k)}
                </div>
              ))}

              {/* ── Signature & Stamp ──────────────────────────────────── */}
              <div className="glass rounded-xl p-4 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Signature & Stamp
                </div>

                {/* Signature toggle + picker */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-teal-400"
                      style={{ accentColor: '#44BDB2' }}
                      checked={includeSignature}
                      onChange={e => setIncludeSignature(e.target.checked)}/>
                    <span className="text-sm text-white">Include signature</span>
                  </label>
                  {includeSignature && (
                    <select className="input text-sm"
                      value={signatureId || ''}
                      onChange={e => setSignatureId(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">— No signature image (printed name only) —</option>
                      {signatures.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}{s.is_default ? '  ★ default' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {includeSignature && signatures.length === 0 && (
                    <p className="text-[11px] text-slate-500">
                      No signatures uploaded yet. Go to Settings → Letterhead Assets to upload one.
                    </p>
                  )}
                </div>

                {/* Stamp toggle + picker */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4"
                      style={{ accentColor: '#44BDB2' }}
                      checked={includeStamp}
                      onChange={e => setIncludeStamp(e.target.checked)}/>
                    <span className="text-sm text-white">Include company stamp</span>
                  </label>
                  {includeStamp && (
                    <select className="input text-sm"
                      value={stampId || ''}
                      onChange={e => setStampId(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">— No stamp —</option>
                      {stamps.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.label}{s.is_default ? '  ★ default' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {includeStamp && stamps.length === 0 && (
                    <p className="text-[11px] text-slate-500">
                      No stamps uploaded yet. Go to Settings → Letterhead Assets to upload one.
                    </p>
                  )}
                </div>

                {/* Editable signatory line */}
                {includeSignature && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[11px] text-slate-500">Signatory shown on letter:</div>
                    <input className="input text-sm" placeholder="Signatory Name"
                      value={sigName}  onChange={e => setSigName(e.target.value)}/>
                    <input className="input text-sm" placeholder="Title (e.g. HR Manager)"
                      value={sigTitle} onChange={e => setSigTitle(e.target.value)}/>
                    <input className="input text-sm" placeholder="Signatory Email" type="email"
                      value={sigEmail} onChange={e => setSigEmail(e.target.value)}/>
                  </div>
                )}
              </div>

              {/* Custom body editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-400">Letter Body {bodyEdited && <span style={{ color: '#44BDB2' }} className="ml-1">· edited</span>}</label>
                  {bodyEdited && (
                    <button type="button" onClick={() => setBE(false)}
                      className="text-[11px] text-slate-500 hover:text-teal-400"
                      style={{}}>
                      Reset to template
                    </button>
                  )}
                </div>
                <textarea rows={10} className="input font-mono text-xs leading-relaxed"
                  value={body}
                  onChange={e => { setBody(e.target.value); setBE(true) }}/>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes / Remarks (optional)</label>
                <textarea rows={2} className="input" value={notes} onChange={e => setNotes(e.target.value)}/>
              </div>
            </div>

            {/* ── Right: Preview ──────────────────────────────────────── */}
            <div className={`${tab === 'preview' ? '' : 'hidden lg:block'} overflow-y-auto p-4 lg:p-6`}
                 style={{ background: '#1a1f2e' }}>
              <LetterPreview doc={docDraft}/>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 flex-shrink-0 flex-wrap gap-2">
            <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
            <div className="flex gap-2 flex-wrap">
              <button onClick={doDownload} disabled={saving}
                className="btn-ghost text-sm px-4 py-2 flex items-center gap-2">
                <HiOutlineDownload className="w-4 h-4"/> Download PDF
              </button>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="btn-ghost text-sm px-4 py-2 flex items-center gap-2">
                <HiOutlineSave className="w-4 h-4"/> Save Only
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <HiOutlineDownload className="w-4 h-4"/> Save &amp; Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
