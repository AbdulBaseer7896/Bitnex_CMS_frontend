import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BitnexLogo from '../common/BitnexLogo'
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineClipboardList,
  HiOutlineCurrencyDollar, HiOutlineChartBar, HiOutlineLogout,
  HiOutlineDocumentReport, HiOutlineMenuAlt2, HiX,
  HiOutlineShieldCheck, HiOutlineUserAdd, HiOutlineCollection,
  HiOutlineClock, HiOutlineCog, HiOutlineChevronDown,
  HiOutlineDatabase, HiOutlineCreditCard, HiOutlineShoppingBag,
  HiOutlinePhone, HiOutlineUserCircle,
} from 'react-icons/hi'
import { RiTeamLine } from 'react-icons/ri'

/* ─────────────────────────────────────────────────────────────────────────────
   NAV CONFIG
   DAT Accounts + Dialer Accounts are now managed in Settings → tabs
   Store section shows: Products | Customers | DAT Seats | Dialer Seats | Transactions
───────────────────────────────────────────────────────────────────────────── */
const navConfig = {
  admin: [
    { to:'/dashboard',          icon:HiOutlineHome,          label:'Dashboard' },
    { to:'/admin/users',        icon:HiOutlineUsers,         label:'Users' },
    { to:'/hr/employees',       icon:RiTeamLine,             label:'Employees' },
    { to:'/hr/leaves',          icon:HiOutlineClipboardList, label:'Leaves' },
    { to:'/attendance',         icon:HiOutlineClock,         label:'Attendance' },
    { to:'/salary',             icon:HiOutlineCurrencyDollar,label:'Salary' },
    { to:'/accounts/expenses',  icon:HiOutlineDocumentReport,label:'Expenses' },
    { to:'/sales',              icon:HiOutlineChartBar,      label:'Sales Records' },
    { divider:'Store' },
    { to:'/store/customers',    icon:HiOutlineUsers,         label:'Customers' },
    { to:'/store/dat',          icon:HiOutlineDatabase,      label:'DAT One Seats' },
    { to:'/store/dialers',      icon:HiOutlinePhone,         label:'Dialer Seats' },
    { to:'/store/transactions', icon:HiOutlineCreditCard,    label:'Transactions' },
    { divider:'System' },
    { to:'/admin/activity',     icon:HiOutlineCollection,    label:'Audit Logs' },
  ],
  hr: [
    { to:'/dashboard',        icon:HiOutlineHome,           label:'Dashboard' },
    { to:'/hr/employees',     icon:RiTeamLine,              label:'Employees' },
    { to:'/hr/leaves',        icon:HiOutlineClipboardList,  label:'Leaves' },
    { to:'/hr/allowances',    icon:HiOutlineDocumentReport, label:'Leave Allowances' },
    { to:'/attendance',       icon:HiOutlineClock,          label:'Attendance' },
    { to:'/salary',           icon:HiOutlineCurrencyDollar, label:'Salary' },
    { to:'/hr/add-employee',  icon:HiOutlineUserAdd,        label:'Add Employee' },
  ],
  accountant: [
    { to:'/dashboard',          icon:HiOutlineHome,           label:'Dashboard' },
    { to:'/salary',             icon:HiOutlineCurrencyDollar, label:'Salary' },
    { to:'/accounts/expenses',  icon:HiOutlineDocumentReport, label:'Expenses' },
    { to:'/accounts/reports',   icon:HiOutlineChartBar,       label:'Reports' },
    { divider:'Store' },
    { to:'/store/customers',    icon:HiOutlineUsers,          label:'Customers' },
    { to:'/store/dat',          icon:HiOutlineDatabase,       label:'DAT One Seats' },
    { to:'/store/dialers',      icon:HiOutlinePhone,          label:'Dialer Seats' },
    { to:'/store/transactions', icon:HiOutlineCreditCard,     label:'Transactions' },
  ],
  employee: [
    { to:'/dashboard',          icon:HiOutlineHome,           label:'Dashboard' },
    { to:'/employee/leaves',    icon:HiOutlineClipboardList,  label:'My Leaves' },
    { to:'/attendance',         icon:HiOutlineClock,          label:'Attendance' },
    { to:'/employee/payslips',  icon:HiOutlineCurrencyDollar, label:'My Payslips' },
  ],
  sales: [
    { to:'/dashboard',          icon:HiOutlineHome,          label:'Dashboard' },
    { to:'/sales',              icon:HiOutlineChartBar,      label:'Sales Records' },
    { to:'/attendance',         icon:HiOutlineClock,         label:'Attendance' },
    { divider:'Store' },
    { to:'/store/customers',    icon:HiOutlineUsers,         label:'Customers' },
    { to:'/store/dat',          icon:HiOutlineDatabase,      label:'DAT One Seats' },
    { to:'/store/dialers',      icon:HiOutlinePhone,         label:'Dialer Seats' },
    { to:'/store/transactions', icon:HiOutlineCreditCard,    label:'Transactions' },
    { to:'/accounts/expenses',  icon:HiOutlineDocumentReport,label:'Expenses' },
  ],
  customer: [
    { to:'/dashboard',      icon:HiOutlineHome,       label:'Dashboard' },
    { to:'/store/dat',      icon:HiOutlineDatabase,   label:'My DAT Seats' },
    { to:'/store/dialers',  icon:HiOutlinePhone,      label:'My Dialers' },
  ],
}

const roleColors = {
  admin:      'bg-[#4BBFBF]/20 text-[#4BBFBF]',
  hr:         'bg-violet-500/20 text-violet-400',
  accountant: 'bg-emerald-500/20 text-emerald-400',
  employee:   'bg-sky-500/20 text-sky-400',
  sales:      'bg-orange-500/20 text-orange-400',
  customer:   'bg-pink-500/20 text-pink-400',
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
    <div className="relative border-t border-white/[0.06] p-3" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors">
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-[#0e1420]"
             style={{ background:'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-white text-sm font-medium truncate">{displayName}</div>
          <div className="text-slate-500 text-xs capitalize">{user?.role}</div>
        </div>
        <HiOutlineChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${open?'rotate-180':''}`}/>
      </button>

      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl overflow-hidden shadow-2xl z-50"
             style={{ background:'rgba(14,20,35,0.98)', border:'1px solid rgba(75,191,191,0.2)', backdropFilter:'blur(20px)' }}>
          <button onClick={() => { navigate('/settings'); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors text-sm">
            <HiOutlineCog className="w-4 h-4"/> Settings
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/[0.05] text-sm">
            <HiOutlineLogout className="w-4 h-4"/> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

function NavList({ items, onNavigate }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
      {items.map((item, idx) => {
        if (item.divider) {
          return (
            <div key={`div-${idx}`} className="px-2 pt-5 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{item.divider}</span>
            </div>
          )
        }
        const Icon = item.icon
        return (
          <NavLink key={item.to} to={item.to} onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#4BBFBF]/15 text-[#4BBFBF] border border-[#4BBFBF]/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`
            }>
            <Icon className="w-[18px] h-[18px] flex-shrink-0"/>
            <span className="truncate">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const items = navConfig[user?.role] || navConfig.employee

  const SidebarContent = ({ onNavigate }) => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 flex-shrink-0"><BitnexLogo size="sm"/></div>
      <div className="px-4 pb-3 flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${roleColors[user?.role]||roleColors.employee}`}>
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
    <>
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
        style={{ background:'rgba(14,20,35,0.9)', border:'1px solid rgba(75,191,191,0.15)', backdropFilter:'blur(12px)' }}>
        <HiOutlineMenuAlt2 className="w-5 h-5"/>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
          <div className="relative w-64 h-full flex-shrink-0"
               style={{ background:'rgba(14,20,35,0.98)', borderRight:'1px solid rgba(75,191,191,0.12)' }}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <HiX className="w-5 h-5"/>
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)}/>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 min-h-screen sticky top-0 h-screen"
             style={{ background:'rgba(14,20,35,0.95)', borderRight:'1px solid rgba(75,191,191,0.10)' }}>
        <SidebarContent onNavigate={undefined}/>
      </aside>
    </>
  )
}
