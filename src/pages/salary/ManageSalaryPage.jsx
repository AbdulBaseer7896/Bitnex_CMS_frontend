import { useEffect, useState, useMemo, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineDownload, HiOutlineX,
  HiOutlineCheck, HiOutlineCurrencyDollar, HiOutlineCash,
  HiOutlineUsers, HiOutlineCalendar, HiOutlineExclamation,
  HiOutlineFilter, HiOutlinePlus, HiOutlineMinus, HiOutlineSparkles,
  HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineRefresh,
  HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight,
  HiOutlineAdjustments, HiOutlineDotsHorizontal,
} from 'react-icons/hi'

const ORANGE = '#f97316'
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STATUS_BADGE = {
  paid:           { label:'Paid',          cls:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',          icon:'✓' },
  generated:      { label:'Pending',       cls:'bg-amber-500/15 text-amber-400 border-amber-500/20',                icon:'⏳' },
  draft:          { label:'Draft',         cls:'bg-sky-500/15 text-sky-400 border-sky-500/20',                       icon:'•' },
  not_generated:  { label:'Not Generated', cls:'bg-slate-500/15 text-slate-400 border-slate-500/20',                 icon:'—' },
  no_structure:   { label:'No Structure',  cls:'bg-red-500/15 text-red-400 border-red-500/20',                       icon:'!' },
}

const fmtPKR = v => 'PKR ' + Number(v||0).toLocaleString('en-PK', { maximumFractionDigits: 0 })
const fmtCompact = v => {
  const n = Number(v||0)
  if (n >= 1_000_000) return '₨' + (n/1_000_000).toFixed(1).replace(/\.0$/,'') + 'M'
  if (n >= 1_000)     return '₨' + (n/1_000).toFixed(0) + 'k'
  return '₨' + n
}

// ─────────────────────────────────────────────────────────────────────────────
// Period picker (month + year)
// ─────────────────────────────────────────────────────────────────────────────
function PeriodPicker({ month, year, onChange }) {
  const prev = () => {
    let m = month - 1, y = year
    if (m < 1) { m = 12; y -= 1 }
    onChange(m, y)
  }
  const next = () => {
    let m = month + 1, y = year
    if (m > 12) { m = 1; y += 1 }
    onChange(m, y)
  }
  const now = new Date()
  const isCurrent = month === now.getMonth()+1 && year === now.getFullYear()
  return (
    <div className="flex items-center gap-1.5 glass rounded-xl p-1 select-none">
      <button onClick={prev} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
        <HiOutlineChevronLeft className="w-4 h-4"/>
      </button>
      <div className="px-3 py-1 flex items-center gap-2">
        <HiOutlineCalendar className="w-4 h-4" style={{ color: ORANGE }}/>
        <span className="text-white font-semibold text-sm min-w-[120px] text-center">
          {MONTHS[month-1]} {year}
        </span>
        {isCurrent && (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                style={{ background:'rgba(249,115,22,0.12)', color:ORANGE }}>
            Current
          </span>
        )}
      </div>
      <button onClick={next} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
        <HiOutlineChevronRight className="w-4 h-4"/>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Cards row
// ─────────────────────────────────────────────────────────────────────────────
function KPIRow({ summary, period }) {
  const tiles = [
    {
      label:'Total Payroll',
      value: fmtPKR(summary?.total_payroll || 0),
      sub: `${summary?.total_employees || 0} employees`,
      color: ORANGE,
      icon: HiOutlineCurrencyDollar,
    },
    {
      label:'Paid',
      value: fmtPKR(summary?.total_paid || 0),
      sub: `${summary?.paid_count || 0} slips paid`,
      color: '#10b981',
      icon: HiOutlineCheck,
    },
    {
      label:'Pending',
      value: fmtPKR(summary?.total_pending || 0),
      sub: `${summary?.pending_count || 0} pending`,
      color: '#eab308',
      icon: HiOutlineCash,
    },
    {
      label:'Adjustments',
      value: '+' + fmtPKR(summary?.total_bonus || 0),
      sub: '− ' + fmtPKR(summary?.total_deductions || 0),
      color: '#8b5cf6',
      icon: HiOutlineSparkles,
    },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map(t => (
        <div key={t.label} className="glass rounded-2xl p-4 transition-colors hover:border-orange-500/20"
             style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-start justify-between mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background:t.color+'15', border:'1px solid '+t.color+'25' }}>
              <t.icon className="w-4 h-4" style={{ color:t.color }}/>
            </div>
          </div>
          <div className="font-display text-xl lg:text-2xl font-bold text-white truncate" title={t.value}>
            {t.value}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">{t.label}</div>
          <div className="text-slate-600 text-[11px] mt-1">{t.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Adjustment Modal — bonus, extra payment, deductions, remarks
// ─────────────────────────────────────────────────────────────────────────────
function AdjustModal({ row, month, year, onClose, onSaved }) {
  const [form, setForm] = useState({
    bonus: row.bonus || 0,
    extra_payment: row.extra_payment || 0,
    penalty_deduction: row.penalty_deduction || 0,
    leave_deduction: row.leave_deduction || 0,
    unpaid_leave_days: row.unpaid_leave_days || 0,
    remarks: row.remarks || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k,v) => setForm(p => ({...p, [k]: v}))

  const baseNet = Number(row.base_net || 0)
  const computed = baseNet
    + Number(form.bonus||0) + Number(form.extra_payment||0)
    - Number(form.penalty_deduction||0) - Number(form.leave_deduction||0)

  const ensureSlip = async () => {
    if (row.slip_id) return row.slip_id
    // Create draft slip from current structure
    const { data } = await api.post('/salary/slips/', {
      employee: row.employee_id,
      salary_structure: null, // backend will resolve via employee
      month, year,
      bonus: form.bonus, extra_payment: form.extra_payment,
      penalty_deduction: form.penalty_deduction,
      leave_deduction: form.leave_deduction,
      unpaid_leave_days: form.unpaid_leave_days,
      remarks: form.remarks,
    })
    return data.id
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      let slipId = row.slip_id
      if (!slipId) {
        slipId = await ensureSlip()
      } else {
        await api.patch(`/salary/slips/${slipId}/adjust/`, form)
      }
      toast.success('Adjustments saved')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const numField = (label, k, icon, color, help) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-${color || 'slate'}-400 text-xs font-bold`}>{icon}</span>
        <input type="number" min="0" step="any" className="input pl-8 py-2.5 text-sm"
               value={form[k]} onChange={e=>f(k, e.target.value)}/>
      </div>
      {help && <div className="text-slate-600 text-[10px] mt-1">{help}</div>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl w-full max-w-2xl animate-slide-up my-4">
        {/* Header */}
        <div className="p-6 pb-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg flex-shrink-0"
                   style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                {row.employee_name?.[0]?.toUpperCase() || 'E'}
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg">{row.employee_name}</h3>
                <p className="text-slate-500 text-xs">{row.designation || row.department || 'Employee'} · {MONTHS[month-1]} {year}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <HiOutlineX className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="p-6 space-y-5">
            {/* Base net summary */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs">Base Net (from structure)</div>
                  <div className="font-display font-bold text-white text-xl mt-0.5">{fmtPKR(baseNet)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-xs">After adjustments</div>
                  <div className="font-display font-bold text-2xl mt-0.5" style={{ color: ORANGE }}>{fmtPKR(computed)}</div>
                </div>
              </div>
            </div>

            {/* Bonuses */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiOutlinePlus className="w-4 h-4 text-emerald-400"/>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Add Payments</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {numField('Performance Bonus', 'bonus',         '+', 'emerald', 'Reward / KPI bonus')}
                {numField('Extra Payment',     'extra_payment', '+', 'emerald', 'Reimbursements, OT, etc.')}
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineMinus className="w-4 h-4 text-red-400"/>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Apply Deductions</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {numField('Penalty',         'penalty_deduction', '−', 'red', 'Late mark / fine')}
                {numField('Leave Deduction', 'leave_deduction',   '−', 'red', 'Unpaid leave amount')}
                {numField('Unpaid Days',     'unpaid_leave_days', 'd', 'red', 'For reference')}
              </div>
            </div>

            {/* Leave context */}
            {(row.leave_days_taken > 0 || row.pending_leaves > 0) && (
              <div className="glass rounded-xl p-3 flex items-center gap-3" style={{ borderLeft:'3px solid '+ORANGE }}>
                <HiOutlineCalendar className="w-5 h-5" style={{ color: ORANGE }}/>
                <div className="text-xs text-slate-300">
                  This employee had <span className="font-bold text-white">{row.leave_days_taken}</span> day(s) of approved leave in {MONTHS[month-1]}
                  {row.unpaid_leaves_taken > 0 && (
                    <> · <span className="text-red-400 font-bold">{row.unpaid_leaves_taken}</span> unpaid</>
                  )}
                  {row.pending_leaves > 0 && (
                    <> · <span className="text-amber-400 font-bold">{row.pending_leaves}</span> pending request(s)</>
                  )}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Remarks / Notes
              </label>
              <textarea rows={2} className="input text-sm resize-none"
                        placeholder="e.g. Eid bonus, festival reward, etc."
                        value={form.remarks} onChange={e=>f('remarks', e.target.value)}/>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 flex gap-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <button type="button" onClick={onClose} className="flex-1 btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Adjustments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Mark Paid confirmation
// ─────────────────────────────────────────────────────────────────────────────
function BulkPayModal({ rows, period, onClose, onConfirm }) {
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0,10))
  const [busy, setBusy] = useState(false)
  const total = rows.reduce((s,r) => s + Number(r.net_payable||0), 0)

  const run = async () => {
    setBusy(true)
    try {
      await onConfirm(paidDate)
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white text-lg">Confirm Bulk Payment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-5 h-5"/>
          </button>
        </div>

        <div className="glass rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-slate-400 text-sm">Employees</span>
            <span className="text-white font-semibold">{rows.length}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-slate-400 text-sm">Period</span>
            <span className="text-white font-semibold">{period}</span>
          </div>
          <div className="flex justify-between pt-2" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-white font-semibold">Total to mark paid</span>
            <span className="font-display font-bold text-xl" style={{ color: ORANGE }}>{fmtPKR(total)}</span>
          </div>
        </div>

        <label className="block text-xs text-slate-500 mb-1.5">Payment Date</label>
        <input type="date" className="input mb-4" value={paidDate} onChange={e=>setPaidDate(e.target.value)}/>

        <div className="max-h-40 overflow-y-auto mb-4 glass rounded-xl p-2 space-y-1">
          {rows.slice(0,8).map(r => (
            <div key={r.employee_id} className="flex justify-between text-xs py-1 px-2">
              <span className="text-slate-300 truncate">{r.employee_name}</span>
              <span className="text-slate-500">{fmtCompact(r.net_payable)}</span>
            </div>
          ))}
          {rows.length > 8 && (
            <div className="text-center text-slate-600 text-[11px] pt-1">+ {rows.length-8} more</div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-ghost text-sm">Cancel</button>
          <button onClick={run} disabled={busy} className="flex-1 btn-primary text-sm disabled:opacity-50">
            {busy ? 'Processing…' : 'Mark All Paid'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF generator (re-used from original)
// ─────────────────────────────────────────────────────────────────────────────
function generateSlipHTML(slip, employee, structure, company) {
  const gross   = Number(structure?.gross_salary || slip.gross_salary || 0)
  const net     = Number(slip.net_payable || 0)
  const bonus   = Number(slip.bonus || 0) + Number(slip.extra_payment || 0)
  const penalty = Number(slip.penalty_deduction || 0) + Number(slip.leave_deduction || 0)
  const month   = MONTHS[(slip.month||1)-1]
  const logo    = `<div style="font-size:26px;font-weight:900;color:#f97316;letter-spacing:-1px;">BITNEX</div>`
  const row = (l,v,cls='')=>`<tr><td style="padding:8px 0;color:#64748b;font-size:13px">${l}</td><td style="padding:8px 0;text-align:right;font-weight:600;font-size:13px;color:${cls||'#1e293b'}">${v}</td></tr>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#1e293b}
  .slip{max-width:720px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 60px rgba(0,0,0,0.15)}
  .hdr{background:linear-gradient(135deg,#0e1420 0%,#1e293b 60%,#0e1420 100%);padding:28px 36px;display:flex;align-items:flex-start;justify-content:space-between}
  .co-name{font-size:22px;font-weight:800;color:#f97316;margin:6px 0 2px}
  .slip-badge{text-align:right}
  .slip-badge h2{color:#fff;font-size:20px;font-weight:700;letter-spacing:2px}
  .paid-tag{display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700}
  .emp-bar{display:grid;grid-template-columns:repeat(3,1fr);background:#f8fafc;border-bottom:1px solid #e2e8f0}
  .emp-cell{padding:18px 24px;border-right:1px solid #e2e8f0}
  .emp-cell:last-child{border-right:none}
  .emp-label{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:700;margin-bottom:4px}
  .emp-val{font-size:14px;font-weight:700;color:#1e293b}
  .body{padding:28px 36px}
  .section{margin-bottom:20px}
  .section-hdr{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f1f5f9}
  .section-title{font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b}
  table.rows{width:100%;border-collapse:collapse}
  .subtotal{background:#f8fafc;padding:10px 14px;border-radius:10px;display:flex;justify-content:space-between;margin-top:8px;font-weight:700}
  .net-box{background:linear-gradient(135deg,rgba(249,115,22,0.08),rgba(249,115,22,0.04));border:2px solid rgba(249,115,22,0.25);border-radius:14px;padding:22px 28px;margin:20px 0;display:flex;justify-content:space-between;align-items:center}
  .net-amount{font-size:34px;font-weight:800;color:#f97316;letter-spacing:-1px}
  .footer{padding:18px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
  @media print{body{padding:0;background:#fff}.slip{box-shadow:none;border-radius:0}}
</style></head><body>
<div class="slip">
  <div class="hdr">
    <div>${logo}<div class="co-name">${company?.name||'Bitnex Technologies'}</div></div>
    <div class="slip-badge">
      <h2>SALARY SLIP</h2>
      <p style="color:#94a3b8;font-size:11px;margin-top:4px">${month} ${slip.year}</p>
      <span class="paid-tag" style="background:${slip.status==='paid'?'rgba(16,185,129,0.15)':'rgba(234,179,8,0.15)'};color:${slip.status==='paid'?'#10b981':'#eab308'}">
        ${slip.status==='paid'?'✓ PAID':'⏳ PENDING'}
      </span>
    </div>
  </div>
  <div class="emp-bar">
    <div class="emp-cell"><div class="emp-label">Employee</div><div class="emp-val">${employee.employee_name || '—'}</div></div>
    <div class="emp-cell"><div class="emp-label">Department</div><div class="emp-val">${employee.department || '—'}</div></div>
    <div class="emp-cell"><div class="emp-label">Designation</div><div class="emp-val">${employee.designation || '—'}</div></div>
    <div class="emp-cell"><div class="emp-label">Employee ID</div><div class="emp-val">#BNX${String(employee.employee_id||0).padStart(4,'0')}</div></div>
    <div class="emp-cell"><div class="emp-label">Pay Period</div><div class="emp-val">${month} ${slip.year}</div></div>
    <div class="emp-cell"><div class="emp-label">Pay Date</div><div class="emp-val">${slip.paid_date||'—'}</div></div>
  </div>
  <div class="body">
    <div class="section">
      <div class="section-hdr"><span class="section-title">Earnings</span></div>
      <table class="rows">
        ${row('Base Net Salary', fmtPKR(employee.base_net))}
        ${bonus>0?row('Bonuses & Extra Payments', '+ ' + fmtPKR(bonus), '#10b981'):''}
      </table>
    </div>
    <div class="section">
      <div class="section-hdr"><span class="section-title">Deductions</span></div>
      <table class="rows">
        ${penalty>0?row('Penalty & Leave Deductions', '- ' + fmtPKR(penalty), '#ef4444'):row('No deductions', '—')}
      </table>
    </div>
    <div class="net-box">
      <div><div style="font-size:15px;font-weight:700">Net Payable Salary</div><div style="font-size:12px;color:#94a3b8;margin-top:3px">${slip.status==='paid'?'Paid on '+slip.paid_date:'Payment Pending'}</div></div>
      <div class="net-amount">${fmtPKR(net)}</div>
    </div>
    ${slip.remarks?`<div style="background:#f8fafc;padding:14px;border-radius:10px;border-left:3px solid #f97316;margin-top:8px"><div style="font-size:10px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">Remarks</div><div style="font-size:13px;color:#475569">${slip.remarks}</div></div>`:''}
  </div>
  <div class="footer">
    System-generated · ${company?.name||'Bitnex Technologies'} · Generated ${new Date().toLocaleDateString('en-PK')}
  </div>
</div></body></html>`
}

function downloadSlip(html) {
  const w = window.open('','_blank')
  w.document.write(html); w.document.close()
  setTimeout(()=>w.print(), 600)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function ManageSalaryPage() {
  const now = new Date()
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [data,    setData]    = useState({ summary:{}, rows:[], period_label:'' })
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [adjustRow, setAdjustRow] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [company, setCompany] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Load
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/salary/manage/?month=${month}&year=${year}`)
      setData(data)
      // Drop selections that no longer apply
      setSelected(prev => {
        const valid = new Set(data.rows.map(r => r.slip_id).filter(Boolean))
        const next = new Set()
        for (const id of prev) if (valid.has(id)) next.add(id)
        return next
      })
    } catch { toast.error('Failed to load monthly salary data') }
    finally { setLoading(false) }
  }, [month, year])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.get('/core/company-settings/').then(({data}) => setCompany(data)).catch(()=>{})
  }, [])

  // Filtered rows
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data.rows || []).filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (deptFilter !== 'all' && r.department !== deptFilter) return false
      if (q && !(
        r.employee_name?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.designation?.toLowerCase().includes(q)
      )) return false
      return true
    })
  }, [data.rows, search, statusFilter, deptFilter])

  // Department options
  const departments = useMemo(() => {
    const s = new Set()
    ;(data.rows||[]).forEach(r => r.department && s.add(r.department))
    return Array.from(s).sort()
  }, [data.rows])

  // Selectable rows (must have a slip created)
  const selectableInView = filtered.filter(r => r.slip_id && r.status !== 'paid')

  // Bulk action helpers
  const selectedRows = filtered.filter(r => selected.has(r.slip_id))
  const allInViewSelected = selectableInView.length > 0 && selectableInView.every(r => selected.has(r.slip_id))

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allInViewSelected) {
        selectableInView.forEach(r => next.delete(r.slip_id))
      } else {
        selectableInView.forEach(r => next.add(r.slip_id))
      }
      return next
    })
  }
  const toggle = (slipId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(slipId)) next.delete(slipId)
      else next.add(slipId)
      return next
    })
  }

  // Mark single paid
  const markPaid = async (row) => {
    if (!row.slip_id) {
      // Create slip first
      try {
        const { data: slip } = await api.post('/salary/slips/', {
          employee: row.employee_id, month, year, status:'generated',
        })
        await api.post(`/salary/slips/${slip.id}/mark_paid/`, {})
      } catch { return toast.error('Could not mark paid') }
    } else {
      try { await api.post(`/salary/slips/${row.slip_id}/mark_paid/`, {}) }
      catch { return toast.error('Could not mark paid') }
    }
    toast.success(`${row.employee_name}: marked paid`)
    load()
  }

  // Bulk pay
  const bulkPay = async (paidDate) => {
    const ids = selectedRows.map(r => r.slip_id).filter(Boolean)
    if (ids.length === 0) return
    try {
      const { data } = await api.post('/salary/slips/mark_paid_bulk/', { slip_ids: ids, paid_date: paidDate })
      toast.success(`Marked ${data.updated} salaries as paid`)
      setSelected(new Set())
      load()
    } catch { toast.error('Bulk action failed') }
  }

  // Generate draft slips for everyone
  const generateAll = async () => {
    setGenerating(true)
    try {
      const { data } = await api.post('/salary/manage/generate/', { month, year })
      if (data.created > 0) toast.success(`Generated ${data.created} draft slips`)
      else toast(`All slips already exist for ${MONTHS[month-1]} ${year}`)
      load()
    } catch { toast.error('Generation failed') }
    finally { setGenerating(false) }
  }

  // Download PDF
  const downloadPDF = (row) => {
    const slip = {
      id: row.slip_id, month, year, status: row.status,
      paid_date: row.paid_date, bonus: row.bonus, extra_payment: row.extra_payment,
      penalty_deduction: row.penalty_deduction, leave_deduction: row.leave_deduction,
      remarks: row.remarks, net_payable: row.net_payable, gross_salary: row.gross_salary,
    }
    downloadSlip(generateSlipHTML(slip, row, null, company))
  }

  const periodLabel = data.period_label || `${MONTHS[month-1]} ${year}`

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Manage Salary</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monthly payroll · {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodPicker month={month} year={year} onChange={(m,y)=>{ setMonth(m); setYear(y) }}/>
          <button onClick={generateAll} disabled={generating}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background:'rgba(139,92,246,0.12)', color:'#a78bfa', border:'1px solid rgba(139,92,246,0.25)' }}>
            <HiOutlineSparkles className="w-4 h-4"/>
            {generating ? 'Generating…' : 'Generate Slips'}
          </button>
          <button onClick={load} className="p-2 rounded-xl text-slate-400 hover:text-white glass">
            <HiOutlineRefresh className="w-4 h-4"/>
          </button>
        </div>
      </div>

      {/* ── KPI ─────────────────────────────────────────────────── */}
      <KPIRow summary={data.summary} period={periodLabel}/>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-3 lg:p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name, dept, designation…"
              className="input pl-9 py-2 text-sm"/>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 glass-light rounded-xl p-1">
            {[
              { id:'all',           label:'All',     count: data.rows?.length || 0 },
              { id:'paid',          label:'Paid',    count: data.summary?.paid_count || 0,    color:'#10b981' },
              { id:'generated',     label:'Pending', count: data.summary?.pending_count || 0, color:'#eab308' },
              { id:'no_structure',  label:'No Setup',count: data.summary?.no_structure_count || 0, color:'#ef4444' },
            ].map(t => (
              <button key={t.id} onClick={()=>setStatusFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === t.id ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
                style={statusFilter === t.id ? { background: 'rgba(249,115,22,0.18)', border:'1px solid rgba(249,115,22,0.3)' } : {}}>
                {t.label}
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]"
                      style={{ background:'rgba(255,255,255,0.08)', color: t.color || '#94a3b8' }}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Dept filter */}
          {departments.length > 0 && (
            <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
              className="input py-2 text-sm w-auto pr-8 cursor-pointer">
              <option value="all" className="bg-[#0d0f14]">All Departments</option>
              {departments.map(d => <option key={d} value={d} className="bg-[#0d0f14]">{d}</option>)}
            </select>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="mt-3 pt-3 flex items-center justify-between flex-wrap gap-2"
               style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-semibold">
                {selected.size} selected
              </span>
              <span className="text-slate-500 text-xs">
                Total {fmtPKR(selectedRows.reduce((s,r) => s + Number(r.net_payable||0), 0))}
              </span>
              <button onClick={()=>setSelected(new Set())}
                className="text-xs text-slate-500 hover:text-white">Clear</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setBulkConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold btn-primary">
                <HiOutlineCheck className="w-3.5 h-3.5"/>
                Mark {selected.size} Paid
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
                 style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor: ORANGE }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <HiOutlineUsers className="w-12 h-12 text-slate-700 mb-3"/>
            <h3 className="text-white font-semibold">No employees match this view</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <tr>
                  <th className="text-left px-4 py-3 w-10">
                    <input type="checkbox"
                      checked={allInViewSelected}
                      onChange={toggleAll}
                      disabled={selectableInView.length === 0}
                      className="w-4 h-4 accent-orange-500 cursor-pointer disabled:cursor-not-allowed"/>
                  </th>
                  <th className="text-left px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="text-left px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">Department</th>
                  <th className="text-right px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden lg:table-cell">Base Net</th>
                  <th className="text-right px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-emerald-500/80 hidden lg:table-cell">Bonus</th>
                  <th className="text-right px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-red-500/80 hidden lg:table-cell">Deduct</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden xl:table-cell">Leaves</th>
                  <th className="text-right px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-orange-500/90">Net Payable</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const selectable = !!r.slip_id && r.status !== 'paid'
                  const isSelected = selected.has(r.slip_id)
                  const statusInfo = STATUS_BADGE[r.status] || STATUS_BADGE.draft
                  return (
                    <tr key={r.employee_id}
                        className={`table-row-hover transition-colors ${isSelected ? 'bg-orange-500/[0.06]' : ''}`}
                        style={{ borderBottom: i === filtered.length-1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3">
                        <input type="checkbox"
                          checked={isSelected}
                          onChange={()=>toggle(r.slip_id)}
                          disabled={!selectable}
                          className="w-4 h-4 accent-orange-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"/>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow"
                               style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                            {r.employee_name?.[0]?.toUpperCase() || 'E'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-white text-sm font-medium truncate">{r.employee_name}</div>
                            <div className="text-slate-500 text-xs truncate">{r.designation || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-slate-400 text-sm hidden md:table-cell">{r.department || '—'}</td>
                      <td className="px-2 py-3 text-right text-slate-300 text-sm tabular-nums hidden lg:table-cell">
                        {fmtCompact(r.base_net)}
                      </td>
                      <td className="px-2 py-3 text-right text-sm tabular-nums hidden lg:table-cell">
                        {(r.bonus + r.extra_payment) > 0
                          ? <span className="text-emerald-400 font-medium">+{fmtCompact(r.bonus + r.extra_payment)}</span>
                          : <span className="text-slate-700">—</span>}
                      </td>
                      <td className="px-2 py-3 text-right text-sm tabular-nums hidden lg:table-cell">
                        {(r.penalty_deduction + r.leave_deduction) > 0
                          ? <span className="text-red-400 font-medium">−{fmtCompact(r.penalty_deduction + r.leave_deduction)}</span>
                          : <span className="text-slate-700">—</span>}
                      </td>
                      <td className="px-2 py-3 text-center text-xs hidden xl:table-cell">
                        {r.leave_days_taken > 0 ? (
                          <span className="text-slate-300">{r.leave_days_taken}d
                            {r.unpaid_leaves_taken > 0 && <span className="text-red-400 ml-1">({r.unpaid_leaves_taken} unpaid)</span>}
                          </span>
                        ) : <span className="text-slate-700">—</span>}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="font-display font-bold text-sm tabular-nums" style={{ color: ORANGE }}>
                          {fmtPKR(r.net_payable)}
                        </div>
                        {r.paid_date && (
                          <div className="text-slate-600 text-[10px] mt-0.5">paid {r.paid_date}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusInfo.cls}`}>
                          <span>{statusInfo.icon}</span>{statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {r.has_structure && (
                            <button onClick={()=>setAdjustRow(r)}
                              title="Adjust"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                              <HiOutlineAdjustments className="w-4 h-4"/>
                            </button>
                          )}
                          {r.status !== 'paid' && r.has_structure && (
                            <button onClick={()=>markPaid(r)}
                              title="Mark paid"
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors">
                              <HiOutlineCheck className="w-4 h-4"/>
                            </button>
                          )}
                          {r.slip_id && (
                            <button onClick={()=>downloadPDF(r)}
                              title="Download PDF"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                              <HiOutlineDownload className="w-4 h-4"/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help footer */}
      <div className="glass rounded-2xl p-4 flex items-start gap-3"
           style={{ borderLeft:'3px solid '+ORANGE }}>
        <HiOutlineExclamation className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: ORANGE }}/>
        <div className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-white">Tip:</strong> Salary structures are set in <em>Settings → Salary Setup</em>.
          This page focuses on month-by-month payments only. Use bulk select to mark multiple employees paid at once.
          The leaves column reflects approved leave that overlapped the selected period.
        </div>
      </div>

      {/* Modals */}
      {adjustRow && (
        <AdjustModal row={adjustRow} month={month} year={year}
                     onClose={()=>setAdjustRow(null)} onSaved={load}/>
      )}
      {bulkConfirm && (
        <BulkPayModal rows={selectedRows} period={periodLabel}
                      onClose={()=>setBulkConfirm(false)}
                      onConfirm={bulkPay}/>
      )}
    </div>
  )
}
