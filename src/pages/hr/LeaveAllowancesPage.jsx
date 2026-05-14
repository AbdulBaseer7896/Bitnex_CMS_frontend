import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineCheck } from 'react-icons/hi'

const LEAVE_TYPES = [
  { key: 'annual',        label: 'Annual Leave',        default: 21 },
  { key: 'medical',       label: 'Medical Leave',       default: 10 },
  { key: 'casual',        label: 'Casual Leave',        default: 7  },
  { key: 'sick',          label: 'Sick Leave',          default: 7  },
  { key: 'emergency',     label: 'Emergency Leave',     default: 3  },
  { key: 'maternity',     label: 'Maternity Leave',     default: 90 },
  { key: 'paternity',     label: 'Paternity Leave',     default: 10 },
  { key: 'compensatory',  label: 'Compensatory Leave',  default: 0  },
  { key: 'unpaid',        label: 'Unpaid Leave',        default: 0  },
]

const TEAL = '#f97316'

export default function LeaveAllowancesPage() {
  const [employees, setEmployees] = useState([])
  const [selected, setSelected]   = useState(null)
  const [allowances, setAllowances] = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [year, setYear]           = useState(new Date().getFullYear())
  const [editValues, setEditValues] = useState({})

  useEffect(() => {
    api.get('/users/?role=employee').then(({ data }) => {
      setEmployees(data.results || data)
    })
  }, [])

  const loadAllowances = async (emp) => {
    setSelected(emp)
    setLoading(true)
    try {
      const { data } = await api.get(`/leaves/allowances/?employee=${emp.id}&year=${year}`)
      const list = data.results || data
      // Build edit values map
      const vals = {}
      LEAVE_TYPES.forEach(lt => {
        const existing = list.find(a => a.leave_type === lt.key)
        vals[lt.key] = {
          id: existing?.id || null,
          total_days: existing?.total_days ?? lt.default,
          carry_forward_days: existing?.carry_forward_days ?? 0,
          available_on_probation: existing?.available_on_probation ?? false,
          notes: existing?.notes ?? '',
        }
      })
      setEditValues(vals)
      setAllowances(list)
    } catch { toast.error('Failed to load allowances') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const allowancesList = LEAVE_TYPES.map(lt => ({
        leave_type: lt.key,
        total_days: editValues[lt.key]?.total_days || 0,
        carry_forward_days: editValues[lt.key]?.carry_forward_days || 0,
        available_on_probation: editValues[lt.key]?.available_on_probation || false,
        notes: editValues[lt.key]?.notes || '',
      }))
      await api.post('/leaves/allowances/bulk_set/', {
        employee: selected.id,
        year,
        allowances: allowancesList,
      })
      toast.success(`Leave allowances saved for ${selected.full_name}`)
      loadAllowances(selected)
    } catch { toast.error('Failed to save allowances') }
    finally { setSaving(false) }
  }

  const filtered = employees.filter(e =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  )

  const setVal = (leaveType, field, value) => {
    setEditValues(prev => ({
      ...prev,
      [leaveType]: { ...prev[leaveType], [field]: value }
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left: Employee list */}
      <div className="card lg:col-span-1 h-fit">
        <h3 className="font-display font-bold text-white mb-4">Select Employee</h3>
        <div className="relative mb-3">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employee..." className="input pl-9 text-sm py-2" />
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {filtered.map(emp => (
            <button key={emp.id}
              onClick={() => loadAllowances(emp)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                selected?.id === emp.id
                  ? 'bg-[#f97316]/15 border border-orange-500/25 text-[#f97316]'
                  : 'hover:bg-white/[0.05] text-slate-300'
              }`}>
              <div className="font-medium text-sm">{emp.full_name}</div>
              <div className="text-xs text-slate-500">{emp.department} · {emp.designation}</div>
              <div className={`text-[10px] mt-0.5 capitalize ${
                emp.employment_status === 'probation' ? 'text-amber-400' :
                emp.employment_status === 'notice_period' ? 'text-red-400' :
                'text-slate-600'
              }`}>{emp.employment_status}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Allowances editor */}
      <div className="lg:col-span-2">
        {!selected ? (
          <div className="card h-64 flex items-center justify-center text-slate-500 text-center">
            <div>
              <HiOutlinePlus className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Select an employee to set their leave allowances</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="font-display font-bold text-white text-lg">{selected.full_name}</h3>
                <p className="text-slate-500 text-sm">{selected.department} · Leave Allowances</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={year}
                  onChange={e => { setYear(+e.target.value); if (selected) loadAllowances(selected) }}
                  className="input py-2 text-sm w-28">
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y} className="bg-slate-900">{y}</option>
                  ))}
                </select>
                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5 disabled:opacity-60">
                  <HiOutlineCheck className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save All'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-orange-500/30 border-t-[#f97316] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {LEAVE_TYPES.map(lt => {
                  const v = editValues[lt.key] || {}
                  return (
                    <div key={lt.key} className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium text-sm">{lt.label}</span>
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                          <input type="checkbox"
                            checked={v.available_on_probation || false}
                            onChange={e => setVal(lt.key, 'available_on_probation', e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#f97316]" />
                          Available on probation
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Total Days</label>
                          <input type="number" min="0" max="365"
                            value={v.total_days ?? 0}
                            onChange={e => setVal(lt.key, 'total_days', +e.target.value)}
                            className="input py-2 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Carry Forward</label>
                          <input type="number" min="0" max="365"
                            value={v.carry_forward_days ?? 0}
                            onChange={e => setVal(lt.key, 'carry_forward_days', +e.target.value)}
                            className="input py-2 text-sm" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
