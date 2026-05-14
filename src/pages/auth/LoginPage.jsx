import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff } from 'react-icons/hi'
import BitnexLogo from '../../components/common/BitnexLogo'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm]         = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

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
    <div className="min-h-screen grid-pattern flex items-center justify-center px-4"
         style={{ background: '#0d0f14' }}>

      {/* Ambient glow blobs */}
      <div className="fixed top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-30"
           style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)' }} />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <BitnexLogo size={48} showText />
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8"
             style={{ background: 'rgba(20,23,32,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(32px)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.06) inset' }}>

          <div className="text-center mb-7">
            <h2 className="font-display font-bold text-2xl text-white mb-1">Welcome back</h2>
            <p className="text-slate-600 text-sm">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input
                  type="text" required
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Enter your username"
                  className="input pl-11 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input
                  type={showPass ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="input pl-11 pr-12 text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                  {showPass ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                : 'Sign In →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-slate-700 text-xs text-center mb-3 uppercase tracking-wider font-semibold">Quick access</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin',      user: 'admin',       color: 'text-orange-400' },
                { role: 'HR',         user: 'hr_manager',  color: 'text-violet-400' },
                { role: 'Accountant', user: 'accountant1', color: 'text-emerald-400' },
                { role: 'Employee',   user: 'dev_emp',     color: 'text-sky-400' },
              ].map(d => (
                <button key={d.role}
                  onClick={() => setForm({ username: d.user, password: 'Demo@123' })}
                  className="text-left px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.04]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className={`text-xs font-semibold ${d.color}`}>{d.role}</div>
                  <div className="text-slate-700 text-xs mt-0.5">{d.user}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">© 2025 Bitnex Technologies</p>
      </div>
    </div>
  )
}
