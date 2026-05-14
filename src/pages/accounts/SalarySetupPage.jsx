import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineCurrencyDollar, HiOutlinePlus,
  HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineX,
  HiOutlineCheck, HiOutlineDocumentText,
} from 'react-icons/hi'

const TEAL = '#f97316'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function SlipModal({ employee, structure, onClose, onSave }) {
  const now = new Date()
  const [form, setForm] = useState({
    employee: employee.id,
    salary_structure: structure?.id || '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    bonus: 0,
    penalty_deduction: 0,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const net = structure
    ? (parseFloat(structure.net_salary || 0) + parseFloat(form.bonus || 0) - parseFloat(form.penalty_deduction || 0))
    : 0

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/salary/slips/', form)
      toast.success('Salary slip generated!')
      onSave()
      onClose()
    } catch (err) {
      const data = err.response?.data
      toast.error(data ? Object.values(data).flat().join(' ') : 'Failed to generate slip')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-lg">Generate Salary Slip</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="glass rounded-xl p-4 mb-4">
          <div className="text-slate-500 text-xs mb-1">Employee</div>
          <div className="text-white font-semibold">{employee.full_name}</div>
          <div className="text-slate-500 text-xs">{employee.department} · {employee.designation}</div>
        </div>

        {structure && (
          <div className="glass rounded-xl p-4 mb-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Basic Salary</span>
              <span className="text-white">₨{Number(structure.basic_salary).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gross Salary</span>
              <span className="text-white">₨{Number(structure.gross_salary).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Deductions</span>
              <span className="text-red-400">-₨{Number(structure.total_deductions).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop:'1px solid rgba(75,191,191,0.1)' }}>
              <span style={{ color: TEAL }}>Net Payable</span>
              <span className="text-white">₨{Number(structure.net_salary).toLocaleString()}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Month *</label>
              <select className="input" value={form.month} onChange={e => f('month', +e.target.value)}>
                {MONTHS.map((m, i) => <option key={i+1} value={i+1} className="bg-slate-900">{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Year *</label>
              <select className="input" value={form.year} onChange={e => f('year', +e.target.value)}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Bonus (PKR)</label>
              <input type="number" min="0" className="input" value={form.bonus}
                onChange={e => f('bonus', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Penalty Deduction</label>
              <input type="number" min="0" className="input" value={form.penalty_deduction}
                onChange={e => f('penalty_deduction', e.target.value)} />
            </div>
          </div>

          <div className="glass rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 text-sm font-medium">Net Payable This Month</span>
            <span className="font-display font-bold text-lg" style={{ color: TEAL }}>
              ₨{net.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
            <textarea className="input h-16 resize-none text-sm" placeholder="Optional notes..."
              value={form.notes} onChange={e => f('notes', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving ? 'Generating...' : 'Generate Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SalaryFormModal({ employee, existing, onClose, onSave }) {
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
    effective_from: existing?.effective_from || new Date().toISOString().slice(0, 10),
    notes: existing?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const gross = ['basic_salary','house_allowance','transport_allowance','medical_allowance','other_allowances']
    .reduce((s, k) => s + (parseFloat(form[k]) || 0), 0)
  const deductions = ['tax_deduction','provident_fund','other_deductions']
    .reduce((s, k) => s + (parseFloat(form[k]) || 0), 0)
  const net = gross - deductions

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (existing) {
        await api.patch(`/salary/structures/${existing.id}/`, form)
        toast.success('Salary structure updated!')
      } else {
        await api.post('/salary/structures/', form)
        toast.success('Salary structure created!')
      }
      onSave()
      onClose()
    } catch (err) {
      const data = err.response?.data
      toast.error(data ? Object.values(data).flat().join(' ') : 'Failed to save')
    } finally { setSaving(false) }
  }

  const Field = ({ label, field, prefix = '₨' }) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{prefix}</span>
        <input type="number" min="0" className="input pl-8 text-sm"
          value={form[field]} onChange={e => f(field, e.target.value)} />
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-2xl animate-slide-up my-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-white text-xl">
              {existing ? 'Update' : 'Set'} Salary Structure
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">{employee.full_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiOutlineX className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Allowances */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Allowances
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Basic Salary *" field="basic_salary" />
              <Field label="House Allowance" field="house_allowance" />
              <Field label="Transport Allowance" field="transport_allowance" />
              <Field label="Medical Allowance" field="medical_allowance" />
              <Field label="Other Allowances" field="other_allowances" />
            </div>
          </div>

          {/* Deductions */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Deductions
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Income Tax" field="tax_deduction" />
              <Field label="Provident Fund" field="provident_fund" />
              <Field label="Other Deductions" field="other_deductions" />
            </div>
          </div>

          {/* Live summary */}
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gross Salary</span>
              <span className="text-white font-semibold">₨{gross.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Deductions</span>
              <span className="text-red-400">- ₨{deductions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2"
                 style={{ borderTop:'1px solid rgba(75,191,191,0.12)' }}>
              <span style={{ color: TEAL }}>Net Salary</span>
              <span className="text-white">₨{net.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Effective From *</label>
              <input required type="date" className="input" value={form.effective_from}
                onChange={e => f('effective_from', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
              <input className="input" placeholder="Optional notes" value={form.notes}
                onChange={e => f('notes', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving ? 'Saving...' : (existing ? 'Update Structure' : 'Create Structure')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EmployeeRow({ emp, onEdit, onGenerate }) {
  const [expanded, setExpanded] = useState(false)
  const [structure, setStructure] = useState(null)
  const [slips, setSlips] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const loadDetails = async () => {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (structure !== null) return // already loaded
    setLoadingDetails(true)
    try {
      const [strRes, slipRes] = await Promise.all([
        api.get(`/salary/structures/?employee=${emp.id}`),
        api.get(`/salary/slips/?employee=${emp.id}`),
      ])
      const structs = strRes.data.results || strRes.data
      setStructure(structs[0] || null)
      setSlips((slipRes.data.results || slipRes.data).slice(0, 6))
    } catch { toast.error('Failed to load salary details') }
    finally { setLoadingDetails(false) }
  }

  const markPaid = async (slipId) => {
    try {
      await api.post(`/salary/slips/${slipId}/mark_paid/`, {})
      setSlips(prev => prev.map(s => s.id === slipId ? { ...s, status: 'paid' } : s))
      toast.success('Marked as paid')
    } catch { toast.error('Failed to mark paid') }
  }

  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer"
          style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
          onClick={loadDetails}>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#0e1420] font-bold text-sm flex-shrink-0"
                 style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
              {(emp.first_name?.[0] || emp.username?.[0] || 'E').toUpperCase()}
            </div>
            <div>
              <div className="text-white font-medium text-sm">{emp.full_name || emp.username}</div>
              <div className="text-slate-500 text-xs">{emp.department}</div>
            </div>
          </div>
        </td>
        <td className="px-5 py-4 text-slate-400 text-sm">{emp.designation || '—'}</td>
        <td className="px-5 py-4">
          <span className={`badge capitalize text-xs ${
            emp.employment_status === 'probation' ? 'bg-amber-500/15 text-amber-400' :
            emp.employment_status === 'permanent' ? 'bg-[#f97316]/15 text-[#f97316]' :
            'bg-slate-500/15 text-slate-400'
          }`}>{emp.employment_status || 'permanent'}</span>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <button onClick={e => { e.stopPropagation(); onEdit(emp) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-slate-400 hover:text-white"
              style={{ background:'rgba(255,255,255,0.06)' }}>
              Set Salary
            </button>
            <button onClick={e => { e.stopPropagation(); onGenerate(emp) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background:'rgba(75,191,191,0.15)', color: TEAL }}>
              Generate Slip
            </button>
            {expanded
              ? <HiOutlineChevronUp className="w-4 h-4 text-slate-500" />
              : <HiOutlineChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr style={{ background:'rgba(75,191,191,0.03)' }}>
          <td colSpan={4} className="px-5 py-4">
            {loadingDetails ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                <div className="w-4 h-4 border border-orange-500/40 border-t-[#f97316] rounded-full animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current structure */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Current Salary Structure
                  </div>
                  {structure ? (
                    <div className="glass rounded-xl p-4 space-y-2 text-sm">
                      {[
                        ['Basic', structure.basic_salary],
                        ['House Allowance', structure.house_allowance],
                        ['Transport', structure.transport_allowance],
                        ['Medical', structure.medical_allowance],
                        ['Other Allowances', structure.other_allowances],
                      ].map(([l, v]) => v > 0 && (
                        <div key={l} className="flex justify-between">
                          <span className="text-slate-500">{l}</span>
                          <span className="text-slate-300">₨{Number(v).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between" style={{ borderTop:'1px solid rgba(75,191,191,0.1)', paddingTop:'6px' }}>
                        <span className="text-red-400 text-xs">Deductions</span>
                        <span className="text-red-400 text-xs">-₨{Number(structure.total_deductions).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1">
                        <span style={{ color: TEAL }}>Net Salary</span>
                        <span className="text-white">₨{Number(structure.net_salary).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-600 text-xs">Effective: {structure.effective_from}</div>
                    </div>
                  ) : (
                    <div className="glass rounded-xl p-4 text-slate-500 text-sm text-center">
                      No salary structure set yet.
                      <button onClick={() => onEdit(emp)}
                        className="block mx-auto mt-2 text-[#f97316] text-xs hover:underline">
                        + Set Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent slips */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Recent Salary Slips
                  </div>
                  {slips.length === 0 ? (
                    <div className="glass rounded-xl p-4 text-slate-500 text-sm text-center">
                      No slips generated yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {slips.map(s => (
                        <div key={s.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                          <div>
                            <div className="text-white text-sm font-medium">{MONTHS[s.month-1]} {s.year}</div>
                            <div className="text-slate-500 text-xs">₨{Number(s.net_payable||0).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge text-xs ${s.status === 'paid' ? 'bg-[#f97316]/15 text-[#f97316]' : 'bg-amber-500/15 text-amber-400'}`}>
                              {s.status}
                            </span>
                            {s.status !== 'paid' && (
                              <button onClick={() => markPaid(s.id)}
                                className="text-xs px-2 py-1 rounded-lg transition-colors"
                                style={{ background:'rgba(75,191,191,0.12)', color: TEAL }}>
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function SalarySetupPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [salaryModal, setSalaryModal] = useState(null) // { emp, existing }
  const [slipModal, setSlipModal]     = useState(null) // { emp, structure }

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/')
      setEmployees(data.results || data)
    } catch { toast.error('Failed to load employees') }
    finally { setLoading(false) }
  }

  const handleEditSalary = async (emp) => {
    // Load existing structure first
    try {
      const { data } = await api.get(`/salary/structures/?employee=${emp.id}`)
      const structs = data.results || data
      setSalaryModal({ emp, existing: structs[0] || null })
    } catch {
      setSalaryModal({ emp, existing: null })
    }
  }

  const handleGenerateSlip = async (emp) => {
    try {
      const { data } = await api.get(`/salary/structures/?employee=${emp.id}`)
      const structs = data.results || data
      setSlipModal({ emp, structure: structs[0] || null })
    } catch {
      setSlipModal({ emp, structure: null })
    }
  }

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    return !q || e.full_name?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-white text-xl">Salary Management</h2>
          <p className="text-slate-500 text-sm">Set salary structures and generate monthly slips</p>
        </div>
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
            className="input pl-9 py-2 text-sm w-52" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
               style={{ borderColor:'rgba(75,191,191,0.3)', borderTopColor: TEAL }} />
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(75,191,191,0.1)' }}>
                {['Employee','Designation','Status','Actions'].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-slate-500 py-14">No employees found</td></tr>
              ) : filtered.map(emp => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  onEdit={handleEditSalary}
                  onGenerate={handleGenerateSlip}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Salary structure modal */}
      {salaryModal && (
        <SalaryFormModal
          employee={salaryModal.emp}
          existing={salaryModal.existing}
          onClose={() => setSalaryModal(null)}
          onSave={() => {}}
        />
      )}

      {/* Slip generation modal */}
      {slipModal && (
        <SlipModal
          employee={slipModal.emp}
          structure={slipModal.structure}
          onClose={() => setSlipModal(null)}
          onSave={() => {}}
        />
      )}
    </div>
  )
}
