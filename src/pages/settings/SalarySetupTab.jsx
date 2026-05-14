import { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineX, HiOutlinePencil, HiOutlinePlus,
  HiOutlineCurrencyDollar, HiOutlineCheck, HiOutlineExclamation,
  HiOutlineUsers, HiOutlineFilter, HiOutlineChevronRight,
} from 'react-icons/hi'

const ORANGE = '#f97316'
const fmtPKR = v => 'PKR ' + Number(v||0).toLocaleString('en-PK', { maximumFractionDigits: 0 })

// ─────────────────────────────────────────────────────────────────────────────
// Salary Structure Modal — create/edit
// ─────────────────────────────────────────────────────────────────────────────
function StructureModal({ employee, existing, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0,10)
  const [form, setForm] = useState({
    employee: employee.id,
    basic_salary: existing?.basic_salary || '',
    house_allowance: existing?.house_allowance || 0,
    transport_allowance: existing?.transport_allowance || 0,
    medical_allowance: existing?.medical_allowance || 0,
    other_allowances: existing?.other_allowances || 0,
    tax_deduction: existing?.tax_deduction || 0,
    provident_fund: existing?.provident_fund || 0,
    other_deductions: existing?.other_deductions || 0,
    effective_from: existing?.effective_from || today,
    notes: existing?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const gross = ['basic_salary','house_allowance','transport_allowance','medical_allowance','other_allowances']
    .reduce((s, k) => s + (parseFloat(form[k]) || 0), 0)
  const deductions = ['tax_deduction','provident_fund','other_deductions']
    .reduce((s, k) => s + (parseFloat(form[k]) || 0), 0)
  const net = gross - deductions

  const save = async (e) => {
    e.preventDefault()
    if (!parseFloat(form.basic_salary)) { toast.error('Basic salary is required'); return }
    setSaving(true)
    try {
      if (existing) {
        // Salary structure is historical — create a new record rather than edit
        // unless the effective_from is the same as the existing one.
        if (existing.effective_from === form.effective_from) {
          await api.patch(`/salary/structures/${existing.id}/`, form)
        } else {
          await api.post('/salary/structures/', form)
        }
      } else {
        await api.post('/salary/structures/', form)
      }
      toast.success(existing ? 'Salary structure updated' : 'Salary structure created')
      onSaved(); onClose()
    } catch (err) {
      const msg = Object.values(err.response?.data || {}).flat().join(' ') || 'Failed to save'
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const numberField = (label, k, required) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₨</span>
        <input type="number" min="0" step="any"
               className="input pl-7 py-2.5 text-sm"
               value={form[k]} onChange={e=>f(k, e.target.value)}/>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl w-full max-w-3xl animate-slide-up my-4">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between"
             style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-lg"
                 style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {employee.full_name?.[0]?.toUpperCase() || employee.username?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">
                {existing ? 'Update' : 'Set'} Salary Structure
              </h3>
              <p className="text-slate-500 text-xs">
                {employee.full_name || employee.username} · {employee.department || 'No dept'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={save}>
          <div className="p-6 space-y-5">
            {/* Allowances */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded" style={{ background: ORANGE }}/>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Allowances</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {numberField('Basic Salary',     'basic_salary', true)}
                {numberField('House Allowance',  'house_allowance')}
                {numberField('Transport',        'transport_allowance')}
                {numberField('Medical',          'medical_allowance')}
                {numberField('Other Allowances', 'other_allowances')}
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded bg-red-400"/>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Deductions</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {numberField('Income Tax',       'tax_deduction')}
                {numberField('Provident Fund',   'provident_fund')}
                {numberField('Other Deductions', 'other_deductions')}
              </div>
            </div>

            {/* Preview */}
            <div className="glass rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Gross Salary</span>
                <span className="text-white font-semibold tabular-nums">{fmtPKR(gross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Deductions</span>
                <span className="text-red-400 font-semibold tabular-nums">− {fmtPKR(deductions)}</span>
              </div>
              <div className="flex justify-between font-display text-lg font-bold pt-2"
                   style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: ORANGE }}>Net Monthly Salary</span>
                <span className="text-white tabular-nums">{fmtPKR(net)}</span>
              </div>
            </div>

            {/* Effective + notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Effective From <span className="text-red-400">*</span>
                </label>
                <input required type="date" className="input py-2.5 text-sm"
                       value={form.effective_from} onChange={e=>f('effective_from', e.target.value)}/>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes
                </label>
                <input className="input py-2.5 text-sm"
                       placeholder="e.g. Annual increment 2026"
                       value={form.notes} onChange={e=>f('notes', e.target.value)}/>
              </div>
            </div>
          </div>

          <div className="p-4 flex gap-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <button type="button" onClick={onClose} className="flex-1 btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving…' : (existing ? 'Save Structure' : 'Create Structure')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Salary Setup Tab — list of employees + their current structure
// ─────────────────────────────────────────────────────────────────────────────
export default function SalarySetupTab() {
  const [employees,  setEmployees]  = useState([])
  const [structures, setStructures] = useState({})  // by employee_id
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [editing,    setEditing]    = useState(null)   // { employee, existing }
  const [filter,     setFilter]     = useState('all')  // all | configured | missing

  const load = async () => {
    setLoading(true)
    try {
      const [empRes, sRes] = await Promise.all([
        api.get('/users/'),
        api.get('/salary/structures/'),
      ])
      const empList = (empRes.data.results || empRes.data).filter(u => u.role !== 'customer')
      const structs = sRes.data.results || sRes.data
      const byEmp = {}
      // structures already ordered by -created_at; first wins = latest
      for (const s of structs) {
        if (!byEmp[s.employee]) byEmp[s.employee] = s
      }
      setEmployees(empList)
      setStructures(byEmp)
    } catch { toast.error('Failed to load salary setup') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter(e => {
      const has = !!structures[e.id]
      if (filter === 'configured' && !has) return false
      if (filter === 'missing'    && has)  return false
      if (q && !(
        e.full_name?.toLowerCase().includes(q) ||
        e.username?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
      )) return false
      return true
    })
  }, [employees, structures, search, filter])

  const counts = {
    all: employees.length,
    configured: employees.filter(e => structures[e.id]).length,
    missing:    employees.filter(e => !structures[e.id]).length,
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-white text-xl">Salary Setup</h3>
          <p className="text-slate-500 text-sm mt-0.5">
            Configure each employee's salary structure. These are long-term settings — monthly payments are handled in <em>Manage Salary</em>.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass rounded-2xl p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search employees…"
              className="input pl-9 py-2 text-sm"/>
          </div>
          <div className="flex items-center gap-1 glass-light rounded-xl p-1">
            {[
              { id:'all',        label:'All',        count: counts.all },
              { id:'configured', label:'Configured', count: counts.configured, color:'#10b981' },
              { id:'missing',    label:'Missing',    count: counts.missing,    color:'#ef4444' },
            ].map(t => (
              <button key={t.id} onClick={()=>setFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === t.id ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
                style={filter === t.id ? { background:'rgba(249,115,22,0.18)', border:'1px solid rgba(249,115,22,0.3)' } : {}}>
                {t.label}
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px]"
                      style={{ background:'rgba(255,255,255,0.08)', color: t.color || '#94a3b8' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
               style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor: ORANGE }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center">
          <HiOutlineUsers className="w-12 h-12 mx-auto text-slate-700 mb-3"/>
          <h4 className="text-white font-semibold">No employees match</h4>
          <p className="text-slate-500 text-sm mt-1">Try a different filter or search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(emp => {
            const s = structures[emp.id]
            return (
              <div key={emp.id} className="glass rounded-2xl p-4 hover:border-orange-500/20 transition-colors"
                   style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow"
                         style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                      {emp.full_name?.[0]?.toUpperCase() || emp.username?.[0]?.toUpperCase() || 'E'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{emp.full_name || emp.username}</div>
                      <div className="text-slate-500 text-xs truncate">
                        {emp.designation || '—'} · {emp.department || 'No dept'}
                      </div>
                    </div>
                  </div>

                  {/* Structure summary */}
                  {s ? (
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Gross</div>
                        <div className="text-white text-sm font-medium tabular-nums">{fmtPKR(s.gross_salary)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Net Monthly</div>
                        <div className="font-display font-bold text-base tabular-nums" style={{ color: ORANGE }}>
                          {fmtPKR(s.net_salary)}
                        </div>
                      </div>
                      <div className="text-right hidden lg:block">
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">Effective</div>
                        <div className="text-slate-300 text-xs">{s.effective_from}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                      <HiOutlineExclamation className="w-4 h-4"/>
                      No structure configured
                    </div>
                  )}

                  <button onClick={()=>setEditing({ employee: emp, existing: s })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      s ? 'glass text-slate-300 hover:text-white' : 'btn-primary'
                    }`}>
                    {s ? <HiOutlinePencil className="w-3.5 h-3.5"/> : <HiOutlinePlus className="w-3.5 h-3.5"/>}
                    {s ? 'Edit' : 'Set Salary'}
                  </button>
                </div>

                {/* Mobile summary */}
                {s && (
                  <div className="md:hidden mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="glass rounded-lg p-2">
                      <div className="text-slate-500 text-[10px]">Gross</div>
                      <div className="text-white text-xs font-semibold">{fmtPKR(s.gross_salary)}</div>
                    </div>
                    <div className="glass rounded-lg p-2">
                      <div className="text-slate-500 text-[10px]">Net</div>
                      <div className="text-xs font-bold" style={{ color: ORANGE }}>{fmtPKR(s.net_salary)}</div>
                    </div>
                    <div className="glass rounded-lg p-2">
                      <div className="text-slate-500 text-[10px]">From</div>
                      <div className="text-slate-300 text-[10px]">{s.effective_from}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <StructureModal
          employee={editing.employee}
          existing={editing.existing}
          onClose={()=>setEditing(null)}
          onSaved={load}/>
      )}
    </div>
  )
}
