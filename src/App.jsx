import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ModuleGuard from './components/common/ModuleGuard'
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
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
           style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>🚧</div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-500">Coming soon...</p>
    </div>
  )
}

// Authenticated wrapper — used by the dashboard shell. The per-route module
// gating is done inside via <ModuleGuard module="…">.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen hero-bg flex items-center justify-center">
      <div className="w-10 h-10 border-2 rounded-full animate-spin"
           style={{borderColor:'rgba(75,191,191,0.2)',borderTopColor:TEAL}}/>
    </div>
  )
  if (!user) return <Navigate to="/login" replace/>
  return children
}

function WithUser({ children }) {
  const { user } = useAuth()
  return typeof children === 'function' ? children(user) : children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard"/> : <LandingPage/>}/>
      <Route path="/login" element={user ? <Navigate to="/dashboard"/> : <LoginPage/>}/>

      <Route element={<ProtectedRoute><DashboardLayout/></ProtectedRoute>}>
        {/* Dashboard is unguarded by module (every authenticated user has it) */}
        <Route path="/dashboard" element={<DashboardPage/>}/>

        {/* ── Admin ─────────────────────────────────────────────────────── */}
        <Route path="/admin/users"
          element={<ModuleGuard module="users_manage"><UsersPage/></ModuleGuard>}/>
        <Route path="/admin/activity"
          element={<ModuleGuard module="audit_logs"><ComingSoon title="Audit Logs"/></ModuleGuard>}/>

        {/* ── HR ────────────────────────────────────────────────────────── */}
        <Route path="/hr/employees"
          element={<ModuleGuard module="employees"><EmployeesPage/></ModuleGuard>}/>
        <Route path="/hr/leaves"
          element={<ModuleGuard module="leaves_manage"><LeaveManagementPage/></ModuleGuard>}/>
        <Route path="/hr/add-employee" element={<Navigate to="/hr/employees" replace/>}/>
        <Route path="/hr/allowances"   element={<Navigate to="/settings" replace/>}/>

        <Route path="/documents"
          element={<ModuleGuard module="documents"><DocumentsPage/></ModuleGuard>}/>

        {/* Reimbursements page is the same component for everyone — the page
            decides what to show based on role/permissions internally. We just
            need to require ANY of the three module slugs. */}
        <Route path="/reimbursements"
          element={<ModuleGuard anyOf={['reimbursements_review','reimbursements_hr','reimbursements_own']}>
            <ReimbursementsPage/>
          </ModuleGuard>}/>

        <Route path="/attendance"
          element={<ModuleGuard module="attendance"><AttendancePage/></ModuleGuard>}/>

        {/* Department-leaves and employee-leaves both land on the same page
            and require either "manage" or "own" access. */}
        <Route path="/dept/leaves"
          element={<ModuleGuard anyOf={['leaves_manage','leaves_own']}>
            <LeaveManagementPage/>
          </ModuleGuard>}/>
        <Route path="/employee/leaves"
          element={<ModuleGuard anyOf={['leaves_manage','leaves_own']}>
            <LeaveManagementPage/>
          </ModuleGuard>}/>

        {/* ── Salary ────────────────────────────────────────────────────── */}
        <Route path="/salary/manage"
          element={<ModuleGuard module="salary_manage"><ManageSalaryPage/></ModuleGuard>}/>
        <Route path="/salary"          element={<Navigate to="/salary/manage" replace/>}/>
        <Route path="/accounts/salary" element={<Navigate to="/salary/manage" replace/>}/>

        <Route path="/employee/payslips"
          element={<ModuleGuard anyOf={['salary_own','salary_manage']}>
            <MyPayslipsPage/>
          </ModuleGuard>}/>
        <Route path="/employee/profile" element={<SettingsPage/>}/>

        {/* ── Accounts ──────────────────────────────────────────────────── */}
        <Route path="/accounts/expenses"
          element={<ModuleGuard module="expenses"><ExpensesPage/></ModuleGuard>}/>
        <Route path="/accounts/reports"
          element={<ModuleGuard module="reports"><ReportsPage/></ModuleGuard>}/>

        {/* ── Store ─────────────────────────────────────────────────────── */}
        <Route path="/store/customers"
          element={<ModuleGuard module="store_customers">
            <WithUser>{u => <CustomersPage user={u}/>}</WithUser>
          </ModuleGuard>}/>
        <Route path="/store/dat"
          element={<ModuleGuard module="store_dat">
            <WithUser>{u => <DATOnePage user={u}/>}</WithUser>
          </ModuleGuard>}/>
        <Route path="/store/payments"
          element={<ModuleGuard module="store_payments">
            <WithUser>{u => <PaymentClaimsPage user={u}/>}</WithUser>
          </ModuleGuard>}/>
        <Route path="/store/expenses"
          element={<ModuleGuard module="store_expenses">
            <StoreExpensesPage/>
          </ModuleGuard>}/>
        <Route path="/store/dat-expenses"    element={<Navigate to="/store/expenses" replace/>}/>
        <Route path="/store/dialer-expenses" element={<Navigate to="/store/expenses" replace/>}/>
        <Route path="/store/conflicts"
          element={<ModuleGuard module="store_conflicts">
            <WithUser>{u => <ConflictsPage user={u}/>}</WithUser>
          </ModuleGuard>}/>
        <Route path="/store/report"
          element={<ModuleGuard module="store_report">
            <WithUser>{u => <MonthlyReportPage user={u}/>}</WithUser>
          </ModuleGuard>}/>
        <Route path="/store/dialers"
          element={<ModuleGuard module="store_dialers">
            <WithUser>{u => <DialerSubscriptionsPage user={u}/>}</WithUser>
          </ModuleGuard>}/>

        {/* Settings is always available to any logged-in non-customer user;
            we still gate it by module so customers can't reach it. */}
        <Route path="/settings"
          element={<ModuleGuard module="settings"><SettingsPage/></ModuleGuard>}/>

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
          style:{
            background:'rgba(14,20,32,0.97)',
            border:'1px solid rgba(75,191,191,0.2)',
            color:'#e2e8f0',
            backdropFilter:'blur(20px)',
            borderRadius:12,
          },
        }}/>
        <AppRoutes/>
      </AuthProvider>
    </BrowserRouter>
  )
}
