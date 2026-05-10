import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineFilter, HiOutlinePencil,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineX,
  HiOutlineUser, HiOutlinePhone, HiOutlineMail,
  HiOutlineBriefcase, HiOutlineCalendar, HiOutlineChevronDown,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'

const EMP_STATUS = {
  probation:     { label: 'Probation',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  permanent:     { label: 'Permanent',    color: 'bg-[#4BBFBF]/15 text-[#4BBFBF] border-[#4BBFBF]/25' },
  contract:      { label: 'Contract',     color: 'bg-sky-500/15 text-sky-400 border-sky-500/25' },
  notice_period: { label: 'Notice Period',color: 'bg-red-500/15 text-red-400 border-red-500/25' },
  resigned:      { label: 'Resigned',     color: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
  terminated:    { label: 'Terminated',   color: 'bg-red-900/20 text-red-300 border-red-900/30' },
}

const ROLE_COLORS = {
  admin: 'bg-[#4BBFBF]/20 text-[#4BBFBF]',
  hr: 'bg-violet-500/20 text-violet-400',
  accountant: 'bg-emerald-500/20 text-emerald-400',
  employee: 'bg-sky-500/20 text-sky-400',
  sales: 'bg-orange-500/20 text-orange-400',
}

function StatusBadge({ status }) {
  const cfg = EMP_STATUS[status] || EMP_STATUS.permanent
  return <span className={`badge border capitalize ${cfg.color}`}>{cfg.label}</span>
}

function EditModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState({
    first_name: employee.first_name || '',
    last_name: employee.last_name || '',
    email: employee.email || '',
    phone: employee.phone || '',
    department: employee.department || '',
    designation: employee.designation || '',
    employment_status: employee.employment_status || 'permanent',
    joining_date: employee.joining_date || '',
    probation_end_date: employee.probation_end_date || '',
    notice_period_days: employee.notice_period_days || 30,
    notice_period_start: employee.notice_period_start || '',
    is_dept_head: employee.is_dept_head || false,
    is_active: employee.is_active !== false,
  })
  const [saving, setSaving] = useState(false)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/users/${employee.id}/`, form)
      toast.success('Employee updated successfully!')
      onSave()
      onClose()
    } catch (err) {
      const data = err.response?.data
      toast.error(data ? Object.values(data).flat().join(' ') : 'Failed to update employee')
    } finally { setSaving(false) }
  }

  // Quick action: end probation
  const endProbation = async () => {
    setSaving(true)
    try {
      await api.patch(`/users/${employee.id}/`, {
        employment_status: 'permanent',
        probation_end_date: new Date().toISOString().slice(0, 10),
      })
      toast.success(`${employee.full_name} is now a permanent employee! 🎉`)
      onSave()
      onClose()
    } catch { toast.error('Failed to end probation') }
    finally { setSaving(false) }
  }

  // Quick action: start notice period
  const startNotice = async () => {
    setSaving(true)
    try {
      await api.patch(`/users/${employee.id}/`, {
        employment_status: 'notice_period',
        notice_period_start: new Date().toISOString().slice(0, 10),
      })
      toast.success('Notice period started.')
      onSave()
      onClose()
    } catch { toast.error('Failed to start notice period') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-2xl animate-slide-up my-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#0e1420] font-bold text-lg"
                 style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              {(employee.first_name?.[0] || employee.username?.[0] || 'E').toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-xl">{employee.full_name}</h3>
              <p className="text-slate-500 text-sm">{employee.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <HiOutlineX className="w-6 h-6" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-5">
          {employee.employment_status === 'probation' && (
            <button onClick={endProbation} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background:'rgba(75,191,191,0.15)', color: TEAL, border:`1px solid rgba(75,191,191,0.25)` }}>
              <HiOutlineCheckCircle className="w-4 h-4" />
              End Probation → Make Permanent
            </button>
          )}
          {!['notice_period','resigned','terminated'].includes(employee.employment_status) && (
            <button onClick={startNotice} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)' }}>
              <HiOutlineClock className="w-4 h-4" />
              Start Notice Period
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1.5">First Name</label>
              <input className="input" value={form.first_name} onChange={e => f('first_name', e.target.value)} /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Last Name</label>
              <input className="input" value={form.last_name} onChange={e => f('last_name', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => f('email', e.target.value)} /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Phone</label>
              <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1.5">Department</label>
              <input className="input" value={form.department} onChange={e => f('department', e.target.value)} /></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Designation</label>
              <input className="input" value={form.designation} onChange={e => f('designation', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-400 mb-1.5">Employment Status</label>
              <select className="input" value={form.employment_status} onChange={e => f('employment_status', e.target.value)}>
                {Object.entries(EMP_STATUS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">{v.label}</option>
                ))}
              </select></div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Joining Date</label>
              <input type="date" className="input" value={form.joining_date} onChange={e => f('joining_date', e.target.value)} /></div>
          </div>

          {form.employment_status === 'probation' && (
            <div><label className="block text-xs text-slate-400 mb-1.5">Probation End Date</label>
              <input type="date" className="input" value={form.probation_end_date} onChange={e => f('probation_end_date', e.target.value)} /></div>
          )}

          {form.employment_status === 'notice_period' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">Notice Start Date</label>
                <input type="date" className="input" value={form.notice_period_start} onChange={e => f('notice_period_start', e.target.value)} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Notice Period (days)</label>
                <input type="number" min="1" className="input" value={form.notice_period_days} onChange={e => f('notice_period_days', +e.target.value)} /></div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 glass rounded-xl">
            <div>
              <div className="text-white text-sm font-medium">Department Head</div>
              <div className="text-slate-500 text-xs">Can approve leaves for their department</div>
            </div>
            <button type="button" onClick={() => f('is_dept_head', !form.is_dept_head)}
              className="transition-opacity hover:opacity-80">
              {form.is_dept_head ? (
                <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
                  <rect width="42" height="22" rx="11" fill="#4BBFBF"/><circle cx="31" cy="11" r="8" fill="white"/>
                </svg>
              ) : (
                <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
                  <rect width="42" height="22" rx="11" fill="#334155"/><circle cx="11" cy="11" r="8" fill="#64748b"/>
                </svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 glass rounded-xl">
            <div>
              <div className="text-white text-sm font-medium">Active Account</div>
              <div className="text-slate-500 text-xs">Disable to block login access</div>
            </div>
            <button type="button" onClick={() => f('is_active', !form.is_active)}
              className="transition-opacity hover:opacity-80">
              {form.is_active ? (
                <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
                  <rect width="42" height="22" rx="11" fill="#4BBFBF"/><circle cx="31" cy="11" r="8" fill="white"/>
                </svg>
              ) : (
                <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
                  <rect width="42" height="22" rx="11" fill="#334155"/><circle cx="11" cy="11" r="8" fill="#64748b"/>
                </svg>
              )}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter]   = useState('all')
  const [editingEmp, setEditingEmp]   = useState(null)

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/')
      setEmployees(data.results || data)
    } catch { toast.error('Failed to load employees') }
    finally { setLoading(false) }
  }

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))]

  const filtered = employees.filter(e => {
    if (statusFilter !== 'all' && e.employment_status !== statusFilter) return false
    if (deptFilter !== 'all' && e.department !== deptFilter) return false
    const q = search.toLowerCase()
    return !q || e.full_name?.toLowerCase().includes(q) ||
                 e.department?.toLowerCase().includes(q) ||
                 e.designation?.toLowerCase().includes(q)
  })

  const counts = {
    total:        employees.length,
    probation:    employees.filter(e => e.employment_status === 'probation').length,
    permanent:    employees.filter(e => e.employment_status === 'permanent').length,
    notice:       employees.filter(e => e.employment_status === 'notice_period').length,
    dept_heads:   employees.filter(e => e.is_dept_head).length,
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',        val: counts.total,     color: TEAL },
          { label: 'Permanent',    val: counts.permanent, color: '#10b981' },
          { label: 'Probation',    val: counts.probation, color: '#eab308' },
          { label: 'Notice Period',val: counts.notice,    color: '#ef4444' },
          { label: 'Dept Heads',   val: counts.dept_heads,color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-slate-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'probation', 'permanent', 'contract', 'notice_period'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? 'text-[#4BBFBF]' : 'glass text-slate-400 hover:text-white'
              }`}
              style={statusFilter === s ? { background:'rgba(75,191,191,0.15)', border:'1px solid rgba(75,191,191,0.25)' } : {}}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
          {departments.length > 0 && (
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 glass border-0 focus:outline-none">
              <option value="all" className="bg-slate-900">All Departments</option>
              {departments.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
            </select>
          )}
        </div>
        <div className="relative">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
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
                {['Employee','Department','Designation','Status','Joined',''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-500 py-14">No employees found</td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#0e1420] font-bold text-sm flex-shrink-0"
                           style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
                        {(emp.first_name?.[0] || emp.username?.[0] || 'E').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{emp.full_name || emp.username}</div>
                        <div className="text-slate-500 text-xs">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-300 text-sm">{emp.department || '—'}</div>
                    {emp.is_dept_head && (
                      <div className="text-xs mt-0.5" style={{ color: TEAL }}>Dept Head</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{emp.designation || '—'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={emp.employment_status} />
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{emp.joining_date || '—'}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => setEditingEmp(emp)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors text-slate-400 hover:text-white"
                      style={{ background:'rgba(255,255,255,0.05)' }}>
                      <HiOutlinePencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingEmp && (
        <EditModal
          employee={editingEmp}
          onClose={() => setEditingEmp(null)}
          onSave={fetchEmployees}
        />
      )}
    </div>
  )
}
