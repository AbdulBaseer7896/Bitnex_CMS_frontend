import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HiOutlineBell, HiOutlineSearch } from 'react-icons/hi'

const pageTitles = {
  '/dashboard':            'Dashboard',
  '/admin/users':          'User Management',
  '/admin/features':       'Feature Control',
  '/admin/activity':       'Activity Logs',
  '/hr/employees':         'Employees',
  '/hr/leaves':            'Leave Management',
  '/hr/allowances':        'Leave Allowances',
  '/hr/leave-policies':    'Leave Policies',
  '/hr/salary':            'Salary Setup',
  '/hr/add-employee':      'Add Employee',
  '/accounts/salary':      'Payroll',
  '/accounts/expenses':    'Expenses',
  '/accounts/slips':       'Salary Slips',
  '/accounts/reports':     'Financial Reports',
  '/employee/leaves':      'My Leaves',
  '/employee/payslips':    'My Payslips',
  '/employee/profile':     'My Profile',
  '/dept/leaves':          'Department Leaves',
  '/sales':                'Sales Records',
  '/sales/add':            'Add Sale',
  '/sales/pipeline':       'Pipeline',
  '/attendance':           'Attendance',
  '/salary':               'Salary',
  '/settings':             'Settings',
  '/store/products':       'Products',
  '/store/customers':      'Customers',
  '/store/subscriptions':  'Subscriptions',
  '/store/transactions':   'Transactions',
  '/store/dat-accounts':   'DAT Accounts',
  '/store/dat':            'DAT One — Customer Seats',
  '/store/dialers':        'Dialer Subscriptions',
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
    <header className="sticky top-0 z-30 glass border-b border-[#4BBFBF]/10 px-6 py-4 flex items-center justify-between gap-4">
      <div className="pl-10 lg:pl-0">
        <h1 className="font-display font-bold text-xl text-white">{title}</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          {greeting()}, {user?.first_name || user?.username} 👋
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="glass rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600
                       focus:outline-none w-48 lg:w-60"
            style={{ border: '1px solid rgba(75,191,191,0.15)' }}
          />
        </div>

        <button className="relative glass p-2.5 rounded-xl text-slate-400 hover:text-white transition-colors">
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#4BBFBF' }} />
        </button>

        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[#0e1420] font-bold text-sm shadow-lg"
             style={{ background: 'linear-gradient(135deg,#4BBFBF,#38A8A8)' }}>
          {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
        </div>
      </div>
    </header>
  )
}
