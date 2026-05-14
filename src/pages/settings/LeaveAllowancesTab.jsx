import { useEffect, useState, useMemo } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineCheck, HiOutlineUsers, HiOutlineCalendar,
} from 'react-icons/hi'

const ORANGE = '#f97316'

const LEAVE_TYPES = [
  { key:'annual',       label:'Annual Leave',       default:21 },
  { key:'medical',      label:'Medical Leave',      default:10 },
  { key:'casual',       label:'Casual Leave',       default:7  },
  { key:'sick',         label:'Sick Leave',         default:7  },
  { key:'emergency',    label:'Emergency Leave',    default:3  },
  { key:'maternity',    label:'Maternity Leave',    default:90 },
  { key:'paternity',    label:'Paternity Leave',    default:10 },
  { key:'compensatory', label:'Compensatory Leave', default:0  },
  { key:'unpaid',       label:'Unpaid Leave',       default:0  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Leave Allowances Tab (Settings)
//
// Moved here from the sidebar's "Leave Allowances" item — this is rarely-edited
// configuration. Per-employee, per-year leave entitlements for each leave type.
// ─────────────────────────────────────────────────────────────────────────────
export default function LeaveAllowancesTab() {
  const [employees, setEmployees] = useState([])
  const [selected,  setSelected]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [year,      setYear]      = useState(new Date().getFullYear())
  const [editValues,setEditValues]= useState({})

  useEffect(() => {
    api.get('/users/').then(({ data }) => {
      const list = (data.results || data).filter(u => u.role !== 'customer')
      setEmployees(list)
    }).catch(() => toast.error('Failed to load employees'))
  }, [])

  const loadAllowances = async (emp) => {
    setSelected(emp)
    setLoading(true)
    try {
      const { data } = await api.get(`/leaves/allowances/?employee=${emp.id}&year=${year}`)
      const list = data.results || data
      const vals = {}
      LEAVE_TYPES.forEach(lt => {
        const existing = list.find(a => a.leave_type === lt.key)
        vals[lt.key] = {
          id: existing?.id || null,
          total_days: existing?.total_days ?? lt.default,
          used_days: existing?.used_days ?? 0,
          carry_forward_days: existing?.carry_forward_days ?? 0,
          available_on_probation: existing?.available_on_probation ?? false,
          notes: existing?.notes ?? '',
        }
      })
      setEditValues(vals)
    } catch { toast.error('Failed to load allowances') }
    finally { setLoading(false) }
  }

  // Re-load when year changes
  useEffect(() => {
    if (selected) loadAllowances(selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

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
        employee: selected.id, year, allowances: allowancesList,
      })
      toast.success(`Allowances saved for ${selected.full_name || selected.username}`)
      loadAllowances(selected)
    } catch { toast.error('Failed to save allowances') }
    finally { setSaving(false) }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return employees.filter(e =>
      !q ||
      e.full_name?.toLowerCase().includes(q) ||
      e.username?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      e.designation?.toLowerCase().includes(q)
    )
  }, [employees, search])

  const setVal = (leaveType, field, value) => {
    setEditValues(prev => ({
      ...prev,
      [leaveType]: { ...prev[leaveType], [field]: value }
    }))
  }

  const totalEntitled = useMemo(() => {
    return Object.values(editValues).reduce(
      (s, v) => s + Number(v.total_days || 0) + Number(v.carry_forward_days || 0),
      0
    )
  }, [editValues])

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-white text-xl">Leave Allowances</h3>
          <p className="text-slate-500 text-sm mt-0.5">
            Configure annual leave entitlements per employee. Updates apply for the selected year.
          </p>
        </div>
        <select value={year} onChange={e => setYear(+e.target.value)}
          className="input py-2 text-sm w-auto pr-8">
          {[year - 1, year, year + 1].map(y => (
            <option key={y} value={y} className="bg-[#0d0f14]">{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — employee list */}
        <div className="glass rounded-2xl p-4 lg:col-span-1 h-fit">
          <div className="relative mb-3">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employee…" className="input pl-9 text-sm py-2"/>
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <HiOutlineUsers className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                No employees match
              </div>
            ) : filtered.map(emp => (
              <button key={emp.id} onClick={() => loadAllowances(emp)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                  selected?.id === emp.id
                    ? 'bg-orange-500/15 border border-orange-500/25'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                       style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                    {emp.full_name?.[0]?.toUpperCase() || emp.username?.[0]?.toUpperCase() || 'E'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium truncate ${selected?.id === emp.id ? 'text-orange-300' : 'text-white'}`}>
                      {emp.full_name || emp.username}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {emp.department || '—'} · {emp.designation || '—'}
                    </div>
                  </div>
                </div>
                <div className={`text-[10px] mt-1 capitalize ${
                  emp.employment_status === 'probation' ? 'text-amber-400' :
                  emp.employment_status === 'notice_period' ? 'text-red-400' :
                  'text-slate-600'
                }`}>
                  {emp.employment_status?.replace('_', ' ') || 'permanent'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right — editor */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="glass rounded-2xl h-64 flex items-center justify-center text-slate-500 text-center">
              <div>
                <HiOutlineCalendar className="w-10 h-10 mx-auto mb-3 opacity-20"/>
                <p className="text-sm">Select an employee to set their leave allowances</p>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h3 className="font-display font-bold text-white text-lg">{selected.full_name || selected.username}</h3>
                  <p className="text-slate-500 text-xs">
                    {selected.department || '—'} · Allowances for {year}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider">Total Entitled</div>
                    <div className="font-display font-bold text-white text-lg">
                      {totalEntitled} <span className="text-slate-500 text-xs font-normal">days</span>
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="btn-primary flex items-center gap-2 text-xs px-4 py-2 disabled:opacity-60">
                    <HiOutlineCheck className="w-3.5 h-3.5"/>
                    {saving ? 'Saving…' : 'Save All'}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-2 rounded-full animate-spin"
                       style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor: ORANGE }}/>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LEAVE_TYPES.map(lt => {
                    const v = editValues[lt.key] || {}
                    const usedPct = v.total_days > 0
                      ? Math.min((v.used_days || 0) / v.total_days * 100, 100) : 0
                    return (
                      <div key={lt.key} className="glass-light rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium text-sm">{lt.label}</span>
                          {v.used_days > 0 && (
                            <span className="text-[10px] text-slate-500">
                              {v.used_days} / {v.total_days} used
                            </span>
                          )}
                        </div>
                        {v.used_days > 0 && (
                          <div className="h-1 rounded-full overflow-hidden mb-3"
                               style={{ background:'rgba(255,255,255,0.06)' }}>
                            <div className="h-full rounded-full"
                                 style={{ width: usedPct + '%', background: ORANGE }}/>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 mb-0.5 block uppercase tracking-wider">Total Days</label>
                            <input type="number" min="0" max="365"
                              value={v.total_days ?? 0}
                              onChange={e => setVal(lt.key, 'total_days', +e.target.value)}
                              className="input py-1.5 text-sm"/>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 mb-0.5 block uppercase tracking-wider">Carry Forward</label>
                            <input type="number" min="0" max="365"
                              value={v.carry_forward_days ?? 0}
                              onChange={e => setVal(lt.key, 'carry_forward_days', +e.target.value)}
                              className="input py-1.5 text-sm"/>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer mt-2 select-none">
                          <input type="checkbox"
                            checked={v.available_on_probation || false}
                            onChange={e => setVal(lt.key, 'available_on_probation', e.target.checked)}
                            className="w-3.5 h-3.5 accent-orange-500"/>
                          Available during probation
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
