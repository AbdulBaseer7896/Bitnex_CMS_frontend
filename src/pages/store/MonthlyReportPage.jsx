import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { HiOutlineDownload, HiOutlineRefresh, HiOutlineChartBar, HiOutlineCalendar } from 'react-icons/hi'

const TEAL = '#4BBFBF'

export default function MonthlyReportPage({ user }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/store/reports/monthly/?year=${year}&month=${month}`)
      setReport(data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const downloadCSV = () => {
    if (!report) return
    const rows = [
      ['Monthly Closing Report', `${MONTHS[month-1]} ${year}`],
      [],
      ['SUMMARY'],
      ['Revenue', report.revenue],
      ['Expenses', report.expenses],
      ['Profit', report.profit],
      ['Profit Margin %', report.profit_margin],
      ['Total Transactions', report.total_transactions],
      [],
      ['CUSTOMER BREAKDOWN'],
      ['Customer', 'Company', 'Amount Paid', 'Transactions'],
      ...((report.customer_breakdown||[]).map(c => [c.name, c.company||'', c.paid, c.transactions])),
      [],
      ['EXPENSES BREAKDOWN'],
      ['Account', 'Type', 'Total', 'Count'],
      ...((report.expense_breakdown||[]).map(e => [e['dat_account__name']||'General', e.expense_type, e.total, e.count])),
      [],
      ['EXPIRING SEATS'],
      ['Customer', 'User', 'Email', 'Expiry Date', 'Price'],
      ...((report.expiring_seats||[]).map(s => [s['customer__contact_person'], s['mongo_user__name'], s['mongo_user__email'], s.expiry_date, `${s.currency} ${s.monthly_price}`])),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `DAT_Report_${MONTHS[month-1]}_${year}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Report downloaded')
  }

  const MetricCard = ({ label, value, sub, color='text-white', bg='rgba(75,191,191,0.06)' }) => (
    <div className="rounded-2xl p-5" style={{ background:bg, border:'1px solid rgba(75,191,191,0.12)' }}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-white text-sm font-medium mt-0.5">{label}</div>
      {sub && <div className="text-slate-500 text-xs">{sub}</div>}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Monthly Report</h1>
          <p className="text-slate-500 text-sm mt-1">DAT One closing report — revenue, expenses, profit per customer</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white"><HiOutlineRefresh className="w-5 h-5"/></button>
          {report && (
            <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#4BBFBF]/30 text-[#4BBFBF] text-sm font-medium hover:bg-[#4BBFBF]/10">
              <HiOutlineDownload className="w-4 h-4"/> Download CSV
            </button>
          )}
        </div>
      </div>

      {/* Period picker */}
      <div className="flex gap-3 items-center glass-light rounded-2xl p-4" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
        <HiOutlineCalendar className="w-5 h-5 text-[#4BBFBF] flex-shrink-0"/>
        <span className="text-slate-400 text-sm">Period:</span>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
          {[2024,2025,2026,2027].map(y => <option key={y} value={y} className="bg-[#0e1420]">{y}</option>)}
        </select>
        <div className="flex gap-1 flex-wrap">
          {MONTHS.map((m, i) => (
            <button key={i} onClick={() => setMonth(i+1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${month===i+1 ? 'text-[#0e1420]' : 'text-slate-400 hover:text-white bg-white/5'}`}
              style={month===i+1 ? { background:'linear-gradient(135deg,#4BBFBF,#38A8A8)' } : {}}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(75,191,191,0.2)', borderTopColor:TEAL }}/></div>
      ) : report ? (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="Revenue" value={`PKR ${parseFloat(report.revenue||0).toLocaleString()}`} color="text-emerald-400" sub={`${report.total_transactions} transactions`}/>
            <MetricCard label="Expenses" value={`PKR ${parseFloat(report.expenses||0).toLocaleString()}`} color="text-red-400"/>
            <MetricCard label="Net Profit" value={`PKR ${parseFloat(report.profit||0).toLocaleString()}`} color={report.profit >= 0 ? 'text-[#4BBFBF]' : 'text-red-400'} bg={report.profit >= 0 ? 'rgba(75,191,191,0.08)' : 'rgba(239,68,68,0.06)'}/>
            <MetricCard label="Profit Margin" value={`${report.profit_margin||0}%`} color="text-purple-400"/>
            <MetricCard label="Pending Claims" value={report.pending_claims||0} color="text-yellow-400" sub="awaiting approval"/>
          </div>

          {/* Customer breakdown */}
          <div className="glass-light rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
              <HiOutlineChartBar className="w-4 h-4 text-[#4BBFBF]"/>
              <h3 className="text-white font-semibold text-sm">Customer Revenue</h3>
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                {['Customer','Company','Amount Paid','Transactions'].map(h=>(
                  <th key={h} className="text-left text-slate-500 text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(report.customer_breakdown||[]).length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-slate-500 py-8">No transactions this month</td></tr>
                ) : (report.customer_breakdown||[]).map((c,i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-white text-sm font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-slate-400 text-sm">{c.company||'—'}</td>
                    <td className="px-5 py-3 text-emerald-400 font-bold">PKR {parseFloat(c.paid||0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-400 text-sm">{c.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expenses breakdown + Expiring seats side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-light rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Expenses by Account</h3>
              </div>
              <table className="w-full">
                <thead><tr className="border-b border-white/5">
                  {['Account','Type','Total'].map(h=><th key={h} className="text-left text-slate-500 text-xs px-5 py-3">{h}</th>)}
                </tr></thead>
                <tbody>
                  {(report.expense_breakdown||[]).length === 0 ? (
                    <tr><td colSpan={3} className="text-center text-slate-500 py-8">No expenses</td></tr>
                  ) : (report.expense_breakdown||[]).map((e,i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-5 py-3 text-slate-300 text-sm">{e['dat_account__name']||'General'}</td>
                      <td className="px-5 py-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 capitalize">{e.expense_type?.replace(/_/g,' ')}</span></td>
                      <td className="px-5 py-3 text-red-400 font-medium text-sm">PKR {parseFloat(e.total||0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-light rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(75,191,191,0.1)' }}>
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">Expiring Seats This Month</h3>
              </div>
              <div className="divide-y divide-white/5">
                {(report.expiring_seats||[]).length === 0 ? (
                  <div className="text-center text-slate-500 py-8">No seats expiring this month</div>
                ) : (report.expiring_seats||[]).map((s,i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{s['customer__contact_person']}</div>
                      <div className="text-slate-500 text-xs truncate">{s['mongo_user__name']} · {s['mongo_user__email']}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-orange-400 text-xs font-medium">{s.expiry_date}</div>
                      <div className="text-slate-400 text-xs">{s.currency} {parseFloat(s.monthly_price||0).toLocaleString()}/mo</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
