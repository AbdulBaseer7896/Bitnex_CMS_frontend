import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex" style={{ background: '#0d0f14' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 p-6 md:p-8 animate-fade-in overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
