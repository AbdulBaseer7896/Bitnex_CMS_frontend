import { useEffect, useState, useRef } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlineDownload, HiOutlineX,
  HiOutlineCheck, HiOutlineCurrencyDollar, HiOutlinePencil,
  HiOutlineDocumentText, HiOutlineChevronRight, HiOutlineTrendingUp,
  HiOutlineUsers, HiOutlineClock, HiOutlineCalendar,
} from 'react-icons/hi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const TEAL   = '#4BBFBF'
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const EMP_STATUS_COLOR = {
  probation:     'bg-amber-500/15 text-amber-400',
  permanent:     'bg-[#4BBFBF]/15 text-[#4BBFBF]',
  contract:      'bg-sky-500/15 text-sky-400',
  notice_period: 'bg-red-500/15 text-red-400',
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
function generateSlipHTML(slip, employee, structure, company) {
  const gross   = Number(structure?.gross_salary||0)
  const net     = Number(slip.net_payable||0)
  const bonus   = Number(slip.bonus||0)
  const penalty = Number(slip.penalty_deduction||0)
  const month   = MONTHS[(slip.month||1)-1]
  const logo    = company?.logo_url
    ? `<img src="${company.logo_url}" style="height:48px;object-fit:contain;" alt="logo"/>`
    : `<div style="font-size:26px;font-weight:900;color:#4BBFBF;letter-spacing:-1px;">BITNEX</div>`

  const row = (l,v,cls='')=>`<tr><td style="padding:8px 0;color:#64748b;font-size:13px">${l}</td><td style="padding:8px 0;text-align:right;font-weight:600;font-size:13px;color:${cls||'#1e293b'}">${v}</td></tr>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#f8fafc;padding:24px;color:#1e293b}
  .slip{max-width:720px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 60px rgba(0,0,0,0.15)}
  .hdr{background:linear-gradient(135deg,#0e1420 0%,#1e293b 60%,#0e1420 100%);padding:28px 36px;display:flex;align-items:flex-start;justify-content:space-between}
  .co-name{font-size:22px;font-weight:800;color:#4BBFBF;margin:6px 0 2px}
  .co-sub{font-size:11px;color:#94a3b8;line-height:1.6}
  .slip-badge{text-align:right}
  .slip-badge h2{color:#fff;font-size:20px;font-weight:700;letter-spacing:2px}
  .slip-badge p{color:#94a3b8;font-size:11px;margin-top:4px}
  .paid-tag{display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px}
  .emp-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:#f8fafc;border-bottom:1px solid #e2e8f0}
  .emp-cell{padding:18px 24px;border-right:1px solid #e2e8f0}
  .emp-cell:last-child{border-right:none}
  .emp-label{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-weight:700;margin-bottom:4px}
  .emp-val{font-size:14px;font-weight:700;color:#1e293b}
  .body{padding:28px 36px}
  .section{margin-bottom:20px}
  .section-hdr{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f1f5f9}
  .section-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px}
  .section-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b}
  table.rows{width:100%;border-collapse:collapse}
  .subtotal{background:#f8fafc;padding:10px 14px;border-radius:10px;display:flex;justify-content:space-between;margin-top:8px;font-weight:700}
  .net-box{background:linear-gradient(135deg,rgba(75,191,191,0.08),rgba(75,191,191,0.04));border:2px solid rgba(75,191,191,0.25);border-radius:14px;padding:22px 28px;margin:20px 0;display:flex;justify-content:space-between;align-items:center}
  .net-label{font-size:15px;font-weight:700;color:#1e293b}
  .net-sub{font-size:12px;color:#94a3b8;margin-top:3px}
  .net-amount{font-size:34px;font-weight:800;color:#4BBFBF;letter-spacing:-1px}
  .net-currency{font-size:14px;color:#4BBFBF;margin-bottom:4px}
  .footer{padding:18px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end}
  .footer-note{font-size:10px;color:#94a3b8;line-height:1.7}
  .sig{text-align:center;width:160px}
  .sig-line{border-top:1px solid #cbd5e1;padding-top:6px;font-size:10px;color:#94a3b8;margin-top:36px}
  @media print{body{padding:0;background:#fff}.slip{box-shadow:none;border-radius:0}}
</style></head><body>
<div class="slip">
  <div class="hdr">
    <div>${logo}<div class="co-name">${company?.name||'Bitnex Technologies'}</div><div class="co-sub">${company?.address||''}<br/>${company?.phone||''} · ${company?.email||''}</div></div>
    <div class="slip-badge">
      <h2>SALARY SLIP</h2>
      <p>${month} ${slip.year}</p>
      <span class="paid-tag" style="background:${slip.status==='paid'?'rgba(75,191,191,0.15)':'rgba(234,179,8,0.15)'};color:${slip.status==='paid'?'#4BBFBF':'#eab308'}">
        ${slip.status==='paid'?'✓  PAID':'⏳  PENDING'}
      </span>
    </div>
  </div>

  <div class="emp-bar">
    <div class="emp-cell"><div class="emp-label">Employee</div><div class="emp-val">${employee?.full_name||employee?.username||'—'}</div></div>
    <div class="emp-cell"><div class="emp-label">Department</div><div class="emp-val">${employee?.department||'—'}</div></div>
    <div class="emp-cell"><div class="emp-label">Designation</div><div class="emp-val">${employee?.designation||'—'}</div></div>
    <div class="emp-cell"><div class="emp-label">Employee ID</div><div class="emp-val">#BNX${String(employee?.id||0).padStart(4,'0')}</div></div>
    <div class="emp-cell"><div class="emp-label">Pay Period</div><div class="emp-val">${month} ${slip.year}</div></div>
    <div class="emp-cell"><div class="emp-label">Pay Date</div><div class="emp-val">${slip.paid_date||'—'}</div></div>
  </div>

  <div class="body">
    <div class="section">
      <div class="section-hdr"><div class="section-icon" style="background:#e0fdf4">💰</div><span class="section-title">Earnings</span></div>
      <table class="rows">
        ${row('Basic Salary', `PKR ${Number(structure?.basic_salary||0).toLocaleString()}`)}
        ${Number(structure?.house_allowance||0)>0?row('House Allowance',`PKR ${Number(structure?.house_allowance).toLocaleString()}`):'' }
        ${Number(structure?.transport_allowance||0)>0?row('Transport Allowance',`PKR ${Number(structure?.transport_allowance).toLocaleString()}`):'' }
        ${Number(structure?.medical_allowance||0)>0?row('Medical Allowance',`PKR ${Number(structure?.medical_allowance).toLocaleString()}`):'' }
        ${Number(structure?.other_allowances||0)>0?row('Other Allowances',`PKR ${Number(structure?.other_allowances).toLocaleString()}`):'' }
        ${bonus>0?row('Performance Bonus',`PKR ${bonus.toLocaleString()}`):''}
      </table>
      <div class="subtotal"><span>Gross Salary</span><span style="color:#4BBFBF">PKR ${gross.toLocaleString()}</span></div>
    </div>

    <div class="section">
      <div class="section-hdr"><div class="section-icon" style="background:#fef2f2">📉</div><span class="section-title">Deductions</span></div>
      <table class="rows">
        ${Number(structure?.tax_deduction||0)>0?row('Income Tax',`- PKR ${Number(structure?.tax_deduction).toLocaleString()}`,'#ef4444'):'' }
        ${Number(structure?.provident_fund||0)>0?row('Provident Fund',`- PKR ${Number(structure?.provident_fund).toLocaleString()}`,'#ef4444'):'' }
        ${Number(structure?.other_deductions||0)>0?row('Other Deductions',`- PKR ${Number(structure?.other_deductions).toLocaleString()}`,'#ef4444'):'' }
        ${penalty>0?row('Penalty',`- PKR ${penalty.toLocaleString()}`,'#ef4444'):''}
      </table>
      <div class="subtotal"><span>Total Deductions</span><span style="color:#ef4444">- PKR ${(Number(structure?.total_deductions||0)+penalty).toLocaleString()}</span></div>
    </div>

    <div class="net-box">
      <div><div class="net-label">Net Payable Salary</div><div class="net-sub">${month} ${slip.year} · ${slip.status==='paid'?'Paid on '+slip.paid_date:'Payment Pending'}</div></div>
      <div style="text-align:right"><div class="net-currency">PKR</div><div class="net-amount">${net.toLocaleString()}</div></div>
    </div>

    ${slip.notes?`<div style="background:#f8fafc;padding:14px;border-radius:10px;border-left:3px solid #4BBFBF;margin-top:4px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:4px">Note</div><div style="font-size:13px;color:#475569">${slip.notes}</div></div>`:''}
  </div>

  <div class="footer">
    <div class="footer-note">
      This is a system-generated salary slip. No signature required.<br/>
      ${company?.name||'Bitnex Technologies'} · ${company?.address||'Lahore, Pakistan'}<br/>
      Generated: ${new Date().toLocaleDateString('en-PK')}
    </div>
    <div class="sig"><div class="sig-line">Authorized Signatory</div></div>
  </div>
</div></body></html>`
}

function downloadSlip(html) {
  const w = window.open('','_blank')
  w.document.write(html)
  w.document.close()
  setTimeout(()=>w.print(), 600)
}

// ── Modals ────────────────────────────────────────────────────────────────────
function SalaryModal({ employee, existing, onClose, onSave }) {
  const [form, setForm] = useState({
    employee: employee.id,
    basic_salary: existing?.basic_salary||'',
    house_allowance: existing?.house_allowance||0,
    transport_allowance: existing?.transport_allowance||0,
    medical_allowance: existing?.medical_allowance||0,
    other_allowances: existing?.other_allowances||0,
    tax_deduction: existing?.tax_deduction||0,
    provident_fund: existing?.provident_fund||0,
    other_deductions: existing?.other_deductions||0,
    effective_from: existing?.effective_from||new Date().toISOString().slice(0,10),
    notes: existing?.notes||'',
  })
  const [saving, setSaving] = useState(false)
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))
  const gross=['basic_salary','house_allowance','transport_allowance','medical_allowance','other_allowances'].reduce((s,k)=>s+(parseFloat(form[k])||0),0)
  const deductions=['tax_deduction','provident_fund','other_deductions'].reduce((s,k)=>s+(parseFloat(form[k])||0),0)
  const net=gross-deductions

  const handleSave=async(e)=>{
    e.preventDefault();setSaving(true)
    try{
      if(existing) await api.patch(`/salary/structures/${existing.id}/`,form)
      else await api.post('/salary/structures/',form)
      toast.success(existing?'Updated!':'Created!')
      onSave();onClose()
    }catch(err){toast.error(Object.values(err.response?.data||{}).flat().join(' ')||'Failed')}
    finally{setSaving(false)}
  }

  const Field=({label,field})=>(
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₨</span>
        <input type="number" min="0" className="input pl-6 text-sm py-2.5" value={form[field]} onChange={e=>f(field,e.target.value)}/>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-2xl animate-slide-up my-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-white text-xl">{existing?'Update':'Set'} Salary</h3>
            <p className="text-slate-500 text-sm">{employee.full_name} · {employee.department}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiOutlineX className="w-6 h-6"/></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Allowances</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Basic Salary *" field="basic_salary"/>
              <Field label="House Allowance" field="house_allowance"/>
              <Field label="Transport" field="transport_allowance"/>
              <Field label="Medical" field="medical_allowance"/>
              <Field label="Other" field="other_allowances"/>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Deductions</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Income Tax" field="tax_deduction"/>
              <Field label="Provident Fund" field="provident_fund"/>
              <Field label="Other Deductions" field="other_deductions"/>
            </div>
          </div>
          {/* Live preview */}
          <div className="glass rounded-xl p-4 space-y-2">
            {[['Gross',gross,'text-white'],['Deductions',-deductions,'text-red-400']].map(([l,v,c])=>(
              <div key={l} className="flex justify-between text-sm">
                <span className="text-slate-500">{l}</span>
                <span className={`font-semibold ${c}`}>PKR {Math.abs(v).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop:'1px solid rgba(75,191,191,0.12)' }}>
              <span style={{ color:TEAL }}>Net Salary</span>
              <span className="text-white">PKR {net.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Effective From *</label>
              <input required type="date" className="input" value={form.effective_from} onChange={e=>f('effective_from',e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
              <input className="input" value={form.notes} onChange={e=>f('notes',e.target.value)}/>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving?'Saving...':(existing?'Update':'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SlipModal({ employee, structure, onClose, onSave }) {
  const now = new Date()
  const [form, setForm] = useState({
    employee: employee.id, salary_structure: structure?.id||'',
    month: now.getMonth()+1, year: now.getFullYear(),
    bonus:0, penalty_deduction:0, notes:'',
  })
  const [saving, setSaving] = useState(false)
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))
  const net=(Number(structure?.net_salary||0)+Number(form.bonus||0)-Number(form.penalty_deduction||0))

  const handleSave=async(e)=>{
    e.preventDefault();setSaving(true)
    try{
      await api.post('/salary/slips/',form)
      toast.success('Salary slip generated!')
      onSave();onClose()
    }catch(err){toast.error(Object.values(err.response?.data||{}).flat().join(' ')||'Failed')}
    finally{setSaving(false)}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-lg">Generate Salary Slip</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiOutlineX className="w-5 h-5"/></button>
        </div>
        {structure&&(
          <div className="glass rounded-xl p-4 mb-4 space-y-1.5 text-sm">
            {[['Basic',structure.basic_salary],['Gross',structure.gross_salary],['Deductions',-structure.total_deductions]].map(([l,v])=>(
              <div key={l} className="flex justify-between">
                <span className="text-slate-500">{l}</span>
                <span className={v<0?'text-red-400':'text-slate-300'}>PKR {Math.abs(Number(v)).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-1.5" style={{ borderTop:'1px solid rgba(75,191,191,0.12)' }}>
              <span style={{ color:TEAL }}>Base Net</span>
              <span className="text-white">PKR {Number(structure.net_salary).toLocaleString()}</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1.5">Month</label>
              <select className="input" value={form.month} onChange={e=>f('month',+e.target.value)}>
                {MONTHS.map((m,i)=><option key={i+1} value={i+1} className="bg-slate-900">{m}</option>)}
              </select></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Year</label>
              <select className="input" value={form.year} onChange={e=>f('year',+e.target.value)}>
                {[2025,2026].map(y=><option key={y} value={y} className="bg-slate-900">{y}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1.5">Bonus</label>
              <input type="number" min="0" className="input" value={form.bonus} onChange={e=>f('bonus',e.target.value)}/></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Penalty</label>
              <input type="number" min="0" className="input" value={form.penalty_deduction} onChange={e=>f('penalty_deduction',e.target.value)}/></div>
          </div>
          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Net Payable</span>
            <span className="font-display font-bold text-xl" style={{ color:TEAL }}>PKR {net.toLocaleString()}</span>
          </div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Notes</label>
            <textarea className="input h-14 resize-none text-sm" value={form.notes} onChange={e=>f('notes',e.target.value)}/></div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving?'Generating...':'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Employee Detail Panel ─────────────────────────────────────────────────────
function EmployeeDetail({ employee, company, onClose }) {
  const [structure,  setStructure]  = useState(null)
  const [slips,      setSlips]      = useState([])
  const [structures, setStructures] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [slipModal,  setSlipModal]  = useState(false)
  const [salModal,   setSalModal]   = useState(null)

  useEffect(()=>{ load() },[employee.id])

  const load = async()=>{
    setLoading(true)
    try {
      const [sRes, slipRes] = await Promise.all([
        api.get(`/salary/structures/?employee=${employee.id}`),
        api.get(`/salary/slips/?employee=${employee.id}`),
      ])
      const structs = sRes.data.results||sRes.data
      setStructures(structs)
      setStructure(structs[0]||null)
      setSlips(slipRes.data.results||slipRes.data)
    } catch { toast.error('Failed to load salary data') }
    finally { setLoading(false) }
  }

  const markPaid = async(id)=>{
    try {
      await api.post(`/salary/slips/${id}/mark_paid/`,{})
      setSlips(p=>p.map(s=>s.id===id?{...s,status:'paid'}:s))
      toast.success('Marked as paid ✓')
    } catch { toast.error('Failed') }
  }

  const handleDownload = async(slip)=>{
    try {
      const html = generateSlipHTML(slip, employee, structure, company)
      downloadSlip(html)
    } catch { toast.error('Failed to generate PDF') }
  }

  // Slip chart data (last 6 months)
  const chartData = slips.slice(0,6).reverse().map(s=>({
    month: MONTHS_S[s.month-1],
    amount: Number(s.net_payable||0),
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(75,191,191,0.3)',borderTopColor:TEAL }}/>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Employee header */}
      <div className="rounded-2xl p-6 relative overflow-hidden"
           style={{ background:'linear-gradient(135deg,rgba(75,191,191,0.12),rgba(45,49,66,0.4))', border:'1px solid rgba(75,191,191,0.2)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#0e1420] font-bold text-2xl shadow-lg flex-shrink-0"
                 style={{ background:'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              {(employee.first_name?.[0]||employee.username?.[0]||'E').toUpperCase()}
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-2xl">{employee.full_name||employee.username}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{employee.designation} · {employee.department}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge text-xs capitalize ${EMP_STATUS_COLOR[employee.employment_status]||'bg-slate-500/15 text-slate-400'}`}>
                  {employee.employment_status?.replace('_',' ')||'permanent'}
                </span>
                <span className="text-slate-600 text-xs">ID: #BNX{String(employee.id).padStart(4,'0')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={()=>setSalModal(structure)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background:'rgba(75,191,191,0.15)',color:TEAL,border:`1px solid rgba(75,191,191,0.25)` }}>
              <HiOutlinePencil className="w-4 h-4"/>
              {structure?'Edit Salary':'Set Salary'}
            </button>
            <button onClick={()=>setSlipModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all btn-primary">
              <HiOutlinePlus className="w-4 h-4"/>Generate Slip
            </button>
          </div>
        </div>
      </div>

      {/* Current salary structure */}
      {structure ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Breakdown card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white">Current Salary Structure</h3>
              <span className="text-slate-500 text-xs">Effective: {structure.effective_from}</span>
            </div>
            <div className="space-y-0">
              {/* Allowances */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Allowances</div>
              {[
                ['Basic Salary',     structure.basic_salary,       true ],
                ['House Allowance',  structure.house_allowance,    false],
                ['Transport',        structure.transport_allowance,false],
                ['Medical',          structure.medical_allowance,  false],
                ['Other Allowances', structure.other_allowances,   false],
              ].filter(([,v])=>Number(v)>0).map(([l,v,bold])=>(
                <div key={l} className="flex justify-between py-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span className={`text-sm ${bold?'text-white font-medium':'text-slate-400'}`}>{l}</span>
                  <span className={`text-sm ${bold?'text-white font-semibold':'text-slate-300'}`}>PKR {Number(v).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-1" style={{ background:'rgba(75,191,191,0.06)',padding:'8px 10px',borderRadius:'8px' }}>
                <span className="text-sm font-bold text-white">Gross Salary</span>
                <span className="text-sm font-bold" style={{ color:TEAL }}>PKR {Number(structure.gross_salary).toLocaleString()}</span>
              </div>

              {/* Deductions */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-4 mb-2">Deductions</div>
              {[
                ['Income Tax',        structure.tax_deduction,   ],
                ['Provident Fund',    structure.provident_fund,  ],
                ['Other Deductions',  structure.other_deductions,],
              ].filter(([,v])=>Number(v)>0).map(([l,v])=>(
                <div key={l} className="flex justify-between py-2" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-sm text-slate-400">{l}</span>
                  <span className="text-sm text-red-400">- PKR {Number(v).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between mt-3 p-3 rounded-xl" style={{ background:'rgba(239,68,68,0.06)' }}>
                <span className="text-sm font-semibold text-white">Total Deductions</span>
                <span className="text-sm font-semibold text-red-400">- PKR {Number(structure.total_deductions).toLocaleString()}</span>
              </div>

              {/* Net */}
              <div className="mt-4 p-4 rounded-2xl flex items-center justify-between"
                   style={{ background:'linear-gradient(135deg,rgba(75,191,191,0.15),rgba(75,191,191,0.05))', border:'2px solid rgba(75,191,191,0.3)' }}>
                <div>
                  <div className="text-slate-400 text-xs">Net Monthly Salary</div>
                  <div className="font-display font-bold text-2xl text-white mt-0.5">
                    PKR {Number(structure.net_salary).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-xs">Annual</div>
                  <div className="font-bold text-white text-sm">{(Number(structure.net_salary)*12).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Slip trend chart */}
          <div className="card">
            <h3 className="font-display font-bold text-white mb-4">Salary History</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="month" tick={{ fill:'#64748b',fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#64748b',fontSize:10 }} axisLine={false} tickLine={false}
                    tickFormatter={v=>`₨${(v/1000).toFixed(0)}k`}/>
                  <Tooltip
                    contentStyle={{ background:'rgba(14,20,32,0.95)',border:`1px solid ${TEAL}30`,borderRadius:10 }}
                    formatter={v=>[`PKR ${v.toLocaleString()}`,'Net Pay']}/>
                  <Bar dataKey="amount" fill={TEAL} radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44 text-slate-500 text-sm">No slip history yet</div>
            )}
            {/* Quick stats */}
            {slips.length>0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label:'Slips', val:slips.length },
                  { label:'Paid',  val:slips.filter(s=>s.status==='paid').length, color:'text-[#4BBFBF]' },
                  { label:'Pending',val:slips.filter(s=>s.status!=='paid').length, color:'text-amber-400' },
                ].map(s=>(
                  <div key={s.label} className="glass rounded-xl p-3 text-center">
                    <div className={`font-display text-xl font-bold ${s.color||'text-white'}`}>{s.val}</div>
                    <div className="text-slate-500 text-xs">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-12 text-center">
          <HiOutlineCurrencyDollar className="w-12 h-12 text-slate-600 mb-4"/>
          <h3 className="font-display font-bold text-white text-lg mb-2">No Salary Structure</h3>
          <p className="text-slate-500 text-sm mb-5">Set a salary structure to start generating slips</p>
          <button onClick={()=>setSalModal(null)} className="btn-primary flex items-center gap-2 px-6 py-3">
            <HiOutlinePlus className="w-4 h-4"/>Set Salary Structure
          </button>
        </div>
      )}

      {/* Salary slips list */}
      {slips.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-white mb-5">Salary Slips</h3>
          <div className="space-y-3">
            {slips.map(s=>(
              <div key={s.id} className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                       style={{ background: s.status==='paid'?'rgba(75,191,191,0.15)':'rgba(234,179,8,0.1)' }}>
                    <div className="font-bold text-xs" style={{ color: s.status==='paid'?TEAL:'#eab308' }}>
                      {MONTHS_S[s.month-1]}
                    </div>
                    <div className="text-slate-500 text-[10px]">{s.year}</div>
                  </div>
                  <div>
                    <div className="text-white font-semibold">{MONTHS[s.month-1]} {s.year}</div>
                    <div className="font-display font-bold text-lg" style={{ color:TEAL }}>
                      PKR {Number(s.net_payable||0).toLocaleString()}
                    </div>
                    {s.bonus>0&&<div className="text-emerald-400 text-xs">+PKR {Number(s.bonus).toLocaleString()} bonus</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`badge text-xs ${s.status==='paid'?'bg-[#4BBFBF]/15 text-[#4BBFBF] border border-[#4BBFBF]/20':'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                      {s.status==='paid'?'✓ Paid':'⏳ Pending'}
                    </span>
                    {s.paid_date&&<div className="text-slate-600 text-[10px] mt-1">{s.paid_date}</div>}
                  </div>
                  {s.status!=='paid'&&(
                    <button onClick={()=>markPaid(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background:'rgba(75,191,191,0.12)',color:TEAL }}>
                      <HiOutlineCheck className="w-3.5 h-3.5"/>Mark Paid
                    </button>
                  )}
                  <button onClick={()=>handleDownload(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
                    style={{ background:'rgba(255,255,255,0.06)' }}>
                    <HiOutlineDownload className="w-3.5 h-3.5"/>PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {salModal!==undefined && (
        <SalaryModal employee={employee} existing={salModal||null} onClose={()=>setSalModal(undefined)} onSave={load}/>
      )}
      {slipModal && (
        <SlipModal employee={employee} structure={structure} onClose={()=>setSlipModal(false)} onSave={load}/>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SalaryManagementPage() {
  const [employees, setEmployees]     = useState([])
  const [company,   setCompany]       = useState(null)
  const [selected,  setSelected]      = useState(null)
  const [search,    setSearch]        = useState('')
  const [loading,   setLoading]       = useState(true)
  const [roleFilter,setRoleFilter]    = useState('all')

  useEffect(()=>{
    fetchEmployees()
    api.get('/core/company-settings/').then(({data})=>setCompany(data)).catch(()=>{})
  },[])

  const fetchEmployees = async()=>{
    setLoading(true)
    try{ const{data}=await api.get('/users/'); const list=data.results||data; setEmployees(list); if(list.length>0&&!selected) setSelected(list[0]) }
    catch{ toast.error('Failed to load employees') }
    finally{ setLoading(false) }
  }

  const filtered = employees.filter(e=>{
    if(roleFilter!=='all'&&e.role!==roleFilter)return false
    const q=search.toLowerCase()
    return !q||e.full_name?.toLowerCase().includes(q)||e.department?.toLowerCase().includes(q)
  })

  return (
    <div className="flex gap-0 h-full" style={{ minHeight:'calc(100vh - 120px)' }}>
      {/* ── LEFT SIDEBAR ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-[#4BBFBF]/10 pr-4">
        {/* Search + filter */}
        <div className="mb-3 space-y-2">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee..."
              className="input pl-9 py-2 text-sm w-full"/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all','employee','hr','sales'].map(r=>(
              <button key={r} onClick={()=>setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${roleFilter===r?'text-[#4BBFBF]':'glass text-slate-500 hover:text-white'}`}
                style={roleFilter===r?{background:'rgba(75,191,191,0.15)',border:'1px solid rgba(75,191,191,0.25)'}:{}}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto space-y-1.5" style={{ maxHeight:'calc(100vh - 220px)' }}>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(75,191,191,0.3)',borderTopColor:TEAL }}/></div>
          ) : filtered.length===0 ? (
            <div className="text-center text-slate-500 py-8 text-sm">No employees found</div>
          ) : filtered.map(emp=>(
            <button key={emp.id} onClick={()=>setSelected(emp)}
              className={`w-full text-left px-3 py-3 rounded-2xl transition-all group ${selected?.id===emp.id?'':'hover:bg-white/[0.04]'}`}
              style={selected?.id===emp.id?{background:'rgba(75,191,191,0.12)',border:'1px solid rgba(75,191,191,0.2)'}:{border:'1px solid transparent'}}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#0e1420] font-bold text-sm flex-shrink-0"
                     style={{ background:'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
                  {(emp.first_name?.[0]||emp.username?.[0]||'E').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${selected?.id===emp.id?'text-white':'text-slate-300 group-hover:text-white'}`}>
                    {emp.full_name||emp.username}
                  </div>
                  <div className="text-slate-500 text-xs truncate">{emp.department||'No dept'}</div>
                </div>
                {selected?.id===emp.id && <HiOutlineChevronRight className="w-4 h-4 flex-shrink-0" style={{ color:TEAL }}/>}
              </div>
              <div className="ml-12 mt-1">
                <span className={`badge text-[10px] capitalize ${EMP_STATUS_COLOR[emp.employment_status]||'bg-slate-500/15 text-slate-500'}`}>
                  {emp.employment_status?.replace('_',' ')||'permanent'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Sidebar footer stats */}
        <div className="mt-3 pt-3 border-t border-[#4BBFBF]/10">
          <div className="grid grid-cols-2 gap-2">
            <div className="glass rounded-xl p-2.5 text-center">
              <div className="font-display font-bold text-white text-lg">{employees.length}</div>
              <div className="text-slate-600 text-[10px]">Total</div>
            </div>
            <div className="glass rounded-xl p-2.5 text-center">
              <div className="font-display font-bold text-[#4BBFBF] text-lg">
                {employees.filter(e=>e.employment_status==='permanent').length}
              </div>
              <div className="text-slate-600 text-[10px]">Permanent</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT DETAIL PANEL ── */}
      <div className="flex-1 pl-5 overflow-y-auto">
        {selected ? (
          <EmployeeDetail key={selected.id} employee={selected} company={company} onClose={()=>setSelected(null)}/>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <HiOutlineUsers className="w-12 h-12 text-slate-700 mb-4"/>
            <h3 className="font-display font-bold text-white text-xl mb-2">Select an Employee</h3>
            <p className="text-slate-500 text-sm">Choose an employee from the list to view and manage their salary</p>
          </div>
        )}
      </div>
    </div>
  )
}
