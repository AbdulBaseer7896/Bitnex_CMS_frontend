import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineX, HiOutlineRefresh,
  HiOutlineSearch, HiOutlineEye, HiOutlineEyeOff, HiOutlineUsers,
  HiOutlineDatabase,
} from 'react-icons/hi'

const TEAL = '#4BBFBF'

const EMPTY = {
  name: '', proxy: '', dat_email: '', dat_password: '',
  card_last_four: '', account_type: 'dat_one', is_active: true, notes: '',
}

function buildForm(a) {
  if (!a) return { ...EMPTY }
  return { ...EMPTY, ...a }
}

function DATAccountModal({ account, onClose, onSaved }) {
  const isEdit = !!account?.id
  const [form, setForm] = useState(() => buildForm(account))
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim() || !form.proxy.trim()) return toast.error('Name and proxy required')
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/store/dat-accounts/${account.id}/`, form)
        toast.success('DAT account updated')
      } else {
        await api.post('/store/dat-accounts/', form)
        toast.success('DAT account created')
      }
      onSaved(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.name?.[0] || e.response?.data?.proxy?.[0] || e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="glass-light rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
           style={{ border: '1px solid rgba(75,191,191,0.25)' }}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-xl">{isEdit ? 'Edit DAT Account' : 'Add DAT Account'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">Sales team manages these proxy/login slots</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Account Name * <span className="text-slate-600">(e.g. "Aneeq Ref")</span></label>
              <input value={form.name} onChange={e => f('name', e.target.value)} disabled={isEdit}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50 disabled:opacity-50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block font-medium">Account Type</label>
              <select value={form.account_type} onChange={e => f('account_type', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50">
                <option value="dat_one" className="bg-[#0e1420]">DAT One</option>
                <option value="dat_power" className="bg-[#0e1420]">DAT Power</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Proxy String * <span className="text-slate-600">(host:port:user:pass)</span></label>
            <input value={form.proxy} onChange={e => f('proxy', e.target.value)}
              placeholder="e.g. isp.decodo.com:10001:user-sp1545ixqj-ip-216.132.138.10:nQtP1Rn7qPs~gc45wc"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(75,191,191,0.05)', border: '1px solid rgba(75,191,191,0.12)' }}>
            <h3 className="text-[#4BBFBF] text-xs font-semibold uppercase tracking-widest">DAT Login Credentials</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">DAT Login Email</label>
                <input type="email" value={form.dat_email} onChange={e => f('dat_email', e.target.value)}
                  placeholder="email used on dat.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">DAT Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.dat_password} onChange={e => f('dat_password', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showPass ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block font-medium">Card Last 4 Digits</label>
                <input value={form.card_last_four} onChange={e => f('card_last_four', e.target.value)} maxLength={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <div onClick={() => f('is_active', !form.is_active)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.is_active ? 'bg-[#4BBFBF]' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-slate-300 text-sm">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
            {saving ? 'Saving…' : (isEdit ? 'Update Account' : 'Add DAT Account')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DATAccountsPage({ user }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [showPassFor, setShowPassFor] = useState(null)

  const canManage = ['admin', 'sales'].includes(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/store/dat-accounts/')
      setAccounts(Array.isArray(data) ? data : data.results || [])
    } catch { toast.error('Failed to load DAT accounts') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = accounts.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.dat_email?.toLowerCase().includes(search.toLowerCase()) ||
    a.proxy?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSeats = accounts.reduce((s, a) => s + (a.seat_count || 0), 0)
  const activeSeats = accounts.reduce((s, a) => s + (a.active_seat_count || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">DAT Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Proxy slots managed by the sales team. Assign customers to these accounts.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          {canManage && (
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
              <HiOutlinePlus className="w-4 h-4" /> Add DAT Account
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Accounts', value: accounts.length, color: 'text-white' },
          { label: 'Total Seats', value: totalSeats, color: 'text-[#4BBFBF]' },
          { label: 'Active Seats', value: activeSeats, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="glass-light rounded-2xl p-4" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, proxy…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#4BBFBF]/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
        </div>
      ) : (
        <div className="glass-light rounded-2xl overflow-auto" style={{ border: '1px solid rgba(75,191,191,0.1)' }}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                {['Name','Type','DAT Email','Password','Card','Proxy','Seats','Status',''].map(h => (
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-slate-500 py-12">
                  <HiOutlineDatabase className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  No DAT accounts yet
                </td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white text-sm">{a.name}</div>
                    {a.is_logged_in && <span className="text-xs text-emerald-400">● Logged In</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.account_type === 'dat_one' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {a.account_type === 'dat_one' ? 'DAT One' : 'DAT Power'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{a.dat_email || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-xs font-mono">
                        {showPassFor === a.id ? a.dat_password : '••••••••'}
                      </span>
                      {a.dat_password && (
                        <button onClick={() => setShowPassFor(showPassFor === a.id ? null : a.id)}
                          className="text-slate-600 hover:text-slate-400">
                          {showPassFor === a.id ? <HiOutlineEyeOff className="w-3 h-3" /> : <HiOutlineEye className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{a.card_last_four || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-500 text-xs font-mono truncate max-w-[150px] block" title={a.proxy}>
                      {a.proxy.split(':').slice(0, 2).join(':')}…
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <HiOutlineUsers className="w-3 h-3 text-[#4BBFBF]" />
                      <span className="text-[#4BBFBF] font-medium">{a.active_seat_count || 0}</span>
                      <span>/ {a.seat_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <button onClick={() => setModal(a)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <DATAccountModal
          account={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
