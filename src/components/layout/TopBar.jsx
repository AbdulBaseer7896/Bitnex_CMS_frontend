import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HiOutlineBell, HiOutlineSearch } from 'react-icons/hi'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/admin/users': 'User Management', '/admin/features': 'Feature Control', '/admin/activity': 'Activity Logs',
  '/hr/employees': 'Employees', '/hr/leaves': 'Leave Management', '/hr/allowances': 'Leave Allowances',
  '/hr/add-employee': 'Add Employee', '/hr/salary': 'Salary Setup',
  '/accounts/salary': 'Payroll', '/accounts/expenses': 'Expenses',
  '/accounts/slips': 'Salary Slips', '/accounts/reports': 'Financial Reports',
  '/employee/leaves': 'My Leaves', '/employee/payslips': 'My Payslips', '/employee/profile': 'My Profile',
  '/dept/leaves': 'Department Leaves', '/sales': 'Sales Records', '/attendance': 'Attendance', '/salary': 'Salary',
  '/settings': 'Settings',
  '/store/customers': 'Customers',
  '/store/dat': 'DAT One — Accounts & Seats',
  '/store/payments': 'Payment Claims',
  '/store/dat-expenses': 'DAT Expenses',
  '/store/dialers': 'Dialer Accounts',
  '/store/report': 'Monthly Report',
}

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TopBar() {
  const { user } = useAuth()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const title = pageTitles[location.pathname] || 'Bitnex CMS'

  return (
    <header className="sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between gap-4"
            style={{ background: 'rgba(13,15,20,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
      <div className="pl-10 lg:pl-0">
        <h1 className="font-display font-bold text-lg text-white tracking-tight">{title}</h1>
        <p className="text-slate-600 text-xs mt-0.5">{greeting()}, {user?.first_name || user?.username}</p>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative hidden md:block">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-700 focus:outline-none w-48 lg:w-56 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(249,115,22,0.35)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-slate-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <HiOutlineBell className="w-[18px] h-[18px]"/>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-500"/>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
             style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
          {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
        </div>
      </div>
    </header>
  )
}
