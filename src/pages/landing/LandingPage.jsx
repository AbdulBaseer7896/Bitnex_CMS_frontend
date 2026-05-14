import { useNavigate } from 'react-router-dom'
import BitnexLogo from '../../components/common/BitnexLogo'
import {
  HiOutlineChartBar, HiOutlineUsers, HiOutlineCurrencyDollar,
  HiOutlineClipboardList, HiOutlineShieldCheck, HiOutlineLightningBolt,
  HiArrowRight, HiOutlineGlobeAlt,
} from 'react-icons/hi'

const TEAL = '#f97316'

const features = [
  { icon: HiOutlineUsers,         title: 'Multi-Role Access',    desc: 'Admin, HR, Accountants, Employees, Sales — each with tailored dashboards and permissions.', color: TEAL },
  { icon: HiOutlineClipboardList, title: 'Smart Leave Management',desc: 'Per-employee leave policies, probation rules, dept-head approvals, and real-time balances.', color: '#7c3aed' },
  { icon: HiOutlineCurrencyDollar,title: 'Payroll & Accounts',   desc: 'Full salary management, expense tracking, and financial reporting in PKR.', color: '#10b981' },
  { icon: HiOutlineChartBar,      title: 'Sales Pipeline',       desc: 'Track deals, manage pipeline, and visualize revenue across your sales team.', color: '#f97316' },
  { icon: HiOutlineShieldCheck,   title: 'Feature Control',      desc: 'Admin-controlled feature toggles per user — maximum flexibility and security.', color: '#ec4899' },
  { icon: HiOutlineLightningBolt, title: 'Activity Tracking',    desc: 'Complete audit logs, real-time activity feeds and admin oversight for everything.', color: '#eab308' },
]

const roles = [
  { role: 'Admin',       desc: 'Full control & oversight',          color: TEAL },
  { role: 'HR',          desc: 'People, leaves & employment',       color: '#7c3aed' },
  { role: 'Accountant',  desc: 'Payroll & expenses',                color: '#10b981' },
  { role: 'Sales',       desc: 'Pipeline & revenue tracking',       color: '#f97316' },
  { role: 'Employee',    desc: 'Leaves, payslips & profile',        color: '#ec4899' },
  { role: 'Dept Head',   desc: 'Approve dept leaves',               color: '#06b6d4' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen hero-bg grid-pattern overflow-x-hidden">
      {/* Orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-pulse-slow"
           style={{ background: 'radial-gradient(circle, rgba(75,191,191,0.1) 0%, transparent 70%)' }} />
      <div className="fixed bottom-20 right-10 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-pulse-slow"
           style={{ background: 'radial-gradient(circle, rgba(45,49,66,0.5) 0%, transparent 70%)', animationDelay:'3s' }} />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-16 py-6">
        <BitnexLogo size={38} showText />
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost text-sm px-5 py-2.5">Sign In</button>
          <button onClick={() => navigate('/login')} className="btn-primary text-sm px-5 py-2.5">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 text-sm mb-8"
             style={{ background:'rgba(75,191,191,0.08)', border:'1px solid rgba(75,191,191,0.2)', color: TEAL }}>
          <HiOutlineLightningBolt className="w-4 h-4" />
          Bitnex Technologies — Internal Operations Platform
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 max-w-4xl mx-auto">
          One Platform,
          <br />
          <span className="gradient-text">Every Department</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Unified HR, payroll, leave management, sales tracking and operations — purpose-built for Bitnex Technologies.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate('/login')}
            className="btn-primary flex items-center gap-2 text-base px-8 py-4">
            Launch Dashboard <HiArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <HiOutlineShieldCheck className="w-4 h-4" style={{ color: TEAL }} />
            Secure · Role-based · Built for Bitnex
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-10 mt-16">
          {[['6+','User Roles'],['100%','Activity Tracked'],['PKR','Pakistan Rupee'],['∞','Scalability']].map(([v,l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-3xl font-bold gradient-text">{v}</div>
              <div className="text-slate-500 text-sm mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-16 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Everything Your Team <span className="gradient-text">Needs</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(feat => (
              <div key={feat.title} className="card group cursor-default"
                   style={{ '--hover-border': feat.color }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300"
                     style={{ background: `${feat.color}20`, border: `1px solid ${feat.color}30` }}>
                  <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="relative z-10 px-6 md:px-16 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12 glow-teal">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl font-bold text-white mb-3">
                Right access for <span className="gradient-text">every role</span>
              </h2>
              <p className="text-slate-400">Admin controls every feature per user. Everyone gets exactly what they need.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map(r => (
                <div key={r.role} className="rounded-2xl p-4"
                     style={{ background: `${r.color}10`, border:`1px solid ${r.color}20` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                    <span className="font-display font-bold text-white text-sm">{r.role}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{r.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button onClick={() => navigate('/login')} className="btn-primary flex items-center gap-2 mx-auto px-8 py-4">
                Enter Dashboard <HiArrowRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 text-center text-slate-600 text-sm"
              style={{ borderTop: 'border-top: 1px solid rgba(75,191,191,0.08)' }}>
        <div className="flex items-center justify-center gap-2">
          <HiOutlineGlobeAlt className="w-4 h-4" />
          © 2025 Bitnex Technologies, Lahore, Pakistan — All rights reserved.
        </div>
      </footer>
    </div>
  )
}
