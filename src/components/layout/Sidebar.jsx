import { useState, useRef, useEffect, useCallback, createContext, useContext, useMemo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import BitnexLogo from '../common/BitnexLogo'
import {
  HiOutlineLogout, HiOutlineMenuAlt2, HiX,
  HiOutlineShieldCheck, HiOutlineCog, HiOutlineChevronDown,
} from 'react-icons/hi'
import { buildNavForUser } from '../../utils/modules'

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — driven by the user's `modules` array (effective module slugs from
// the server). The visual layout (icons, labels, grouping) comes from
// utils/modules.js. We no longer hardcode a nav config per role here, so adding
// or revoking a module for any user updates the sidebar on next login/refresh
// without any code change.
// ─────────────────────────────────────────────────────────────────────────────

const roleColors = {
  admin:      'bg-orange-500/15 text-orange-400',
  hr:         'bg-violet-500/15 text-violet-400',
  accountant: 'bg-emerald-500/15 text-emerald-400',
  employee:   'bg-sky-500/15 text-sky-400',
  sales:      'bg-amber-500/15 text-amber-400',
  customer:   'bg-pink-500/15 text-pink-400',
}

function UserFooter({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef()

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const initials = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name||''}`.trim() : user?.username

  return (
    <div className="relative p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-white"
             style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-white text-sm font-medium truncate">{displayName}</div>
          <div className="text-slate-600 text-xs capitalize">{user?.role}</div>
        </div>
        <HiOutlineChevronDown className={`w-4 h-4 text-slate-600 flex-shrink-0 transition-transform duration-200 ${open?'rotate-180':''}`}/>
      </button>

      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl overflow-hidden shadow-2xl z-50"
             style={{ background:'rgba(13,15,20,0.99)', border:'1px solid rgba(249,115,22,0.2)', backdropFilter:'blur(24px)' }}>
          <button onClick={() => { navigate('/settings'); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/[0.04] hover:text-white transition-colors text-sm">
            <HiOutlineCog className="w-4 h-4"/> Settings
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <HiOutlineLogout className="w-4 h-4"/> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

// ── Badge contexts (carried over) ─────────────────────────────────────────────
const PendingCtx = createContext({ dat: 0, dialer: 0, total: 0 })
export function usePendingClaims() { return useContext(PendingCtx) }
const LeaveCtx = createContext({ pending: 0 })
export function usePendingLeaves() { return useContext(LeaveCtx) }
const ReimbCtx = createContext({ finance: 0, hr: 0, mine: 0 })
export function usePendingReimb() { return useContext(ReimbCtx) }

const LEAVE_NAV_PATHS = new Set(['/hr/leaves', '/dept/leaves', '/employee/leaves'])

function NavList({ items, onNavigate }) {
  const pending = useContext(PendingCtx)
  const leaves  = useContext(LeaveCtx)
  const reimb   = useContext(ReimbCtx)
  const { user } = useAuth()
  const role = user?.role

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
      {items.map((item, idx) => {
        if (item.divider) {
          return (
            <div key={`div-${idx}`} className="px-2 pt-5 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">{item.divider}</span>
            </div>
          )
        }
        const Icon = item.icon
        const isPayments = item.to === '/store/payments'
        const isLeaves   = LEAVE_NAV_PATHS.has(item.to)
        const isReimb    = item.to === '/reimbursements'
        let badge = 0
        let badgeStyle = null
        if (isPayments && pending.total > 0) {
          badge = pending.total
          badgeStyle = { background:'rgba(234,179,8,0.2)', color:'#fbbf24', border:'1px solid rgba(234,179,8,0.25)' }
        }
        if (isLeaves && leaves.pending > 0) {
          badge = leaves.pending
          badgeStyle = { background:'rgba(249,115,22,0.18)', color:'#fb923c', border:'1px solid rgba(249,115,22,0.3)' }
        }
        if (isReimb) {
          // Pick the badge based on which queue the user is looking at, which
          // we infer from their effective module — review > hr > own.
          const mods = user?.modules || []
          const n = mods.includes('reimbursements_review') ? reimb.finance
                  : mods.includes('reimbursements_hr')     ? reimb.hr
                  : reimb.mine
          if (n > 0) {
            badge = n
            badgeStyle = { background:'rgba(167,139,250,0.18)', color:'#a78bfa', border:'1px solid rgba(167,139,250,0.3)' }
          }
        }
        return (
          <NavLink key={item.to + ':' + item.label} to={item.to} onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-orange-500/12 text-orange-400 border border-orange-500/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]'
              }`
            }>
            <Icon className="w-[17px] h-[17px] flex-shrink-0"/>
            <span className="truncate flex-1">{item.label}</span>
            {badge > 0 && (
              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center"
                style={badgeStyle}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pending, setPending] = useState({ dat: 0, dialer: 0, total: 0 })
  const [pendingLeaves, setPendingLeaves] = useState({ pending: 0 })
  const [pendingReimb, setReimb]          = useState({ finance: 0, hr: 0, mine: 0 })

  // Sidebar is now derived directly from the user's effective modules.
  const items = useMemo(() => buildNavForUser(user?.modules || []), [user?.modules])

  const fetchPending = useCallback(async () => {
    // Only fetch the payment-claims badge if the user actually has the
    // store_payments module — saves a wasted request for users that don't.
    if (!user?.modules?.includes('store_payments')) return
    try {
      const [datRes, dialerRes] = await Promise.all([
        api.get('/store/payment-claims/?status=pending'),
        api.get('/store/dialer-payment-claims/?status=pending'),
      ])
      const dat = (Array.isArray(datRes.data) ? datRes.data : datRes.data.results || []).length
      const dialer = (Array.isArray(dialerRes.data) ? dialerRes.data : dialerRes.data.results || []).length
      setPending({ dat, dialer, total: dat + dialer })
    } catch {}
  }, [user])

  const fetchLeaveBadge = useCallback(async () => {
    if (!user?.modules?.includes('leaves_manage')) return
    try {
      const { data } = await api.get('/leaves/pending-count/')
      setPendingLeaves({ pending: Number(data?.count || 0) })
    } catch {}
  }, [user])

  const fetchReimbBadge = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/reimbursements/stats/')
      setReimb({
        finance: Number(data?.pending_count || 0),
        hr:      Number(data?.forwarded_count || 0),
        mine:    Number(data?.pending_count || 0),
      })
    } catch {}
  }, [user])

  useEffect(() => {
    fetchPending(); fetchLeaveBadge(); fetchReimbBadge()
    const t1 = setInterval(fetchPending,    60_000)
    const t2 = setInterval(fetchLeaveBadge, 60_000)
    const t3 = setInterval(fetchReimbBadge, 60_000)
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3) }
  }, [fetchPending, fetchLeaveBadge, fetchReimbBadge])

  const SidebarContent = ({ onNavigate }) => (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <BitnexLogo size={34} showText={true}/>
      </div>

      <div className="px-4 pb-4 flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${roleColors[user?.role]||roleColors.employee}`}>
          <HiOutlineShieldCheck className="w-3 h-3"/>
          {user?.role}
          {user?.is_dept_head && <span className="opacity-60 ml-0.5">· Head</span>}
        </span>
      </div>

      <NavList items={items} onNavigate={onNavigate}/>
      <UserFooter user={user} onLogout={logout}/>
    </div>
  )

  return (
    <PendingCtx.Provider value={pending}>
    <LeaveCtx.Provider value={pendingLeaves}>
    <ReimbCtx.Provider value={pendingReimb}>
    <>
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
        style={{ background:'rgba(13,15,20,0.92)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(12px)' }}>
        <HiOutlineMenuAlt2 className="w-5 h-5"/>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
          <div className="relative w-64 h-full flex-shrink-0"
               style={{ background:'#0d0f14', borderRight:'1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-600 hover:text-white">
              <HiX className="w-5 h-5"/>
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)}/>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 min-h-screen sticky top-0 h-screen"
             style={{ background:'#0d0f14', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent onNavigate={undefined}/>
      </aside>
    </>
    </ReimbCtx.Provider>
    </LeaveCtx.Provider>
    </PendingCtx.Provider>
  )
}
