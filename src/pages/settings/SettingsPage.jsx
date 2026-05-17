import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineUser, HiOutlineOfficeBuilding, HiOutlineCog,
  HiOutlineCamera, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineX, HiOutlineClock, HiOutlineCalendar, HiOutlineDatabase,
  HiOutlinePhone, HiOutlineEye, HiOutlineEyeOff, HiOutlineRefresh,
  HiOutlineCheck, HiOutlineWifi, HiOutlineCurrencyDollar,
  HiOutlineShieldCheck, HiOutlinePhotograph, HiOutlineUsers,
} from 'react-icons/hi'
import BitnexLogo from '../../components/common/BitnexLogo'
import SalarySetupTab from './SalarySetupTab'
import LeaveAllowancesTab from './LeaveAllowancesTab'
import PermissionsTab from './PermissionsTab'
import LetterheadAssetsTab from './LetterheadAssetsTab'
import UserCreationTab from './UserCreationTab'

const TEAL = '#f97316'
const inp = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"
const lbl = "text-slate-400 text-xs mb-1 block font-medium"

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name||'', last_name: user?.last_name||'',
    email: user?.email||'', phone: user?.phone||'',
  })
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url||'')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.patch('/users/update_profile/', { ...form, avatar_url: avatarUrl })
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('upload_preset', 'bitnex_cms'); fd.append('folder', 'avatars')
      const res = await fetch('https://api.cloudinary.com/v1_1/bitnex/image/upload', { method:'POST', body:fd })
      if (res.ok) { const d = await res.json(); setAvatarUrl(d.secure_url); toast.success('Photo uploaded!') }
      else { const reader = new FileReader(); reader.onload = e => setAvatarUrl(e.target.result); reader.readAsDataURL(file) }
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div className="max-w-lg">
      <h3 className="font-display font-bold text-white text-xl mb-6">My Profile</h3>
      <div className="flex items-center gap-5 mb-6">
        <div className="relative">
          {avatarUrl
            ? <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-2xl object-cover shadow-lg"/>
            : <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-[#0e1420] font-bold text-2xl shadow-lg"
                   style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                {(user?.first_name?.[0]||user?.username?.[0]||'U').toUpperCase()}
              </div>
          }
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            style={{ background: TEAL }}>
            {uploading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              : <HiOutlineCamera className="w-4 h-4 text-[#0e1420]"/>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
        </div>
        <div>
          <div className="text-white font-semibold">{user?.first_name} {user?.last_name}</div>
          <div className="text-slate-500 text-sm">{user?.email}</div>
          <div className="mt-1 px-2 py-0.5 rounded-full text-xs inline-block capitalize"
               style={{ background:'rgba(75,191,191,0.15)', color:TEAL }}>{user?.role}</div>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>First Name</label>
            <input value={form.first_name} onChange={e => setForm(p=>({...p,first_name:e.target.value}))} className={inp}/></div>
          <div><label className={lbl}>Last Name</label>
            <input value={form.last_name} onChange={e => setForm(p=>({...p,last_name:e.target.value}))} className={inp}/></div>
        </div>
        <div><label className={lbl}>Email Address</label>
          <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} className={inp}/></div>
        <div><label className={lbl}>Phone</label>
          <input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} className={inp}/></div>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
          style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

// ── Departments Tab ───────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDept, setNewDept] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.get('/core/departments/').then(r => setDepts(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const add = async () => {
    if (!newDept.trim()) return
    setAdding(true)
    try {
      const { data } = await api.post('/core/departments/', { name: newDept.trim() })
      setDepts(p => [...p, data]); setNewDept(''); toast.success('Department added')
    } catch { toast.error('Failed to add department') }
    finally { setAdding(false) }
  }

  const del = async (id) => {
    if (!confirm('Delete this department?')) return
    try { await api.delete(`/core/departments/${id}/`); setDepts(p => p.filter(d => d.id !== id)) }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="max-w-lg">
      <h3 className="font-display font-bold text-white text-xl mb-6">Departments</h3>
      <div className="flex gap-3 mb-6">
        <input value={newDept} onChange={e => setNewDept(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="New department name…" className={`${inp} flex-1`}/>
        <button onClick={add} disabled={adding}
          className="px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm flex items-center gap-2"
          style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
          <HiOutlinePlus className="w-4 h-4"/> Add
        </button>
      </div>
      {loading ? <div className="text-slate-500 text-sm">Loading…</div> : (
        <div className="space-y-2">
          {depts.map(d => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                 style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-white text-sm">{d.name}</span>
              <button onClick={() => del(d.id)} className="text-red-400 hover:text-red-300">
                <HiOutlineTrash className="w-4 h-4"/>
              </button>
            </div>
          ))}
          {depts.length === 0 && <p className="text-slate-500 text-sm">No departments yet.</p>}
        </div>
      )}
    </div>
  )
}

// ── General Tab ───────────────────────────────────────────────────────────────
function GeneralTab() {
  const [settings, setSettings] = useState({ company_name:'', work_start:'09:00', work_end:'18:00', work_days:'Mon,Tue,Wed,Thu,Fri' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/core/company-settings/').then(r => { if (r.data?.id) setSettings(r.data) }).catch(()=>{})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      if (settings.id) await api.patch(`/core/company-settings/${settings.id}/`, settings)
      else { const { data } = await api.post('/core/company-settings/', settings); setSettings(data) }
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const f = (k, v) => setSettings(p => ({ ...p, [k]: v }))

  return (
    <div className="max-w-lg">
      <h3 className="font-display font-bold text-white text-xl mb-6">Company Settings</h3>
      <div className="space-y-4">
        <div><label className={lbl}>Company Name</label>
          <input value={settings.company_name||''} onChange={e => f('company_name', e.target.value)} className={inp}/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Work Start</label>
            <input type="time" value={settings.work_start||'09:00'} onChange={e => f('work_start', e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Work End</label>
            <input type="time" value={settings.work_end||'18:00'} onChange={e => f('work_end', e.target.value)} className={inp}/></div>
        </div>
        <div><label className={lbl}>Working Days</label>
          <input value={settings.work_days||''} onChange={e => f('work_days', e.target.value)}
            placeholder="Mon,Tue,Wed,Thu,Fri" className={inp}/></div>
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
          style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

// ── DAT Accounts Tab ──────────────────────────────────────────────────────────
function DATAccountsTab() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | account object
  const [showPassFor, setShowPassFor] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/store/dat-accounts/')
      setAccounts(Array.isArray(data) ? data : data.results || [])
    } catch { toast.error('Failed to load DAT accounts') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-white text-xl">DAT Accounts</h3>
          <p className="text-slate-500 text-sm mt-1">Proxy slots for DAT One / DAT Power. Assign these to customers.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-4 h-4"/>
          </button>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <HiOutlinePlus className="w-4 h-4"/> Add DAT Account
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label:'Total Accounts', value: accounts.length },
          { label:'Active', value: accounts.filter(a=>a.is_active).length, color:'text-emerald-400' },
          { label:'Total Seats Used', value: accounts.reduce((s,a)=>s+(a.seat_count||0),0), color:'text-[#f97316]' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background:'rgba(75,191,191,0.06)', border:'1px solid rgba(75,191,191,0.12)' }}>
            <div className={`text-2xl font-bold ${s.color||'text-white'}`}>{s.value}</div>
            <div className="text-slate-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(75,191,191,0.2)', borderTopColor:TEAL }}/></div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <HiOutlineDatabase className="w-10 h-10 mx-auto mb-2 text-slate-600"/>
          No DAT accounts yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(a => (
            <div key={a.id} className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${a.is_active ? 'rgba(75,191,191,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
              <div className="flex items-start gap-4">
                {/* Account type badge + name */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.account_type==='dat_one' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {a.account_type === 'dat_one' ? 'DAT One' : 'DAT Power'}
                    </span>
                    <span className="text-white font-semibold">{a.name}</span>
                    {a.is_logged_in && <span className="text-emerald-400 text-xs flex items-center gap-1"><HiOutlineWifi className="w-3 h-3"/>Logged In</span>}
                    {!a.is_active && <span className="text-red-400 text-xs">Inactive</span>}
                  </div>

                  {/* Credentials row */}
                  <div className="grid grid-cols-3 gap-3 mb-2">
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">DAT Email</div>
                      <div className="text-slate-300 text-xs">{a.dat_email || '—'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Password</div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-300 text-xs font-mono">{showPassFor===a.id ? a.dat_password : '••••••••'}</span>
                        {a.dat_password && (
                          <button onClick={() => setShowPassFor(showPassFor===a.id ? null : a.id)} className="text-slate-600 hover:text-slate-400">
                            {showPassFor===a.id ? <HiOutlineEyeOff className="w-3 h-3"/> : <HiOutlineEye className="w-3 h-3"/>}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Card Last 4</div>
                      <div className="text-slate-300 text-xs">{a.card_last_four || '—'}</div>
                    </div>
                  </div>

                  {/* Proxy */}
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Proxy</div>
                    <div className="text-slate-400 text-xs font-mono bg-black/20 rounded-lg px-2 py-1 break-all">{a.proxy}</div>
                  </div>
                </div>

                {/* Right side: seats + actions */}
                <div className="text-right flex-shrink-0">
                  <div className="text-[#f97316] font-bold text-lg">{a.active_seat_count||0}</div>
                  <div className="text-slate-500 text-xs">/ {a.seat_count||0} seats</div>
                  <button onClick={() => setModal(a)} className="mt-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs">
                    <HiOutlinePencil className="w-3 h-3"/> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <DATAccountModal account={modal==='new'?null:modal} onClose={()=>setModal(null)} onSaved={load}/>}
    </div>
  )
}

function DATAccountModal({ account, onClose, onSaved }) {
  const isEdit = !!account?.id
  const [form, setForm] = useState({
    name: account?.name||'', proxy: account?.proxy||'',
    dat_email: account?.dat_email||'', dat_password: account?.dat_password||'',
    card_last_four: account?.card_last_four||'',
    account_type: account?.account_type||'dat_one',
    is_active: account?.is_active ?? true, notes: account?.notes||'',
  })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const save = async () => {
    if (!form.name.trim() || !form.proxy.trim()) return toast.error('Name and proxy are required')
    setSaving(true)
    try {
      if (isEdit) { await api.patch(`/store/dat-accounts/${account.id}/`, form); toast.success('Updated') }
      else { await api.post('/store/dat-accounts/', form); toast.success('DAT account created') }
      onSaved(); onClose()
    } catch(e) {
      toast.error(e.response?.data?.name?.[0] || e.response?.data?.proxy?.[0] || e.response?.data?.detail || 'Failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" style={{ border:'1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">{isEdit?'Edit':'New'} DAT Account</h3>
            <p className="text-slate-500 text-xs mt-0.5">One account = one proxy slot (e.g. "Aneeq Ref")</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Account Name * <span className="text-slate-600 font-normal">(e.g. "Aneeq Ref")</span></label>
              <input value={form.name} onChange={e=>f('name',e.target.value)} disabled={isEdit}
                className={`${inp} ${isEdit?'opacity-50':''}`}/>
            </div>
            <div>
              <label className={lbl}>Account Type</label>
              <select value={form.account_type} onChange={e=>f('account_type',e.target.value)} className={inp}>
                <option value="dat_one" className="bg-[#0e1420]">DAT One</option>
                <option value="dat_power" className="bg-[#0e1420]">DAT Power</option>
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Proxy String * <span className="text-slate-600 font-normal">host:port:user:pass</span></label>
            <input value={form.proxy} onChange={e=>f('proxy',e.target.value)}
              placeholder="isp.decodo.com:10001:user-sp1545ixqj-ip-216.132.138.10:nQtP1Rn7qPs~gc45wc"
              className={`${inp} font-mono text-xs`}/>
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background:'rgba(75,191,191,0.05)', border:'1px solid rgba(75,191,191,0.12)' }}>
            <div className="text-[#f97316] text-xs font-semibold uppercase tracking-widest">DAT Login Credentials</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>DAT Login Email</label>
                <input type="email" value={form.dat_email} onChange={e=>f('dat_email',e.target.value)}
                  placeholder="email@example.com" className={inp}/>
              </div>
              <div>
                <label className={lbl}>DAT Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={form.dat_password} onChange={e=>f('dat_password',e.target.value)} className={`${inp} pr-10`}/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPass?<HiOutlineEyeOff className="w-4 h-4"/>:<HiOutlineEye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
              <div>
                <label className={lbl}>Card Last 4 Digits</label>
                <input value={form.card_last_four} onChange={e=>f('card_last_four',e.target.value)} maxLength={4} placeholder="3826" className={inp}/>
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={()=>f('is_active',!form.is_active)} className={`w-10 h-5 rounded-full relative transition-colors ${form.is_active?'bg-[#f97316]':'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.is_active?'left-5':'left-0.5'}`}/>
                  </div>
                  <span className="text-slate-300 text-sm">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div><label className={lbl}>Notes</label>
            <textarea value={form.notes} onChange={e=>f('notes',e.target.value)} rows={2} className={inp}/>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving?'Saving…':(isEdit?'Update':'Add Account')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Dialer Accounts Tab ───────────────────────────────────────────────────────
const DIALER_TYPES = [
  ['google_voice','Google Voice'],['ring_central','Ring Central'],
  ['nux_call','NuxCall'],['vonage','Vonage'],
  ['mighty_call','Mighty Call'],['twilio','Twilio'],['other','Other'],
]
const DIALER_COLORS = {
  google_voice:'bg-blue-500/15 text-blue-400', ring_central:'bg-orange-500/15 text-orange-400',
  nux_call:'bg-[#f97316]/15 text-[#f97316]', vonage:'bg-red-500/15 text-red-400',
  mighty_call:'bg-purple-500/15 text-purple-400', twilio:'bg-pink-500/15 text-pink-400',
  other:'bg-slate-500/15 text-slate-400',
}

function DialerAccountsTab() {
  const [subs, setSubs] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let q = []
      if (typeFilter) q.push(`dialer_type=${typeFilter}`)
      if (statusFilter) q.push(`status=${statusFilter}`)
      const qs = q.length ? `?${q.join('&')}` : ''
      const [subRes, custRes] = await Promise.all([
        api.get(`/store/dialer-subscriptions/${qs}`),
        api.get('/store/customers/'),
      ])
      setSubs(Array.isArray(subRes.data) ? subRes.data : subRes.data.results || [])
      setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.results || [])
      setProducts([])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [typeFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const typeCounts = DIALER_TYPES.reduce((acc,[v])=>({ ...acc, [v]: subs.filter(s=>s.dialer_type===v).length }), {})

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-white text-xl">Dialer Accounts</h3>
          <p className="text-slate-500 text-sm mt-1">Google Voice, Ring Central, NuxCall seats assigned to customers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-4 h-4"/>
          </button>
          <button onClick={()=>setModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <HiOutlinePlus className="w-4 h-4"/> Add Dialer Seat
          </button>
        </div>
      </div>

      {/* Type summary pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {DIALER_TYPES.filter(([v])=>typeCounts[v]>0).map(([v,l])=>(
          <button key={v} onClick={()=>setTypeFilter(typeFilter===v?'':v)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter===v ? DIALER_COLORS[v] : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            {l} <span className="opacity-60 ml-1">{typeCounts[v]}</span>
          </button>
        ))}
        {typeFilter && <button onClick={()=>setTypeFilter('')} className="px-3 py-1 rounded-full text-xs text-slate-500 hover:text-slate-300">✕ Clear</button>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(75,191,191,0.2)', borderTopColor:TEAL }}/></div>
      ) : subs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <HiOutlinePhone className="w-10 h-10 mx-auto mb-2 text-slate-600"/>
          No dialer seats yet.
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.id} className="rounded-xl p-3 flex items-center gap-4"
                 style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${DIALER_COLORS[s.dialer_type]||''}`}>
                {DIALER_TYPES.find(([v])=>v===s.dialer_type)?.[1]||s.dialer_type}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400 uppercase flex-shrink-0">{s.region}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium">{s.customer_name}</div>
                <div className="text-slate-500 text-xs truncate">{s.domain_email}</div>
              </div>
              {s.phone_number && (
                <div className="text-slate-400 text-xs flex items-center gap-1 flex-shrink-0">
                  <HiOutlinePhone className="w-3 h-3 text-[#f97316]"/>
                  {s.seat_number && <span className="text-slate-600">{s.seat_number}/</span>}
                  {s.phone_number}
                </div>
              )}
              <div className="text-emerald-400 text-sm font-medium flex-shrink-0">{s.currency} {parseFloat(s.net_price||0).toLocaleString()}</div>
              <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${s.status==='active'?'bg-emerald-500/15 text-emerald-400':s.status==='temp_off'?'bg-orange-500/15 text-orange-400':'bg-slate-500/15 text-slate-400'}`}>
                {s.status.replace('_',' ')}
              </span>
              <button onClick={()=>setModal(s)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white flex-shrink-0">
                <HiOutlinePencil className="w-3.5 h-3.5"/>
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && <DialerModal sub={modal==='new'?null:modal} customers={customers} products={products} onClose={()=>setModal(null)} onSaved={load}/>}
    </div>
  )
}

function DialerModal({ sub, customers, products, onClose, onSaved }) {
  const isEdit = !!sub?.id
  const EMPTY = {
    customer:'', product:'', status:'active', dialer_type:'google_voice', region:'us',
    domain_email:'', dialer_username:'', phone_number:'', seat_number:'', domain:'',
    list_price:'', discount:0, net_price:'', currency:'PKR',
    register_date:'', last_payment_date:'', next_due_date:'', reminder_date:'',
    sms_status:'active', rating:'', notes:'',
  }
  const [form, setForm] = useState(() => sub ? {...EMPTY,...sub, customer:sub.customer??'', product:sub.product??''} : {...EMPTY})
  const [saving, setSaving] = useState(false)
  const f = (k,v) => setForm(p=>({...p,[k]:v}))
  const calcNet = () => f('net_price', Math.max(0,(parseFloat(form.list_price)||0)-(parseFloat(form.discount)||0)))

  const save = async () => {
    if (!form.customer || !form.domain_email) return toast.error('Customer and domain email required')
    setSaving(true)
    try {
      const payload = {...form, net_price: Math.max(0,(parseFloat(form.list_price)||0)-(parseFloat(form.discount)||0))}
      if (isEdit) { await api.patch(`/store/dialer-subscriptions/${sub.id}/`, payload); toast.success('Updated') }
      else { await api.post('/store/dialer-subscriptions/', payload); toast.success('Dialer seat added') }
      onSaved(); onClose()
    } catch(e) { toast.error(e.response?.data?.detail||'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" style={{ border:'1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">{isEdit?'Edit':'Add'} Dialer Seat</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Customer *</label>
              <select value={form.customer} onChange={e=>f('customer',e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— Select —</option>
                {customers.map(c=><option key={c.id} value={c.id} className="bg-[#0e1420]">{c.contact_person}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Dialer Type</label>
              <select value={form.dialer_type} onChange={e=>f('dialer_type',e.target.value)} className={inp}>
                {DIALER_TYPES.map(([v,l])=><option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Region</label>
              <select value={form.region} onChange={e=>f('region',e.target.value)} className={inp}>
                {[['us','US'],['uk','UK'],['other','Other']].map(([v,l])=><option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Domain Email *</label>
              <input type="email" value={form.domain_email} onChange={e=>f('domain_email',e.target.value)} placeholder="user@domain.com" className={inp}/>
            </div>
            <div>
              <label className={lbl}>Domain</label>
              <input value={form.domain} onChange={e=>f('domain',e.target.value)} placeholder="realtywisechoice.com" className={inp}/>
            </div>
            <div>
              <label className={lbl}>Dialer Username</label>
              <input value={form.dialer_username} onChange={e=>f('dialer_username',e.target.value)} placeholder="e.g. Alex Wilson" className={inp}/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl}>Seat #</label>
                <input value={form.seat_number} onChange={e=>f('seat_number',e.target.value)} placeholder="120" className={inp}/>
              </div>
              <div>
                <label className={lbl}>Phone Number</label>
                <input value={form.phone_number} onChange={e=>f('phone_number',e.target.value)} placeholder="+12109444608" className={inp}/>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className={lbl}>List Price</label>
              <input type="number" value={form.list_price} onChange={e=>f('list_price',e.target.value)} onBlur={calcNet} className={inp}/></div>
            <div><label className={lbl}>Discount</label>
              <input type="number" value={form.discount} onChange={e=>f('discount',e.target.value)} onBlur={calcNet} className={inp}/></div>
            <div><label className={lbl}>Net Price</label>
              <input type="number" value={form.net_price} onChange={e=>f('net_price',e.target.value)} className={`${inp} text-[#f97316] font-medium`}/></div>
            <div><label className={lbl}>Currency</label>
              <select value={form.currency} onChange={e=>f('currency',e.target.value)} className={inp}>
                {['PKR','USD','GBP','EUR','AED'].map(c=><option key={c} value={c} className="bg-[#0e1420]">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className={lbl}>Status</label>
              <select value={form.status} onChange={e=>f('status',e.target.value)} className={inp}>
                {['active','pending','temp_off','cancelled','expired'].map(s=><option key={s} value={s} className="bg-[#0e1420]">{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div><label className={lbl}>SMS Status</label>
              <select value={form.sms_status} onChange={e=>f('sms_status',e.target.value)} className={inp}>
                {['active','inactive','pending'].map(s=><option key={s} value={s} className="bg-[#0e1420]">{s}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Rating</label>
              <input value={form.rating} onChange={e=>f('rating',e.target.value)} placeholder="P" className={inp}/></div>
            <div><label className={lbl}>Product</label>
              <select value={form.product} onChange={e=>f('product',e.target.value)} className={inp}>
                <option value="" className="bg-[#0e1420]">— None —</option>
                {products.map(p=><option key={p.id} value={p.id} className="bg-[#0e1420]">{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[['register_date','Register'],['last_payment_date','Last Payment'],['next_due_date','Next Due'],['reminder_date','Reminder']].map(([k,l])=>(
              <div key={k}><label className={lbl}>{l}</label>
                <input type="date" value={form[k]} onChange={e=>f(k,e.target.value)} className={inp}/></div>
            ))}
          </div>
          <div><label className={lbl}>Notes</label>
            <textarea value={form.notes} onChange={e=>f('notes',e.target.value)} rows={2} className={inp}/></div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {saving?'Saving…':(isEdit?'Update':'Add Dialer Seat')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const isAdmin = user?.role === 'admin'
  const isSalesHead = user?.role === 'admin' || (user?.role === 'sales' && user?.is_dept_head)
  const isSales = ['admin','sales'].includes(user?.role)
  const isHR = ['admin','hr'].includes(user?.role)

  const TABS = [
    { id:'profile',          icon:HiOutlineUser,           label:'Profile',          show: true },
    { id:'permissions',      icon:HiOutlineShieldCheck,    label:'Permissions',      show: isAdmin },
    { id:'user-creation',    icon:HiOutlineUsers,          label:'User Creation',    show: isAdmin },
    { id:'letterhead',       icon:HiOutlinePhotograph,     label:'Letterhead Assets',show: isAdmin || isHR },
    { id:'departments',      icon:HiOutlineOfficeBuilding, label:'Departments',      show: isAdmin },
    { id:'general',          icon:HiOutlineCog,            label:'General',          show: isAdmin },
    { id:'salary-setup',     icon:HiOutlineCurrencyDollar, label:'Salary Setup',     show: isHR },
    { id:'leave-allowances', icon:HiOutlineCalendar,       label:'Leave Allowances', show: isHR },
    { id:'dat-accounts',     icon:HiOutlineDatabase,       label:'DAT Accounts',     show: isSales },
    { id:'dialer-accounts',  icon:HiOutlinePhone,          label:'Dialer Accounts',  show: isSales },
  ].filter(t => t.show)

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Sidebar */}
      <div className="lg:w-56 flex-shrink-0">
        <div className="glass rounded-2xl p-3 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id ? 'text-[#f97316]' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              style={activeTab === t.id ? { background:'rgba(75,191,191,0.12)', border:'1px solid rgba(75,191,191,0.2)' } : {}}>
              <t.icon className="w-5 h-5 flex-shrink-0"/>
              {t.label}
            </button>
          ))}
        </div>

        {/* Quick info box */}
        <div className="mt-4 glass rounded-2xl p-4 text-center" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#0e1420] font-bold mx-auto mb-2"
               style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
            {(user?.first_name?.[0]||user?.username?.[0]||'U').toUpperCase()}
          </div>
          <div className="text-white text-sm font-medium truncate">{user?.first_name||user?.username}</div>
          <div className="text-slate-500 text-xs capitalize mt-0.5">{user?.role}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 card min-w-0">
        {activeTab === 'profile'          && <ProfileTab/>}
        {activeTab === 'permissions'      && isAdmin && <PermissionsTab/>}
        {activeTab === 'user-creation'    && isAdmin && <UserCreationTab/>}
        {activeTab === 'letterhead'       && (isAdmin || isHR) && <LetterheadAssetsTab/>}
        {activeTab === 'departments'      && isAdmin && <DepartmentsTab/>}
        {activeTab === 'general'          && isAdmin && <GeneralTab/>}
        {activeTab === 'salary-setup'     && isHR    && <SalarySetupTab/>}
        {activeTab === 'leave-allowances' && isHR    && <LeaveAllowancesTab/>}
        {activeTab === 'dat-accounts'     && isSales && <DATAccountsTab/>}
        {activeTab === 'dialer-accounts'  && isSales && <DialerAccountsTab/>}
      </div>
    </div>
  )
}
