import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineUserAdd, HiOutlineSearch, HiOutlinePencil,
  HiOutlineKey, HiOutlineX, HiOutlineCheck, HiOutlineChevronDown,
  HiOutlineEye, HiOutlineEyeOff,
} from 'react-icons/hi'

const TEAL = '#f97316'

const EMP_STATUS_COLORS = {
  probation:     'bg-amber-500/15 text-amber-400',
  permanent:     'bg-[#f97316]/15 text-[#f97316]',
  contract:      'bg-sky-500/15 text-sky-400',
  notice_period: 'bg-red-500/15 text-red-400',
  resigned:      'bg-slate-500/15 text-slate-400',
  terminated:    'bg-red-900/20 text-red-300',
}

const ROLE_COLORS = {
  admin:      'bg-[#f97316]/20 text-[#f97316]',
  hr:         'bg-violet-500/20 text-violet-400',
  accountant: 'bg-emerald-500/20 text-emerald-400',
  employee:   'bg-sky-500/20 text-sky-400',
  sales:      'bg-orange-500/20 text-orange-400',
}

const FEATURES = [
  { key:'view_salary',     label:'View Salary' },
  { key:'edit_profile',    label:'Edit Profile' },
  { key:'view_reports',    label:'View Reports' },
  { key:'manage_leaves',   label:'Manage Leaves' },
  { key:'add_expenses',    label:'Add Expenses' },
  { key:'view_sales',      label:'View Sales' },
  { key:'export_data',     label:'Export Data' },
  { key:'view_audit_logs', label:'View Audit Logs' },
]

function Toggle({ on, onChange }) {
  return (
    <button type="button" onClick={onChange} className="transition-opacity hover:opacity-80 flex-shrink-0">
      {on ? (
        <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
          <rect width="42" height="22" rx="11" fill="#f97316"/><circle cx="31" cy="11" r="8" fill="white"/>
        </svg>
      ) : (
        <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
          <rect width="42" height="22" rx="11" fill="#334155"/><circle cx="11" cy="11" r="8" fill="#64748b"/>
        </svg>
      )}
    </button>
  )
}

function EditModal({ user, departments, onClose, onSave }) {
  const [tab, setTab]     = useState('info')
  const [form, setForm]   = useState({
    first_name: user.first_name||'', last_name: user.last_name||'',
    email: user.email||'', phone: user.phone||'',
    department: user.department||'', designation: user.designation||'',
    role: user.role||'employee', employment_status: user.employment_status||'probation',
    joining_date: user.joining_date||'', probation_end_date: user.probation_end_date||'',
    notice_period_days: user.notice_period_days||30, notice_period_start: user.notice_period_start||'',
    is_dept_head: user.is_dept_head||false, is_active: user.is_active!==false,
  })
  const [newPwd, setNewPwd]   = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.patch(`/users/${user.id}/`, form)
      toast.success('User updated!')
      onSave(); onClose()
    } catch(err) {
      toast.error(Object.values(err.response?.data||{}).flat().join(' ')||'Failed')
    } finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if(newPwd.length<8){toast.error('Min 8 chars'); return}
    try {
      await api.post(`/users/${user.id}/change_password/`,{new_password:newPwd})
      toast.success('Password changed!'); setNewPwd('')
    } catch { toast.error('Failed to change password') }
  }

  const handleFeatureToggle = async (key, val) => {
    try {
      await api.patch(`/users/${user.id}/features/`,{[key]:val})
      toast.success('Feature updated')
    } catch { toast.error('Failed') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl w-full max-w-2xl animate-slide-up my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[#0e1420] text-lg"
                 style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>
              {(user.first_name?.[0]||user.username?.[0]||'U').toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-white text-lg">{user.full_name||user.username}</div>
              <div className="text-slate-500 text-sm">{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiOutlineX className="w-6 h-6"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-orange-500/10 px-6">
          {[['info','Info'],['status','Employment'],['password','Password'],['features','Features']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${tab===k?'text-[#f97316] border-orange-500':'text-slate-500 border-transparent hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {tab==='info' && <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">First Name</label>
                <input className="input" value={form.first_name} onChange={e=>f('first_name',e.target.value)}/></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Last Name</label>
                <input className="input" value={form.last_name} onChange={e=>f('last_name',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input type="email" className="input" value={form.email} onChange={e=>f('email',e.target.value)}/></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Phone</label>
                <input className="input" value={form.phone} onChange={e=>f('phone',e.target.value)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">Role</label>
                <select className="input" value={form.role} onChange={e=>f('role',e.target.value)}>
                  {['admin','hr','accountant','employee','sales'].map(r=>(
                    <option key={r} value={r} className="bg-slate-900 capitalize">{r}</option>
                  ))}
                </select></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Department</label>
                <select className="input" value={form.department} onChange={e=>f('department',e.target.value)}>
                  <option value="" className="bg-slate-900">-- Select Department --</option>
                  {departments.map(d=><option key={d.id} value={d.name} className="bg-slate-900">{d.name}</option>)}
                </select></div>
            </div>
            <div><label className="block text-xs text-slate-400 mb-1.5">Designation</label>
              <input className="input" value={form.designation} onChange={e=>f('designation',e.target.value)}/></div>
            <div className="flex items-center justify-between p-3 glass rounded-xl">
              <div><div className="text-white text-sm font-medium">Department Head</div>
                <div className="text-slate-500 text-xs">Can approve leaves for their dept</div></div>
              <Toggle on={form.is_dept_head} onChange={()=>f('is_dept_head',!form.is_dept_head)}/>
            </div>
            <div className="flex items-center justify-between p-3 glass rounded-xl">
              <div><div className="text-white text-sm font-medium">Active Account</div>
                <div className="text-slate-500 text-xs">Disable to block login</div></div>
              <Toggle on={form.is_active} onChange={()=>f('is_active',!form.is_active)}/>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
              {saving?'Saving...':'Save Changes'}
            </button>
          </>}

          {tab==='status' && <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">Employment Status</label>
                <select className="input" value={form.employment_status} onChange={e=>f('employment_status',e.target.value)}>
                  {['probation','permanent','contract','notice_period','resigned','terminated'].map(s=>(
                    <option key={s} value={s} className="bg-slate-900 capitalize">{s.replace('_',' ')}</option>
                  ))}
                </select></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Joining Date</label>
                <input type="date" className="input" value={form.joining_date} onChange={e=>f('joining_date',e.target.value)}/></div>
            </div>
            {form.employment_status==='probation'&&(
              <div><label className="block text-xs text-slate-400 mb-1.5">Probation End Date</label>
                <input type="date" className="input" value={form.probation_end_date} onChange={e=>f('probation_end_date',e.target.value)}/></div>
            )}
            {form.employment_status==='notice_period'&&(
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Notice Start</label>
                  <input type="date" className="input" value={form.notice_period_start} onChange={e=>f('notice_period_start',e.target.value)}/></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Notice Days</label>
                  <input type="number" className="input" value={form.notice_period_days} onChange={e=>f('notice_period_days',+e.target.value)}/></div>
              </div>
            )}
            {/* Quick actions */}
            {form.employment_status==='probation'&&(
              <button type="button" onClick={()=>f('employment_status','permanent')}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{background:'rgba(75,191,191,0.15)',color:TEAL,border:`1px solid rgba(75,191,191,0.25)`}}>
                <HiOutlineCheck className="w-4 h-4"/>End Probation → Make Permanent
              </button>
            )}
            <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
              {saving?'Saving...':'Update Status'}
            </button>
          </>}

          {tab==='password' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Set a new password for {user.full_name}. Min 8 characters.</p>
              <div className="relative">
                <input type={showPwd?'text':'password'} className="input pr-12"
                  placeholder="New password (min 8 chars)"
                  value={newPwd} onChange={e=>setNewPwd(e.target.value)}/>
                <button type="button" onClick={()=>setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPwd?<HiOutlineEyeOff className="w-5 h-5"/>:<HiOutlineEye className="w-5 h-5"/>}
                </button>
              </div>
              <button type="button" onClick={handleChangePassword} className="btn-primary w-full flex items-center justify-center gap-2">
                <HiOutlineKey className="w-4 h-4"/>Change Password
              </button>
            </div>
          )}

          {tab==='features' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">Toggle features for this user. Admin always has full access.</p>
              {FEATURES.map(feat=>(
                <div key={feat.key} className="flex items-center justify-between p-3 glass rounded-xl">
                  <span className="text-slate-300 text-sm">{feat.label}</span>
                  <Toggle
                    on={user.features?.[feat.key]!==false}
                    onChange={()=>handleFeatureToggle(feat.key,user.features?.[feat.key]===false)}
                  />
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  username:'', email:'', first_name:'', last_name:'',
  password:'', confirm_password:'', role:'employee',
  phone:'', department:'', designation:'',
  is_dept_head:false, employment_status:'probation',
  joining_date:'', probation_end_date:'', notice_period_days:30,
}

export default function UsersPage() {
  const [users, setUsers]           = useState([])
  const [departments, setDepts]     = useState([])
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading]       = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editUser, setEditUser]     = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [showPwd, setShowPwd]       = useState(false)

  useEffect(()=>{ fetchUsers(); fetchDepts() },[])

  const fetchUsers = async()=>{
    setLoading(true)
    try{ const{data}=await api.get('/users/'); setUsers(data.results||data) }
    catch{ toast.error('Failed to load users') }
    finally{ setLoading(false) }
  }
  const fetchDepts = async()=>{
    try{ const{data}=await api.get('/core/departments/'); setDepts(data.results||data) }
    catch{}
  }

  const handleAddUser = async(e)=>{
    e.preventDefault()
    if(form.password!==form.confirm_password){toast.error('Passwords do not match');return}
    try{
      await api.post('/users/',form)
      toast.success('User created!')
      setShowAddModal(false); setForm(EMPTY_FORM); fetchUsers()
    }catch(err){
      const d=err.response?.data
      toast.error(d?Object.values(d).flat().join(' '):'Failed')
    }
  }
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))

  const filtered=users.filter(u=>{
    if(roleFilter!=='all'&&u.role!==roleFilter)return false
    const q=search.toLowerCase()
    return !q||u.full_name?.toLowerCase().includes(q)||u.username?.toLowerCase().includes(q)||u.department?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {['all','admin','hr','accountant','employee','sales'].map(r=>(
            <button key={r} onClick={()=>setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${roleFilter===r?'text-[#f97316]':'glass text-slate-400 hover:text-white'}`}
              style={roleFilter===r?{background:'rgba(75,191,191,0.15)',border:'1px solid rgba(75,191,191,0.25)'}:{}}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..."
              className="input pl-9 py-2 text-sm w-52"/>
          </div>
          <button onClick={()=>setShowAddModal(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <HiOutlineUserAdd className="w-4 h-4"/>Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {['admin','hr','accountant','employee','sales'].map(r=>(
          <div key={r} className="glass rounded-2xl p-3 text-center">
            <div className="font-display text-2xl font-bold text-white">{users.filter(u=>u.role===r).length}</div>
            <div className="text-slate-500 text-xs capitalize mt-1">{r}</div>
          </div>
        ))}
        <div className="glass rounded-2xl p-3 text-center">
          <div className="font-display text-2xl font-bold gradient-text">{users.length}</div>
          <div className="text-slate-500 text-xs mt-1">Total</div>
        </div>
      </div>

      {/* Table */}
      {loading?(
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
               style={{borderColor:'rgba(75,191,191,0.3)',borderTopColor:TEAL}}/>
        </div>
      ):(
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead>
              <tr style={{borderBottom:'1px solid rgba(75,191,191,0.1)'}}>
                {['Employee','Role','Department','Status','Joined','Actions'].map(h=>(
                  <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?(
                <tr><td colSpan={6} className="text-center text-slate-500 py-14">No users found</td></tr>
              ):filtered.map(u=>(
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#0e1420] font-bold text-sm flex-shrink-0"
                           style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>
                        {(u.first_name?.[0]||u.username?.[0]||'U').toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{u.full_name||u.username}</div>
                        <div className="text-slate-500 text-xs">{u.email}</div>
                        {u.is_dept_head&&<div className="text-[10px] mt-0.5" style={{color:TEAL}}>Dept Head</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge capitalize text-[10px] ${ROLE_COLORS[u.role]||ROLE_COLORS.employee}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">{u.department||'—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge capitalize text-xs ${EMP_STATUS_COLORS[u.employment_status]||EMP_STATUS_COLORS.permanent}`}>
                      {u.employment_status?.replace('_',' ')||'permanent'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{u.joining_date||'—'}</td>
                  <td className="px-5 py-4">
                    <button onClick={()=>setEditUser(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors text-slate-400 hover:text-white"
                      style={{background:'rgba(255,255,255,0.06)'}}>
                      <HiOutlinePencil className="w-3.5 h-3.5"/>Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editUser&&(
        <EditModal user={editUser} departments={departments}
          onClose={()=>setEditUser(null)} onSave={fetchUsers}/>
      )}

      {/* Add User Modal */}
      {showAddModal&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-light rounded-3xl p-6 w-full max-w-2xl animate-slide-up my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-white text-xl">Add New User</h3>
              <button onClick={()=>{setShowAddModal(false);setForm(EMPTY_FORM)}} className="text-slate-400 hover:text-white">
                <HiOutlineX className="w-6 h-6"/>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">First Name</label>
                  <input className="input" value={form.first_name} onChange={e=>f('first_name',e.target.value)}/></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Last Name</label>
                  <input className="input" value={form.last_name} onChange={e=>f('last_name',e.target.value)}/></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Username *</label>
                <input required className="input" value={form.username} onChange={e=>f('username',e.target.value)}/></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Email *</label>
                <input required type="email" className="input" value={form.email} onChange={e=>f('email',e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Password *</label>
                  <div className="relative">
                    <input required type={showPwd?'text':'password'} className="input pr-10" placeholder="Min 8 chars"
                      value={form.password} onChange={e=>f('password',e.target.value)}/>
                    <button type="button" onClick={()=>setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      {showPwd?<HiOutlineEyeOff className="w-4 h-4"/>:<HiOutlineEye className="w-4 h-4"/>}
                    </button>
                  </div></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Confirm Password *</label>
                  <input required type="password" className={`input ${form.confirm_password&&form.confirm_password!==form.password?'ring-2 ring-red-500/40':''}`}
                    value={form.confirm_password} onChange={e=>f('confirm_password',e.target.value)}/>
                  {form.confirm_password&&form.confirm_password!==form.password&&(
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Role *</label>
                  <select className="input" value={form.role} onChange={e=>f('role',e.target.value)}>
                    {['admin','hr','accountant','employee','sales'].map(r=>(
                      <option key={r} value={r} className="bg-slate-900 capitalize">{r}</option>
                    ))}
                  </select></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Department</label>
                  <select className="input" value={form.department} onChange={e=>f('department',e.target.value)}>
                    <option value="" className="bg-slate-900">-- Select Department --</option>
                    {departments.map(d=><option key={d.id} value={d.name} className="bg-slate-900">{d.name}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Designation</label>
                  <input className="input" value={form.designation} onChange={e=>f('designation',e.target.value)}/></div>
                <div><label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select className="input" value={form.employment_status} onChange={e=>f('employment_status',e.target.value)}>
                    {['probation','permanent','contract'].map(s=>(
                      <option key={s} value={s} className="bg-slate-900 capitalize">{s}</option>
                    ))}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1.5">Joining Date</label>
                  <input type="date" className="input" value={form.joining_date} onChange={e=>f('joining_date',e.target.value)}/></div>
                {form.employment_status==='probation'&&(
                  <div><label className="block text-xs text-slate-400 mb-1.5">Probation End Date</label>
                    <input type="date" className="input" value={form.probation_end_date} onChange={e=>f('probation_end_date',e.target.value)}/></div>
                )}
              </div>
              <div className="flex items-center justify-between p-3 glass rounded-xl">
                <div><div className="text-white text-sm font-medium">Department Head</div>
                  <div className="text-slate-500 text-xs">Can approve dept leaves</div></div>
                <Toggle on={form.is_dept_head} onChange={()=>f('is_dept_head',!form.is_dept_head)}/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowAddModal(false);setForm(EMPTY_FORM)}} className="flex-1 btn-ghost">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
