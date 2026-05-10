import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from 'react-icons/hi'
import BitnexLogo from '../../components/common/BitnexLogo'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      toast.success(`Welcome back, ${user.first_name || user.username}!`)
      navigate('/dashboard')
    } catch {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-bg grid-pattern flex items-center justify-center px-4">
      {/* Orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(75,191,191,0.08) 0%, transparent 70%)' }} />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(45,49,66,0.4) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <BitnexLogo size={52} showText />
        </div>

        {/* Card */}
        <div className="glass-light rounded-3xl p-8 glow-teal">
          <h2 className="font-display font-bold text-2xl text-white text-center mb-1">Sign In</h2>
          <p className="text-slate-500 text-center text-sm mb-6">Access your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text" required
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Enter your username"
                  className="input pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="input pl-12 pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
              {loading
                ? <><div className="w-5 h-5 border-2 border-[#0e1420]/40 border-t-[#0e1420] rounded-full animate-spin" />Signing in...</>
                : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-[#4BBFBF]/10">
            <p className="text-slate-600 text-xs text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin',      user: 'admin',      color: 'text-[#4BBFBF]' },
                { role: 'HR',         user: 'hr_manager', color: 'text-violet-400' },
                { role: 'Accountant', user: 'accountant1',color: 'text-emerald-400' },
                { role: 'Employee',   user: 'dev_emp',    color: 'text-sky-400' },
              ].map(d => (
                <button key={d.role}
                  onClick={() => setForm({ username: d.user, password: 'Demo@123' })}
                  className="text-left px-3 py-2 rounded-xl transition-colors"
                  style={{ background: 'rgba(75,191,191,0.04)', border: '1px solid rgba(75,191,191,0.08)' }}>
                  <div className={`text-xs font-semibold ${d.color}`}>{d.role}</div>
                  <div className="text-slate-600 text-xs">{d.user}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">© 2025 Bitnex Technologies</p>
      </div>
    </div>
  )
}
