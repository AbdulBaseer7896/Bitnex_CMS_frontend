import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlinePencil,
  HiOutlineX, HiOutlineUserAdd,
  HiOutlineEye, HiOutlineEyeOff,
} from 'react-icons/hi'

const TEAL = '#f97316'

const EMP_STATUS = {
  probation:     { label: 'Probation',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  permanent:     { label: 'Permanent',    color: 'bg-[#f97316]/15 text-[#f97316] border-orange-500/25' },
  contract:      { label: 'Contract',     color: 'bg-sky-500/15 text-sky-400 border-sky-500/25' },
  notice_period: { label: 'Notice Period',color: 'bg-red-500/15 text-red-400 border-red-500/25' },
  resigned:      { label: 'Resigned',     color: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
  terminated:    { label: 'Terminated',   color: 'bg-red-900/20 text-red-300 border-red-900/30' },
}

function StatusBadge({ status }) {
  const cfg = EMP_STATUS[status] || EMP_STATUS.permanent
  return <span className={`badge border capitalize ${cfg.color}`}>{cfg.label}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────────────────────────────────────
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
    e.preventDefault(); setSaving(true)
    try {
      await api.patch(`/users/${employee.id}/`, form)
      toast.success('Employee updated successfully!')
      onSave(); onClose()
    } catch (err) {
      const data = err.response?.data
      toast.error(data ? Object.values(data).flat().join(' ') : 'Failed to update employee')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-2xl animate-slide-up my-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-white text-xl">Edit Employee</h3>
            <p className="text-slate-500 text-sm">{employee.full_name || employee.username}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-6 h-6"/>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">First Name</label>
              <input className="input" value={form.first_name} onChange={e => f('first_name', e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Last Name</label>
              <input className="input" value={form.last_name} onChange={e => f('last_name', e.target.value)}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => f('email', e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Phone</label>
              <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Department</label>
              <input className="input" value={form.department} onChange={e => f('department', e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Designation</label>
              <input className="input" value={form.designation} onChange={e => f('designation', e.target.value)}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Status</label>
              <select className="input" value={form.employment_status} onChange={e => f('employment_status', e.target.value)}>
                {['probation','permanent','contract','notice_period','resigned','terminated'].map(s => (
                  <option key={s} value={s} className="bg-slate-900 capitalize">{s.replace('_',' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Joining Date</label>
              <input type="date" className="input" value={form.joining_date} onChange={e => f('joining_date', e.target.value)}/>
            </div>
          </div>
          {form.employment_status === 'probation' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Probation End Date</label>
              <input type="date" className="input" value={form.probation_end_date} onChange={e => f('probation_end_date', e.target.value)}/>
            </div>
          )}
          {form.employment_status === 'notice_period' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notice Start</label>
                <input type="date" className="input" value={form.notice_period_start} onChange={e => f('notice_period_start', e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notice Days</label>
                <input type="number" className="input" value={form.notice_period_days} onChange={e => f('notice_period_days', +e.target.value)}/>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 glass rounded-xl">
            <input type="checkbox" id="is_dept_head" checked={form.is_dept_head}
              onChange={e => f('is_dept_head', e.target.checked)}
              className="w-4 h-4 accent-orange-500"/>
            <label htmlFor="is_dept_head" className="text-sm text-slate-300 cursor-pointer">
              Department Head — can approve leaves for this department
            </label>
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

// ─────────────────────────────────────────────────────────────────────────────
// Add User Modal — replaces the old "Add Employee" sidebar route
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_USER = {
  username: '', email: '', first_name: '', last_name: '',
  password: '', confirm_password: '', role: 'employee',
  phone: '', department: '', designation: '',
  is_dept_head: false, employment_status: 'probation',
  joining_date: '', probation_end_date: '', notice_period_days: 30,
}

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_USER)
  const [departments, setDepartments] = useState([])
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    api.get('/core/departments/').then(({ data }) => {
      setDepartments(data.results || data || [])
    }).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match'); return
    }
    setSaving(true)
    try {
      await api.post('/users/', form)
      toast.success('User created!')
      onCreated()
      onClose()
    } catch (err) {
      const d = err.response?.data
      toast.error(d ? Object.values(d).flat().join(' ') : 'Failed to create user')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-2xl animate-slide-up my-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <HiOutlineUserAdd className="w-5 h-5 text-white"/>
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-xl">Add User</h3>
              <p className="text-slate-500 text-sm">Create a new user account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-6 h-6"/>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">First Name</label>
              <input className="input" value={form.first_name} onChange={e => f('first_name', e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Last Name</label>
              <input className="input" value={form.last_name} onChange={e => f('last_name', e.target.value)}/>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Username *</label>
            <input required className="input" value={form.username} onChange={e => f('username', e.target.value)}/>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email *</label>
            <input required type="email" className="input" value={form.email} onChange={e => f('email', e.target.value)}/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password *</label>
              <div className="relative">
                <input required type={showPwd ? 'text' : 'password'} className="input pr-10"
                  placeholder="Min 8 chars"
                  value={form.password} onChange={e => f('password', e.target.value)}/>
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPwd ? <HiOutlineEyeOff className="w-4 h-4"/> : <HiOutlineEye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm Password *</label>
              <input required type="password"
                className={`input ${form.confirm_password && form.confirm_password !== form.password ? 'ring-2 ring-red-500/40' : ''}`}
                value={form.confirm_password} onChange={e => f('confirm_password', e.target.value)}/>
              {form.confirm_password && form.confirm_password !== form.password && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Role *</label>
              <select className="input" value={form.role} onChange={e => f('role', e.target.value)}>
                {['admin','hr','accountant','employee','sales'].map(r => (
                  <option key={r} value={r} className="bg-slate-900 capitalize">{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Department</label>
              <select className="input" value={form.department} onChange={e => f('department', e.target.value)}>
                <option value="" className="bg-slate-900">— Select —</option>
                {departments.map(d => (
                  <option key={d.id || d.name} value={d.name} className="bg-slate-900">{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Designation</label>
              <input className="input" value={form.designation} onChange={e => f('designation', e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Phone</label>
              <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Status</label>
              <select className="input" value={form.employment_status} onChange={e => f('employment_status', e.target.value)}>
                {['probation','permanent','contract'].map(s => (
                  <option key={s} value={s} className="bg-slate-900 capitalize">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Joining Date</label>
              <input type="date" className="input" value={form.joining_date} onChange={e => f('joining_date', e.target.value)}/>
            </div>
          </div>
          {form.employment_status === 'probation' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Probation End Date</label>
              <input type="date" className="input" value={form.probation_end_date} onChange={e => f('probation_end_date', e.target.value)}/>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 glass rounded-xl">
            <input type="checkbox" id="add_dept_head" checked={form.is_dept_head}
              onChange={e => f('is_dept_head', e.target.checked)}
              className="w-4 h-4 accent-orange-500"/>
            <label htmlFor="add_dept_head" className="text-sm text-slate-300 cursor-pointer">
              Department Head — can approve leaves for the dept
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter]   = useState('all')
  const [editingEmp, setEditingEmp]   = useState(null)
  const [showAdd, setShowAdd]         = useState(false)

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
      {/* Header with Add User button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Employees</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage team members and their employment status</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
          <HiOutlineUserAdd className="w-4 h-4"/>
          Add User
        </button>
      </div>

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
                statusFilter === s ? 'text-[#f97316]' : 'glass text-slate-400 hover:text-white'
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
                           style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
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
        <EditModal employee={editingEmp}
          onClose={() => setEditingEmp(null)} onSave={fetchEmployees}/>
      )}
      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onCreated={fetchEmployees}/>
      )}
    </div>
  )
}
