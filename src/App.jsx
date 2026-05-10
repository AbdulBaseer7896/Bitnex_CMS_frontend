import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import DashboardPage from './pages/dashboard/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import EmployeesPage from './pages/hr/EmployeesPage'
import LeaveManagementPage from './pages/hr/LeaveManagementPage'
import LeaveAllowancesPage from './pages/hr/LeaveAllowancesPage'
import SalaryManagementPage from './pages/salary/SalaryManagementPage'
import ExpensesPage from './pages/accounts/ExpensesPage'
import SalesPage from './pages/sales/SalesPage'
import AttendancePage from './pages/attendance/AttendancePage'
import SettingsPage from './pages/settings/SettingsPage'
import ProductsPage from './pages/store/ProductsPage'
import CustomersPage from './pages/store/CustomersPage'
import DATSubscriptionsPage from './pages/store/DATSubscriptionsPage'
import DATAccountsPage from './pages/store/DATAccountsPage'
import DialerSubscriptionsPage from './pages/store/DialerSubscriptionsPage'
import TransactionsPage from './pages/store/TransactionsPage'

const TEAL = '#4BBFBF'

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
           style={{background:'linear-gradient(135deg,#4BBFBF,#38A8A8)'}}>🚧</div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-500">Coming soon...</p>
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen hero-bg flex items-center justify-center">
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
           style={{borderColor:'rgba(75,191,191,0.2)',borderTopColor:TEAL}}/>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function WithUser({ children }) {
  const { user } = useAuth()
  return typeof children === 'function' ? children(user) : children
}

const STORE_ROLES = ['admin', 'sales', 'accountant', 'customer']
const MGMT_ROLES = ['admin', 'sales', 'accountant']

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/admin/users"    element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/features" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/activity" element={<ProtectedRoute roles={['admin']}><ComingSoon title="Activity Logs" /></ProtectedRoute>} />

        <Route path="/hr/employees"    element={<ProtectedRoute roles={['admin','hr']}><EmployeesPage /></ProtectedRoute>} />
        <Route path="/hr/add-employee" element={<ProtectedRoute roles={['admin','hr']}><UsersPage /></ProtectedRoute>} />
        <Route path="/hr/leaves"       element={<ProtectedRoute roles={['admin','hr']}><LeaveManagementPage /></ProtectedRoute>} />
        <Route path="/hr/allowances"   element={<ProtectedRoute roles={['admin','hr']}><LeaveAllowancesPage /></ProtectedRoute>} />

        <Route path="/attendance"  element={<AttendancePage />} />
        <Route path="/dept/leaves" element={<LeaveManagementPage />} />

        <Route path="/salary"          element={<ProtectedRoute roles={['admin','hr','accountant']}><SalaryManagementPage /></ProtectedRoute>} />
        <Route path="/accounts/salary" element={<ProtectedRoute roles={['admin','accountant','hr']}><SalaryManagementPage /></ProtectedRoute>} />

        <Route path="/accounts/expenses" element={<ProtectedRoute roles={['admin','accountant','sales']}><ExpensesPage /></ProtectedRoute>} />
        <Route path="/accounts/reports"  element={<ProtectedRoute roles={['admin','accountant']}><ComingSoon title="Financial Reports" /></ProtectedRoute>} />

        <Route path="/employee/leaves"   element={<LeaveManagementPage />} />
        <Route path="/employee/payslips" element={<ComingSoon title="My Payslips" />} />
        <Route path="/employee/profile"  element={<SettingsPage />} />

        <Route path="/sales" element={<ProtectedRoute roles={['admin','accountant','sales']}><SalesPage /></ProtectedRoute>} />

        {/* ── Store ── */}
        <Route path="/store/products"
          element={<ProtectedRoute roles={STORE_ROLES}>
            <WithUser>{u => <ProductsPage user={u} />}</WithUser>
          </ProtectedRoute>} />

        <Route path="/store/customers"
          element={<ProtectedRoute roles={MGMT_ROLES}>
            <WithUser>{u => <CustomersPage user={u} />}</WithUser>
          </ProtectedRoute>} />

        <Route path="/store/dat"
          element={<ProtectedRoute roles={STORE_ROLES}>
            <WithUser>{u => <DATSubscriptionsPage user={u} />}</WithUser>
          </ProtectedRoute>} />

        <Route path="/store/dialers"
          element={<ProtectedRoute roles={STORE_ROLES}>
            <WithUser>{u => <DialerSubscriptionsPage user={u} />}</WithUser>
          </ProtectedRoute>} />

        <Route path="/store/transactions"
          element={<ProtectedRoute roles={MGMT_ROLES}>
            <WithUser>{u => <TransactionsPage user={u} />}</WithUser>
          </ProtectedRoute>} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style:{background:'rgba(14,20,32,0.97)',border:'1px solid rgba(75,191,191,0.2)',color:'#e2e8f0',backdropFilter:'blur(20px)',borderRadius:12},
        }}/>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
