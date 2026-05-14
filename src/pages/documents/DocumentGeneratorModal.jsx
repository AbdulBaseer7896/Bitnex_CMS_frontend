import { useEffect, useMemo, useState } from 'react'
import { HiOutlineX, HiOutlinePrinter, HiOutlineSave, HiOutlineEye, HiOutlinePencil } from 'react-icons/hi'
import toast from 'react-hot-toast'
import api from '../../api/client'
import LetterPreview from './LetterPreview'
import { DOC_LABEL, DOC_FIELDS, buildBody, calcDuration } from './documentTemplates'

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
}

const DATE_FIELDS = new Set([
  'joining_date','last_working_date','effective_date',
  'internship_start','internship_end','resignation_date',
])
const NUM_FIELDS  = new Set(['gross_salary','new_salary'])
const LONG_FIELDS = new Set(['reference_purpose','warning_reason','addressed_to'])

export default function DocumentGeneratorModal({ employee, docType, onClose, onSaved }) {
  const [ctx, setCtx]         = useState(null)   // server-loaded employee context
  const [form, setForm]       = useState({})
  const [body, setBody]       = useState('')
  const [notes, setNotes]     = useState('')
  const [issueDate, setIssue] = useState(todayISO())
  const [bodyEdited, setBE]   = useState(false)
  const [tab, setTab]         = useState('edit')
  const [saving, setSaving]   = useState(false)

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
        })
      } catch { toast.error('Failed to load employee data') }
    })()
  }, [employee.id])

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

  const docDraft = useMemo(() => ({
    doc_type: docType,
    title: DOC_LABEL[docType],
    issue_date: issueDate,
    notes,
    data: {
      ...form,
      body,
      employee_id: ctx?.employee_id,
      full_name: ctx?.full_name,
      department: form.department || ctx?.department,
      designation: form.designation || ctx?.designation,
    },
  }), [docType, issueDate, notes, form, body, ctx])

  const handleSave = async (alsoPrint = false) => {
    setSaving(true)
    try {
      await api.post('/documents/', { ...docDraft, employee: employee.id })
      toast.success('Document saved to history')
      onSaved?.()
      if (alsoPrint) doPrint()
      else onClose()
    } catch {
      toast.error('Failed to save document')
    } finally { setSaving(false) }
  }

  const doPrint = () => {
    document.body.classList.add('printing-letter')
    setTimeout(() => {
      window.print()
      setTimeout(() => document.body.classList.remove('printing-letter'), 300)
    }, 60)
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
           style={{ borderColor:'rgba(249,115,22,0.2)', borderTopColor:'#f97316' }}/>
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
                  tab === k ? 'text-orange-400 border-b-2 border-orange-500' : 'text-slate-500'
                }`}>
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

              {/* Custom body editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-400">Letter Body {bodyEdited && <span className="text-orange-400 ml-1">· edited</span>}</label>
                  {bodyEdited && (
                    <button type="button" onClick={() => setBE(false)}
                      className="text-[11px] text-slate-500 hover:text-orange-400">
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
              <button onClick={doPrint} disabled={saving}
                className="btn-ghost text-sm px-4 py-2 flex items-center gap-2">
                <HiOutlinePrinter className="w-4 h-4"/> Preview Print
              </button>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="btn-ghost text-sm px-4 py-2 flex items-center gap-2">
                <HiOutlineSave className="w-4 h-4"/> Save Only
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                <HiOutlinePrinter className="w-4 h-4"/> Save & Download / Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
