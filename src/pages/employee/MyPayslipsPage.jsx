// ─────────────────────────────────────────────────────────────────────────────
// My Payslips — employee-facing page that lists every salary slip with charts,
// breakdown of the latest paid month, year trend, and ability to download/print
// any paid slip as a professionally formatted PDF.
//
// Robust to missing structure: falls back to slip.gross_salary / slip.base_net
// so breakdowns and previews always render real numbers.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineCurrencyDollar, HiOutlineTrendingUp, HiOutlineDownload,
  HiOutlinePrinter, HiOutlineCalendar, HiOutlineReceiptRefund,
  HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineClock,
  HiOutlineX, HiOutlineEye,
} from 'react-icons/hi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import PayslipPreview from './PayslipPreview'

const MONTHS_S = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const ORANGE   = '#f97316'

const num = (v) => Number(v || 0)
const fmtPKR = (v) => '₨' + num(v).toLocaleString('en-PK', { maximumFractionDigits: 0 })
const fmtCompact = (v) => {
  const n = num(v)
  if (n >= 1_000_000) return '₨' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000)     return '₨' + (n / 1_000).toFixed(0) + 'k'
  return '₨' + n
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_META = {
  paid:      { label: 'Paid',      color: '#10b981', Icon: HiOutlineCheckCircle },
  generated: { label: 'Generated', color: '#06b6d4', Icon: HiOutlineClock },
  draft:     { label: 'Draft',     color: '#94a3b8', Icon: HiOutlineClock },
}

export default function MyPayslipsPage() {
  const { user } = useAuth()
  const [slips, setSlips]           = useState([])
  const [structures, setStructures] = useState([])
  const [year, setYear]             = useState(new Date().getFullYear())
  const [loading, setLoading]       = useState(true)
  const [viewing, setViewing]       = useState(null)
  const [printing, setPrinting]     = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const [slipsRes, structRes] = await Promise.all([
        api.get('/salary/slips/'),
        api.get('/salary/structures/').catch(() => ({ data: [] })),
      ])
      setSlips(slipsRes.data?.results || slipsRes.data || [])
      setStructures(structRes.data?.results || structRes.data || [])
    } catch { toast.error('Failed to load payslips') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  // Find structure for a slip — prefer linked id, fall back to most recent.
  const structureFor = (slip) => {
    if (!slip || !structures.length) return null
    if (slip.salary_structure) {
      const s = structures.find(x => x.id === slip.salary_structure)
      if (s) return s
    }
    return [...structures].sort((a, b) => (b.effective_from || '').localeCompare(a.effective_from || ''))[0] || null
  }

  // Derive base earnings/deductions for a slip (handles missing structure).
  const slipBreakdown = (slip) => {
    const struct = structureFor(slip)
    const sumComp = struct
      ? num(struct.basic_salary) + num(struct.house_allowance) + num(struct.transport_allowance)
        + num(struct.medical_allowance) + num(struct.other_allowances)
      : 0
    const sumDed = struct
      ? num(struct.tax_deduction) + num(struct.provident_fund) + num(struct.other_deductions)
      : 0

    const slipGross = num(slip.gross_salary)
    const slipBase  = num(slip.base_net)
    const haveStruct = sumComp > 0 || sumDed > 0

    const baseEarnings   = haveStruct ? sumComp : slipGross
    const baseDeductions = haveStruct ? sumDed  : Math.max(0, slipGross - slipBase)

    const bonus   = num(slip.bonus)
    const extra   = num(slip.extra_payment)
    const penalty = num(slip.penalty_deduction)
    const leave   = num(slip.leave_deduction)
    const grossEarnings = baseEarnings + bonus + extra
    const totalDed = baseDeductions + penalty + leave
    return {
      struct, haveStruct,
      baseEarnings, baseDeductions,
      bonus, extra, penalty, leave,
      grossEarnings, totalDed,
      net: grossEarnings - totalDed,
    }
  }

  const byYear = useMemo(() => {
    const m = {}
    slips.forEach(s => { (m[s.year] = m[s.year] || []).push(s) })
    return m
  }, [slips])
  const availableYears = Object.keys(byYear).sort().reverse().map(Number)
  const yearSlips = (byYear[year] || []).sort((a, b) => a.month - b.month)

  const monthlySeries = useMemo(() => (
    MONTHS_S.map((label, idx) => {
      const slip = yearSlips.find(s => s.month === idx + 1)
      return {
        month: label,
        paid:      slip && slip.status === 'paid' ? num(slip.net_payable) : 0,
        generated: slip && slip.status !== 'paid' ? num(slip.net_payable) : 0,
      }
    })
  ), [yearSlips])

  const stats = useMemo(() => {
    const paidSlips = yearSlips.filter(s => s.status === 'paid')
    const ytdEarned = paidSlips.reduce((s, x) => s + num(x.net_payable), 0)
    const totalBonus = paidSlips.reduce((s, x) => s + num(x.bonus), 0)
    const totalExtra = paidSlips.reduce((s, x) => s + num(x.extra_payment), 0)
    const avg = paidSlips.length ? ytdEarned / paidSlips.length : 0
    const last = [...paidSlips].sort((a, b) => b.month - a.month)[0] || null
    return { ytdEarned, totalBonus, totalExtra, avg, paidCount: paidSlips.length, last }
  }, [yearSlips])

  // Latest paid slip composition for pie chart (uses fallback when needed)
  const lastSlipComp = useMemo(() => {
    if (!stats.last) return []
    const b = slipBreakdown(stats.last)
    const items = b.haveStruct ? [
      { name: 'Basic',     value: num(b.struct.basic_salary),         fill: '#f97316' },
      { name: 'House',     value: num(b.struct.house_allowance),      fill: '#7c3aed' },
      { name: 'Transport', value: num(b.struct.transport_allowance),  fill: '#06b6d4' },
      { name: 'Medical',   value: num(b.struct.medical_allowance),    fill: '#10b981' },
      { name: 'Other',     value: num(b.struct.other_allowances),     fill: '#ec4899' },
    ] : [
      { name: 'Base Salary', value: b.baseEarnings, fill: '#f97316' },
    ]
    if (b.bonus > 0) items.push({ name: 'Bonus',       value: b.bonus, fill: '#eab308' })
    if (b.extra > 0) items.push({ name: 'Reimb/Extra', value: b.extra, fill: '#a78bfa' })
    return items.filter(x => x.value > 0)
  }, [stats.last, structures])

  const doPrint = (slip) => {
    setPrinting(slip)
    setTimeout(() => {
      document.body.classList.add('printing-letter')
      setTimeout(() => {
        window.print()
        setTimeout(() => {
          document.body.classList.remove('printing-letter')
          setPrinting(null)
        }, 300)
      }, 80)
    }, 50)
  }

  return (
    <>
      {printing && (
        <div id="print-root" className="print-only">
          <PayslipPreview slip={printing} structure={structureFor(printing)} employee={user} printable/>
        </div>
      )}

      <div className="screen-only space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">My Payslips</h1>
            <p className="text-slate-500 text-sm mt-0.5">Salary history, breakdowns, and downloads</p>
          </div>
          {availableYears.length > 1 && (
            <div className="flex items-center gap-1.5">
              <HiOutlineCalendar className="w-4 h-4 text-slate-500"/>
              <select className="input py-1.5 text-sm w-auto" value={year}
                onChange={e => setYear(Number(e.target.value))}>
                {availableYears.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label={`${year} Earnings`}     value={fmtCompact(stats.ytdEarned)} sub={`${stats.paidCount} months paid`}
               color="#10b981" Icon={HiOutlineCurrencyDollar}/>
          <KPI label="Avg / Month"            value={fmtCompact(stats.avg)} sub={fmtPKR(stats.avg)}
               color="#f97316" Icon={HiOutlineTrendingUp}/>
          <KPI label="Bonus + Reimbursements" value={fmtCompact(stats.totalBonus + stats.totalExtra)}
               sub={`Bonus ${fmtCompact(stats.totalBonus)} · Reimb ${fmtCompact(stats.totalExtra)}`}
               color="#a78bfa" Icon={HiOutlineReceiptRefund}/>
          <KPI label="Last Paid"              value={stats.last ? MONTHS_S[stats.last.month - 1] : '—'}
               sub={stats.last ? fmtPKR(stats.last.net_payable) : 'no data'}
               color="#06b6d4" Icon={HiOutlineCheckCircle}/>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-500">Loading...</div>
        ) : slips.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-slate-600">
            <HiOutlineCurrencyDollar className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            No payslips generated yet
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl p-4">
              <h3 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
                <HiOutlineChartBar className="w-4 h-4 text-orange-400"/> {year} Salary Trend
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlySeries} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={ORANGE} stopOpacity={0.3}/>
                      <stop offset="100%" stopColor={ORANGE} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }}/>
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}/>
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                    formatter={v => [fmtPKR(v), '']}/>
                  <Area type="monotone" dataKey="paid"      stroke="#10b981" strokeWidth={2} fill="url(#paidGrad)" name="Paid"/>
                  <Area type="monotone" dataKey="generated" stroke={ORANGE}  strokeWidth={2} fill="url(#genGrad)"  name="Pending"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {stats.last && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="font-display font-bold text-white text-sm">
                      Last Paid: {MONTHS[stats.last.month - 1]} {stats.last.year}
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={() => setViewing(stats.last)}
                        className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
                        <HiOutlineEye className="w-3.5 h-3.5"/> Preview
                      </button>
                      <button onClick={() => doPrint(stats.last)}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                        <HiOutlineDownload className="w-3.5 h-3.5"/> Download PDF
                      </button>
                    </div>
                  </div>
                  <LastSlipBreakdown slip={stats.last} breakdown={slipBreakdown(stats.last)}/>
                </div>
                <div className="glass rounded-2xl p-4">
                  <h3 className="font-display font-bold text-white text-sm mb-3">Composition</h3>
                  {lastSlipComp.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-600 text-xs">
                      No data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={lastSlipComp} cx="50%" cy="50%" outerRadius={75} innerRadius={40} dataKey="value">
                          {lastSlipComp.map((e, i) => <Cell key={i} fill={e.fill}/>)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                          formatter={v => [fmtPKR(v), '']}/>
                        <Legend formatter={v => <span className="text-slate-400 text-[10px]">{v}</span>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display font-bold text-white text-sm">{year} Payslips</h3>
                <span className="text-xs text-slate-500">{yearSlips.length} slip{yearSlips.length === 1 ? '' : 's'}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                      <th className="text-left px-4 py-2.5 font-semibold">Period</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Bonus</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Reimb / Extra</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Deductions</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Net Payable</th>
                      <th className="text-left px-4 py-2.5 font-semibold">Paid On</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearSlips.map(s => {
                      const m = STATUS_META[s.status] || STATUS_META.draft
                      const ded = num(s.penalty_deduction) + num(s.leave_deduction)
                      const canDownload = s.status === 'paid'
                      return (
                        <tr key={s.id} className="table-row-hover border-b border-white/[0.03] last:border-0">
                          <td className="px-4 py-3 text-white font-medium text-sm">
                            {MONTHS[s.month - 1]} {s.year}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge border text-[10px] flex items-center gap-1 inline-flex"
                              style={{ background: `${m.color}20`, color: m.color, borderColor: `${m.color}40` }}>
                              <m.Icon className="w-3 h-3"/> {m.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300 text-xs">
                            {s.bonus > 0 ? fmtPKR(s.bonus) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-xs">
                            {s.extra_payment > 0
                              ? <span className="text-violet-400 font-semibold">{fmtPKR(s.extra_payment)}</span>
                              : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-xs">
                            {ded > 0
                              ? <span className="text-red-400">−{fmtPKR(ded)}</span>
                              : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-display font-bold text-white">
                            {fmtPKR(s.net_payable)}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(s.paid_date)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setViewing(s)} title="Preview"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                                <HiOutlineEye className="w-4 h-4"/>
                              </button>
                              {canDownload && (
                                <>
                                  <button onClick={() => doPrint(s)} title="Download PDF"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                                    <HiOutlineDownload className="w-4 h-4"/>
                                  </button>
                                  <button onClick={() => doPrint(s)} title="Print"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                                    <HiOutlinePrinter className="w-4 h-4"/>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {yearSlips.length === 0 && (
                      <tr><td colSpan={8} className="text-center text-slate-600 py-10 text-sm">
                        No payslips for {year}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {viewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="glass-light rounded-3xl w-full max-w-4xl my-4 overflow-hidden animate-slide-up flex flex-col" style={{ maxHeight: '92vh' }}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
                <h3 className="font-display font-bold text-white text-base">Payslip Preview</h3>
                <div className="flex gap-2">
                  {viewing.status === 'paid' && (
                    <button onClick={() => { doPrint(viewing); setViewing(null) }}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                      <HiOutlineDownload className="w-3.5 h-3.5"/> Download PDF
                    </button>
                  )}
                  <button onClick={() => setViewing(null)} className="text-slate-400 hover:text-white">
                    <HiOutlineX className="w-5 h-5"/>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4" style={{ background: '#1a1f2e' }}>
                <PayslipPreview slip={viewing} structure={structureFor(viewing)} employee={user}/>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function LastSlipBreakdown({ slip, breakdown }) {
  const b = breakdown
  const reimbLines = (slip.remarks || '').split('\n').filter(l => /reimbursement/i.test(l))
  return (
    <div className="space-y-2 text-sm">
      <Row k="Gross Earnings" v={fmtPKR(b.grossEarnings)}/>
      {b.bonus > 0 && <Row k="↳ Bonus" sub v={fmtPKR(b.bonus)} accent="#eab308"/>}
      {b.extra > 0 && <Row k="↳ Reimbursement / Additional" sub v={fmtPKR(b.extra)} accent="#a78bfa"/>}
      <Row k="Total Deductions" v={`−${fmtPKR(b.totalDed)}`} accent="#ef4444"/>
      {(b.penalty + b.leave) > 0 && <Row k="↳ Penalty / Leave" sub v={`−${fmtPKR(b.penalty + b.leave)}`}/>}
      <div className="border-t border-white/10 pt-2 mt-2">
        <Row k="Net Payable" v={fmtPKR(b.net)} bold/>
      </div>
      {reimbLines.length > 0 && (
        <div className="mt-3 p-3 rounded-xl text-xs"
          style={{ background: 'rgba(167,139,250,0.08)', borderLeft: '3px solid #a78bfa' }}>
          <div className="text-violet-400 font-semibold mb-1.5 flex items-center gap-1.5">
            <HiOutlineReceiptRefund className="w-3.5 h-3.5"/>
            Reimbursements Included
          </div>
          <ul className="space-y-1 text-slate-300">
            {reimbLines.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function Row({ k, v, sub, bold, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${sub ? 'text-slate-500 text-xs pl-3' : 'text-slate-400 text-sm'} ${bold ? 'text-white font-bold text-base' : ''}`}>
        {k}
      </span>
      <span className={`font-display ${bold ? 'text-orange-400 font-bold text-lg' : 'font-semibold'}`}
        style={{ color: accent || (bold ? '#f97316' : '#fff') }}>{v}</span>
    </div>
  )
}

function KPI({ label, value, sub, color, Icon }) {
  return (
    <div className="stat-card">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}20`, color }}>
        <Icon className="w-5 h-5"/>
      </div>
      <div className="font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-500 text-xs mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}
