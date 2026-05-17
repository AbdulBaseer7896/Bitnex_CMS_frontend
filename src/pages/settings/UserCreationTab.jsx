// ─────────────────────────────────────────────────────────────────────────────
// UserCreationTab — Admin Settings → "User Creation"
//
// Lets the admin choose which roles HR users are allowed to create via the
// Users page. `admin` and `hr` are NEVER permitted on this list (only an admin
// can create admins or other HRs).
//
// Backed by CompanySettings.hr_creatable_roles (JSON list).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineShieldCheck, HiOutlineCheck, HiOutlineUsers,
} from 'react-icons/hi'

const BRAND = '#44BDB2'

// Roles HR can possibly be allowed to create.
// `admin` and `hr` are excluded by design.
const CANDIDATE_ROLES = [
  { key: 'employee',   label: 'Employee',
    desc: 'Regular staff. Goes through the onboarding wizard on first login.' },
  { key: 'sales',      label: 'Sales',
    desc: 'Sales team members. Gets access to DAT / store modules.' },
  { key: 'accountant', label: 'Accountant',
    desc: 'Accounts staff. Can see expenses, payroll, financial reports.' },
  { key: 'customer',   label: 'Customer',
    desc: 'External customer accounts (not internal staff).' },
]

export default function UserCreationTab() {
  const [allowed, setAllowed] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/core/company-settings/')
        setAllowed(data.hr_creatable_roles || [])
      } catch {
        toast.error('Failed to load settings')
      } finally { setLoading(false) }
    })()
  }, [])

  const toggle = (role) => {
    setAllowed(prev => prev.includes(role)
      ? prev.filter(r => r !== role)
      : [...prev, role])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch('/core/company-settings/',
        { hr_creatable_roles: allowed })
      setAllowed(data.hr_creatable_roles || [])
      toast.success('Saved! HR can now create the selected user types.')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
             style={{ borderColor: `${BRAND}33`, borderTopColor: BRAND }}/>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-bold text-white text-xl">User Creation</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-3xl">
          You (Admin) can create users of any role. Below you can choose which user types your
          <strong className="text-white"> HR </strong>
          team is allowed to create on their own. Admin accounts and other HR accounts can only be
          created by you — these options are never available to HR.
        </p>
      </div>

      {/* Always-allowed-for-admin info card */}
      <div className="rounded-2xl p-4"
           style={{ background:'rgba(68,189,178,0.08)', border:`1px solid ${BRAND}33` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background:`${BRAND}22` }}>
            <HiOutlineShieldCheck className="w-5 h-5" style={{ color: BRAND }}/>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              Admin (you) can create: Employee, HR, Sales, Accountant, Customer
            </div>
            <div className="text-slate-400 text-xs mt-1">
              Only the <code>admin</code> role itself cannot be created from the UI — that's
              reserved for direct database access (via <code>createsuperuser</code>).
            </div>
          </div>
        </div>
      </div>

      {/* HR-creatable role checklist */}
      <div className="rounded-2xl p-5"
           style={{ background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineUsers className="w-5 h-5" style={{ color: BRAND }}/>
          <h4 className="font-semibold text-white">HR can create these user types:</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CANDIDATE_ROLES.map(({ key, label, desc }) => {
            const on = allowed.includes(key)
            return (
              <button key={key} type="button" onClick={() => toggle(key)}
                className="rounded-xl p-3 text-left transition"
                style={{
                  background: on ? `${BRAND}14` : 'rgba(255,255,255,0.03)',
                  border: on ? `1px solid ${BRAND}66` : '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                       style={{
                         background: on ? BRAND : 'rgba(255,255,255,0.08)',
                         border: on ? `1px solid ${BRAND}` : '1px solid rgba(255,255,255,0.15)',
                       }}>
                    {on && <HiOutlineCheck className="w-4 h-4 text-slate-900"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-semibold text-sm">{label}</div>
                    <div className="text-slate-500 text-xs mt-0.5 leading-snug">{desc}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: BRAND, color: '#0f172a' }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
