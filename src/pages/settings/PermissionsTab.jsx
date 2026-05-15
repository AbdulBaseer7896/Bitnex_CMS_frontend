// ─────────────────────────────────────────────────────────────────────────────
// Permissions Tab (Admin → Settings → Permissions)
//
// Layout:
//   ┌──────────────────────┐  ┌────────────────────────────────────────────┐
//   │ search…              │  │ Selected user header + role pill           │
//   │ [All][Admin][HR]…    │  │  ─────────────────────────────────────────  │
//   │ ──────────────────── │  │  Core                                       │
//   │ • Ahmed Ali  (admin) │  │   ☑ Dashboard  (role default)               │
//   │ • Sara K.    (hr)    │  │  HR                                         │
//   │ • Bilal      (sales) │  │   ☐ Employees                               │
//   │ …                    │  │   ☑ Leaves                                  │
//   │                      │  │  …                                          │
//   │                      │  │  [Reset to Role Defaults] [Save Permissions]│
//   └──────────────────────┘  └────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineRefresh, HiOutlineShieldCheck,
  HiOutlineCheckCircle, HiOutlineUser,
} from 'react-icons/hi'
import { MODULES, SECTION_ORDER } from '../../utils/modules'

const ROLE_FILTERS = [
  { key:'all',        label:'All' },
  { key:'admin',      label:'Admin' },
  { key:'hr',         label:'HR' },
  { key:'accountant', label:'Accountant' },
  { key:'employee',   label:'Employee' },
  { key:'sales',      label:'Sales' },
  { key:'customer',   label:'Customer' },
]

const ROLE_DOT = {
  admin:      '#f97316',
  hr:         '#a78bfa',
  accountant: '#34d399',
  employee:   '#60a5fa',
  sales:      '#fbbf24',
  customer:   '#f472b6',
}

export default function PermissionsTab() {
  const [users, setUsers]   = useState([])
  const [loading, setLoad]  = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  // Permission state for the selected user
  const [state, setState] = useState(null)            // server snapshot
  const [draft, setDraft] = useState(new Set())       // working copy
  const [loadingPerms, setLoadingPerms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  // ── Initial user load ────────────────────────────────────────────────────
  useEffect(() => {
    setLoad(true)
    api.get('/users/?page_size=500')
      .then(r => setUsers(r.data.results || r.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoad(false))
  }, [])

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      const blob = `${u.username||''} ${u.first_name||''} ${u.last_name||''} ${u.email||''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [users, search, roleFilter])

  const selectedUser = useMemo(
    () => users.find(u => u.id === selectedId),
    [users, selectedId]
  )

  // ── Load permissions for the chosen user ─────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setState(null); setDraft(new Set()); return }
    setLoadingPerms(true)
    api.get(`/users/${selectedId}/modules/`)
      .then(({ data }) => {
        setState(data)
        setDraft(new Set(data.effective || []))
      })
      .catch(() => toast.error('Failed to load permissions'))
      .finally(() => setLoadingPerms(false))
  }, [selectedId])

  // ── Group modules by section ─────────────────────────────────────────────
  const grouped = useMemo(() => {
    const by = {}
    for (const m of MODULES) {
      if (!by[m.group]) by[m.group] = []
      by[m.group].push(m)
    }
    return SECTION_ORDER.filter(s => by[s]?.length).map(section => ({ section, items: by[section] }))
  }, [])

  const isAdminUser = selectedUser?.role === 'admin'
  const isCustomer  = selectedUser?.role === 'customer'

  const roleDefaults = useMemo(
    () => new Set(state?.role_defaults || []),
    [state]
  )

  const dirty = useMemo(() => {
    if (!state) return false
    if (state.effective.length !== draft.size) return true
    for (const s of state.effective) if (!draft.has(s)) return true
    return false
  }, [state, draft])

  const toggle = (slug) => {
    if (isAdminUser) return
    setDraft(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug); else next.add(slug)
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedUser || isAdminUser) return
    setSaving(true)
    try {
      const overrides = {}
      for (const m of MODULES) overrides[m.slug] = draft.has(m.slug)
      const { data } = await api.put(`/users/${selectedUser.id}/modules/`, { overrides })
      setState(data)
      setDraft(new Set(data.effective || []))
      toast.success(`Permissions saved for ${selectedUser.username}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save permissions'
      const blocked = err.response?.data?.blocked
      toast.error(blocked ? `${msg} (${blocked.join(', ')})` : msg)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!selectedUser || isAdminUser) return
    if (!window.confirm(`Reset ${selectedUser.username} to role defaults? Custom permissions will be cleared.`)) return
    setResetting(true)
    try {
      const { data } = await api.post(`/users/${selectedUser.id}/modules/reset/`)
      setState(data)
      setDraft(new Set(data.effective || []))
      toast.success('Reset to role defaults')
    } catch {
      toast.error('Failed to reset')
    } finally {
      setResetting(false)
    }
  }

  // Quick "bulk" buttons — fill checkboxes with a given role's defaults.
  // Lets admin say "give this employee the same modules as HR by default,
  // I'll then fine-tune from there" without ticking 7 boxes manually.
  // Note: this only updates the local draft — admin still has to click Save.
  const applyRolePreset = (role) => {
    if (!selectedUser || isAdminUser) return
    const preset = new Set()
    for (const m of MODULES) {
      // We mirror the *frontend* knowledge of role defaults derived from the
      // selected user's actual server-given defaults if the role matches the
      // selected user, otherwise we leave the current draft for unrelated
      // groups. To keep it simple: this preset just unions the role's default
      // module slugs from the registry hint we have. The backend's authority
      // is still preserved at save time.
      const fallbackDefaults = {
        admin:      MODULES.map(m => m.slug),
        hr:         ['dashboard','settings','employees','leaves_manage','leaves_own','attendance','documents','salary_manage','salary_own','reimbursements_hr','reimbursements_own'],
        accountant: ['dashboard','settings','leaves_own','attendance','salary_own','reimbursements_review','reimbursements_own','expenses','reports'],
        employee:   ['dashboard','settings','leaves_own','attendance','salary_own','reimbursements_own'],
        sales:      ['dashboard','settings','leaves_own','attendance','salary_own','reimbursements_own','expenses','store_customers','store_dat','store_payments','store_dialers','store_expenses','store_conflicts','store_report'],
        customer:   ['dashboard','store_dat','store_payments','store_dialers'],
      }
      if (fallbackDefaults[role]?.includes(m.slug)) preset.add(m.slug)
    }
    setDraft(preset)
    toast(`Loaded ${role} preset — click Save to apply`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-white text-xl">Permissions Center</h3>
          <p className="text-slate-500 text-sm mt-0.5">
            Assign or revoke individual modules for any user. Admin always has full access.
            Customers are walled off from internal modules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* ── LEFT PANEL: search + role filter + user list ─────────────── */}
        <div className="glass rounded-2xl p-3 flex flex-col" style={{ maxHeight: '70vh' }}>
          <div className="relative mb-3">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"/>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {ROLE_FILTERS.map(f => (
              <button key={f.key} onClick={() => setRoleFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  roleFilter === f.key
                    ? 'text-[#f97316]'
                    : 'text-slate-500 hover:text-white'
                }`}
                style={roleFilter === f.key
                  ? { background:'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.3)' }
                  : { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }
                }>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1">
            {loading
              ? <div className="text-slate-500 text-sm text-center py-8">Loading users…</div>
              : filtered.length === 0
                ? <div className="text-slate-500 text-sm text-center py-8">No users match.</div>
                : filtered.map(u => {
                    const isSel = u.id === selectedId
                    const initials = (u.first_name?.[0] || u.username?.[0] || 'U').toUpperCase()
                    const name = u.full_name || `${u.first_name||''} ${u.last_name||''}`.trim() || u.username
                    return (
                      <button key={u.id} onClick={() => setSelectedId(u.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                          isSel ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-white/[0.04] border border-transparent'
                        }`}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                             style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-slate-200 text-sm font-medium truncate">{name}</div>
                          <div className="text-slate-600 text-[11px] truncate">{u.username}</div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
                              style={{ color: ROLE_DOT[u.role] || '#94a3b8' }}>
                          {u.role}
                        </span>
                      </button>
                    )
                  })
            }
          </div>
        </div>

        {/* ── RIGHT PANEL: module toggles ──────────────────────────────── */}
        <div className="glass rounded-2xl p-5 flex flex-col" style={{ minHeight: '70vh' }}>
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center text-center flex-1 py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)' }}>
                <HiOutlineShieldCheck className="w-8 h-8 text-orange-400"/>
              </div>
              <div className="text-white font-display text-lg font-bold mb-1">Select a user</div>
              <div className="text-slate-500 text-sm max-w-xs">
                Pick someone from the list on the left to view and edit their module access.
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-bold flex-shrink-0"
                       style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                    {(selectedUser.first_name?.[0] || selectedUser.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">
                      {selectedUser.full_name || selectedUser.username}
                    </div>
                    <div className="text-slate-500 text-xs truncate">{selectedUser.email}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize flex-shrink-0"
                  style={{
                    background: `${ROLE_DOT[selectedUser.role] || '#94a3b8'}1f`,
                    color:      ROLE_DOT[selectedUser.role] || '#94a3b8',
                    border:    `1px solid ${ROLE_DOT[selectedUser.role] || '#94a3b8'}33`,
                  }}>
                  {selectedUser.role}
                </span>
              </div>

              {/* Banner with role context + customer note */}
              {isAdminUser && (
                <div className="mb-4 p-3 rounded-xl text-xs text-orange-300"
                     style={{ background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)' }}>
                  Admin accounts always have full access — module access cannot be changed for admins.
                </div>
              )}
              {isCustomer && (
                <div className="mb-4 p-3 rounded-xl text-xs text-pink-300"
                     style={{ background:'rgba(244,114,182,0.08)', border:'1px solid rgba(244,114,182,0.2)' }}>
                  Customers are restricted to store-facing modules only.
                  Internal modules (HR / Accounts / Admin) cannot be enabled for a customer.
                </div>
              )}

              {/* Quick role presets */}
              {!isAdminUser && (
                <div className="mb-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2">
                    Quick presets
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['admin','hr','accountant','employee','sales','customer'].map(role => (
                      <button key={role} onClick={() => applyRolePreset(role)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white capitalize transition-colors"
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Module checkboxes */}
              {loadingPerms ? (
                <div className="text-slate-500 text-sm text-center py-12">Loading permissions…</div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 -mr-1">
                  {grouped.map(({ section, items }) => (
                    <div key={section}>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2 px-1">
                        {section}
                      </div>
                      <div className="space-y-1">
                        {items.map(m => {
                          const isDefault = roleDefaults.has(m.slug)
                          const checked   = isAdminUser ? true : draft.has(m.slug)
                          const disabled  = isAdminUser
                          return (
                            <label key={m.slug}
                              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                                disabled
                                  ? 'opacity-60 cursor-not-allowed'
                                  : 'cursor-pointer hover:bg-white/[0.04]'
                              }`}
                              style={{ background:'rgba(255,255,255,0.02)' }}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-orange-500"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggle(m.slug)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-slate-200 text-sm font-medium truncate">{m.label}</div>
                                <div className="text-slate-600 text-[10px] font-mono truncate">{m.slug}</div>
                              </div>
                              {isDefault && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                                  style={{ background:'rgba(75,191,191,0.12)', color:'#5eead4', border:'1px solid rgba(75,191,191,0.2)' }}>
                                  <HiOutlineCheckCircle className="w-2.5 h-2.5"/>
                                  role default
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer actions */}
              {!isAdminUser && (
                <div className="flex gap-3 pt-4 mt-4 border-t border-white/5">
                  <button
                    onClick={handleReset}
                    disabled={resetting || saving}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    <HiOutlineRefresh className="w-4 h-4"/>
                    {resetting ? 'Resetting…' : 'Reset to Role Defaults'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[#0e1420] font-semibold text-sm disabled:opacity-50"
                    style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                    {saving ? 'Saving…' : dirty ? 'Save Permissions' : 'No Changes'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
