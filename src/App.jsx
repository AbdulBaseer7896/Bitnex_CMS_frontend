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
import ManageSalaryPage from './pages/salary/ManageSalaryPage'
import ExpensesPage from './pages/accounts/ExpensesPage'
import ReportsPage from './pages/accounts/ReportsPage'
import AttendancePage from './pages/attendance/AttendancePage'
import SettingsPage from './pages/settings/SettingsPage'
import DocumentsPage from './pages/documents/DocumentsPage'
import ReimbursementsPage from './pages/reimbursements/ReimbursementsPage'
import MyPayslipsPage from './pages/employee/MyPayslipsPage'
// Store
import DATOnePage from './pages/store/DATOnePage'
import PaymentClaimsPage from './pages/store/PaymentClaimsPage'
import StoreExpensesPage from './pages/store/StoreExpensesPage'
import ConflictsPage from './pages/store/ConflictsPage'
import MonthlyReportPage from './pages/store/MonthlyReportPage'
import CustomersPage from './pages/store/CustomersPage'
import DialerSubscriptionsPage from './pages/store/DialerSubscriptionsPage'

const TEAL = '#f97316'

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>🚧</div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-500">Coming soon...</p>
    </div>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen hero-bg flex items-center justify-center">
      <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{borderColor:'rgba(75,191,191,0.2)',borderTopColor:TEAL}}/>
    </div>
  )
  if (!user) return <Navigate to="/login" replace/>
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace/>
  return children
}

function WithUser({ children }) {
  const { user } = useAuth()
  return typeof children === 'function' ? children(user) : children
}

const STAFF        = ['admin','sales']
const STORE_ALL    = ['admin','sales','customer']
const SALARY_ROLES = ['admin','hr']
const HR_ROLES     = ['admin','hr']
const EXPENSE_ROLES = ['admin','accountant','sales']

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard"/> : <LandingPage/>}/>
      <Route path="/login" element={user ? <Navigate to="/dashboard"/> : <LoginPage/>}/>

      <Route element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage/>}/>

        <Route path="/admin/users"    element={<ProtectedRoute roles={['admin']}><UsersPage/></ProtectedRoute>}/>
        <Route path="/admin/activity" element={<ProtectedRoute roles={['admin']}><ComingSoon title="Audit Logs"/></ProtectedRoute>}/>

        <Route path="/hr/employees"    element={<ProtectedRoute roles={HR_ROLES}><EmployeesPage/></ProtectedRoute>}/>
        <Route path="/hr/leaves"       element={<ProtectedRoute roles={HR_ROLES}><LeaveManagementPage/></ProtectedRoute>}/>
        <Route path="/hr/add-employee" element={<Navigate to="/hr/employees" replace/>}/>
        <Route path="/hr/allowances"   element={<Navigate to="/settings" replace/>}/>

        <Route path="/documents"      element={<ProtectedRoute roles={HR_ROLES}><DocumentsPage/></ProtectedRoute>}/>
        <Route path="/reimbursements" element={<ReimbursementsPage/>}/>

        <Route path="/attendance"  element={<AttendancePage/>}/>
        <Route path="/dept/leaves" element={<LeaveManagementPage/>}/>

        <Route path="/salary/manage"   element={<ProtectedRoute roles={SALARY_ROLES}><ManageSalaryPage/></ProtectedRoute>}/>
        <Route path="/salary"          element={<Navigate to="/salary/manage" replace/>}/>
        <Route path="/accounts/salary" element={<Navigate to="/salary/manage" replace/>}/>

        <Route path="/accounts/expenses" element={<ProtectedRoute roles={EXPENSE_ROLES}><ExpensesPage/></ProtectedRoute>}/>
        <Route path="/accounts/reports"  element={<ProtectedRoute roles={['admin','accountant']}><ReportsPage/></ProtectedRoute>}/>

        <Route path="/employee/leaves"   element={<LeaveManagementPage/>}/>
        {/* My Payslips — full payslip history, charts, and PDF download */}
        <Route path="/employee/payslips" element={<MyPayslipsPage/>}/>
        <Route path="/employee/profile"  element={<SettingsPage/>}/>

        <Route path="/store/customers"
          element={<ProtectedRoute roles={STAFF}>
            <WithUser>{u => <CustomersPage user={u}/>}</WithUser>
          </ProtectedRoute>}/>
        <Route path="/store/dat"
          element={<ProtectedRoute roles={STORE_ALL}>
            <WithUser>{u => <DATOnePage user={u}/>}</WithUser>
          </ProtectedRoute>}/>
        <Route path="/store/payments"
          element={<ProtectedRoute roles={STORE_ALL}>
            <WithUser>{u => <PaymentClaimsPage user={u}/>}</WithUser>
          </ProtectedRoute>}/>
        <Route path="/store/expenses"
          element={<ProtectedRoute roles={STAFF}>
            <StoreExpensesPage/>
          </ProtectedRoute>}/>
        <Route path="/store/dat-expenses" element={<Navigate to="/store/expenses" replace/>}/>
        <Route path="/store/dialer-expenses" element={<Navigate to="/store/expenses" replace/>}/>
        <Route path="/store/conflicts"
          element={<ProtectedRoute roles={STAFF}>
            <WithUser>{u => <ConflictsPage user={u}/>}</WithUser>
          </ProtectedRoute>}/>
        <Route path="/store/report"
          element={<ProtectedRoute roles={STAFF}>
            <WithUser>{u => <MonthlyReportPage user={u}/>}</WithUser>
          </ProtectedRoute>}/>
        <Route path="/store/dialers"
          element={<ProtectedRoute roles={STORE_ALL}>
            <WithUser>{u => <DialerSubscriptionsPage user={u}/>}</WithUser>
          </ProtectedRoute>}/>

        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="*" element={<Navigate to="/dashboard"/>}/>
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
        <AppRoutes/>
      </AuthProvider>
    </BrowserRouter>
  )
}
