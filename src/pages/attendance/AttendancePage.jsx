import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineCheck, HiOutlineX,
  HiOutlineClock, HiOutlineExclamation, HiOutlineCalendar,
  HiOutlineChartBar, HiOutlineTable, HiOutlineTrendingUp,
} from 'react-icons/hi'

const TEAL    = '#f97316'
const COLORS  = ['#f97316','#ef4444','#eab308','#7c3aed','#f97316','#10b981']
const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_S= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STATUS_CFG = {
  present:  { color:'bg-[#f97316]/15 text-[#f97316] border-orange-500/25',    label:'Present',  hasTime:true,  hex:'#f97316' },
  absent:   { color:'bg-red-500/15 text-red-400 border-red-500/25',            label:'Absent',   hasTime:false, hex:'#ef4444' },
  late:     { color:'bg-amber-500/15 text-amber-400 border-amber-500/25',      label:'Late',     hasTime:true,  hex:'#eab308' },
  half_day: { color:'bg-sky-500/15 text-sky-400 border-sky-500/25',            label:'Half Day', hasTime:true,  hex:'#38bdf8' },
  leave:    { color:'bg-violet-500/15 text-violet-400 border-violet-500/25',   label:'On Leave', hasTime:false, hex:'#7c3aed' },
  holiday:  { color:'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',label:'Holiday',  hasTime:false, hex:'#10b981' },
}

const fmt   = (h, m) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
const parsePKT = (s) => {
  if (!s) return { date:'', hour:18, min:0 }
  const [d, t] = s.split(' ')
  const [h, m] = (t||'18:00').split(':').map(Number)
  return { date: d||'', hour: h, min: m }
}
const HOURS   = Array.from({length:24}, (_,i)=>i)
const MINUTES = [0,5,10,15,20,25,30,35,40,45,50,55]

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-light rounded-xl px-4 py-3 shadow-2xl text-sm"
         style={{ border:'1px solid rgba(75,191,191,0.2)' }}>
      <div className="text-white font-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }}/>
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ records, employees, settings, month, year }) {
  // Per-employee summary
  const empMap = {}
  employees.forEach(e => { empMap[e.id] = e })

  // Build per-employee stats
  const empStats = {}
  records.forEach(r => {
    const id = r.employee
    if (!empStats[id]) {
      empStats[id] = {
        id, name: r.employee_name, dept: r.employee_department,
        present:0, absent:0, late:0, half_day:0, leave:0, holiday:0,
        totalHours:0, lateDays:0, earlyOutDays:0, shortHoursDays:0,
      }
    }
    const s = empStats[id]
    s[r.status] = (s[r.status]||0) + 1
    s.totalHours += r.working_hours||0

    if (r.check_in_pkt && r.check_out_pkt) {
      try {
        const [d1,t1] = r.check_in_pkt.split(' ')
        const [sh,sm] = (settings?.shift_start||'18:00').split(':').map(Number)
        const inDt    = new Date(`${d1}T${t1}:00+05:00`)
        const expIn   = new Date(`${r.shift_date}T${fmt(sh,sm)}:00+05:00`)
        const grace   = parseInt(settings?.late_threshold_minutes||30)
        if ((inDt - expIn)/60000 > grace) s.lateDays++

        const reqH = parseFloat(settings?.daily_hours_required||9)
        if ((r.working_hours||0) < reqH - 0.25) s.shortHoursDays++
      } catch {}
    }
  })

  const empList = Object.values(empStats)

  // Overall status distribution (pie)
  const statusDist = Object.entries(
    records.reduce((acc, r) => { acc[r.status]=(acc[r.status]||0)+1; return acc }, {})
  ).map(([k,v]) => ({ name: STATUS_CFG[k]?.label||k, value: v, fill: STATUS_CFG[k]?.hex||'#888' }))

  // Daily attendance trend (line chart)
  const dailyMap = {}
  records.forEach(r => {
    if (!dailyMap[r.shift_date]) dailyMap[r.shift_date] = { date:r.shift_date, present:0, absent:0, late:0 }
    if (r.status==='present') dailyMap[r.shift_date].present++
    if (r.status==='absent')  dailyMap[r.shift_date].absent++
    if (r.status==='late')    dailyMap[r.shift_date].late++
  })
  const dailyTrend = Object.values(dailyMap).sort((a,b)=>a.date.localeCompare(b.date)).slice(-20)

  // Per-employee bar (attendance rate)
  const empBarData = empList.map(e => ({
    name: e.name.split(' ')[0],
    fullName: e.name,
    Present: e.present||0,
    Absent:  e.absent||0,
    Late:    e.late||0,
    Leave:   e.leave||0,
  })).slice(0, 15)

  // Late ranking
  const lateRanking = [...empList].sort((a,b)=>b.lateDays-a.lateDays).filter(e=>e.lateDays>0).slice(0,8)
  // Short hours ranking
  const shortRanking = [...empList].sort((a,b)=>b.shortHoursDays-a.shortHoursDays).filter(e=>e.shortHoursDays>0).slice(0,8)

  // Total stats
  const total     = records.length
  const present   = records.filter(r=>r.status==='present').length
  const absent    = records.filter(r=>r.status==='absent').length
  const late      = records.filter(r=>r.status==='late').length
  const flagged   = empList.reduce((s,e)=>s+(e.lateDays>0||e.shortHoursDays>0?1:0),0)
  const totalHrs  = records.reduce((s,r)=>s+(r.working_hours||0),0)
  const attRate   = total>0 ? Math.round(((present+late)/total)*100) : 0

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label:'Attendance Rate', val:`${attRate}%`, color:TEAL,       sub:'present+late' },
          { label:'Present',        val:present,        color:TEAL,       sub:'days' },
          { label:'Absent',         val:absent,         color:'#ef4444',  sub:'days' },
          { label:'Late Arrivals',  val:late,           color:'#eab308',  sub:'days' },
          { label:'⚠ Flagged',      val:flagged,        color:'#f97316',  sub:'employees' },
          { label:'Total Hours',    val:totalHrs.toFixed(0)+'h', color:'#06b6d4', sub:'worked' },
        ].map(k => (
          <div key={k.label} className="stat-card text-center">
            <div className="font-display text-2xl font-bold" style={{ color:k.color }}>{k.val}</div>
            <div className="text-white text-xs font-medium mt-0.5">{k.label}</div>
            <div className="text-slate-600 text-[10px]">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Status Pie + Daily Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Pie */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-bold text-white mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusDist} cx="40%" cy="50%" outerRadius={70} innerRadius={35} dataKey="value">
                {statusDist.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Pie>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend
                layout="vertical" align="right" verticalAlign="middle"
                formatter={(v) => <span className="text-slate-400 text-xs">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily trend line */}
        <div className="card lg:col-span-3">
          <h3 className="font-display font-bold text-white mb-4">Daily Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v.slice(5)}/>
              <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Line type="monotone" dataKey="present" stroke={TEAL}      strokeWidth={2} dot={false} name="Present"/>
              <Line type="monotone" dataKey="absent"  stroke="#ef4444"   strokeWidth={2} dot={false} name="Absent"/>
              <Line type="monotone" dataKey="late"    stroke="#eab308"   strokeWidth={2} dot={false} name="Late"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Per-employee attendance bar */}
      {empBarData.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-white mb-4">Employee Attendance Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={empBarData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Legend formatter={(v)=><span className="text-slate-400 text-xs">{v}</span>}/>
              <Bar dataKey="Present" fill={TEAL}      radius={[3,3,0,0]}/>
              <Bar dataKey="Absent"  fill="#ef4444"   radius={[3,3,0,0]}/>
              <Bar dataKey="Late"    fill="#eab308"   radius={[3,3,0,0]}/>
              <Bar dataKey="Leave"   fill="#7c3aed"   radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Row 3: Late ranking + Short hours ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Late ranking */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(234,179,8,0.15)' }}>
              <HiOutlineClock className="w-4 h-4 text-amber-400"/>
            </div>
            <h3 className="font-display font-bold text-white">Most Late Arrivals</h3>
          </div>
          {lateRanking.length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-sm">
              🎉 No late arrivals this month!
            </div>
          ) : (
            <div className="space-y-2">
              {lateRanking.map((e, i) => (
                <div key={e.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i===0?'bg-amber-500/30 text-amber-300':
                    i===1?'bg-slate-500/30 text-slate-300':
                    'bg-slate-700/30 text-slate-500'
                  }`}>#{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{e.name}</div>
                    <div className="text-slate-500 text-xs">{e.dept}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-400 font-bold">{e.lateDays}</div>
                    <div className="text-slate-600 text-[10px]">late days</div>
                  </div>
                  {/* Mini bar */}
                  <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full bg-amber-400"
                         style={{ width:`${Math.min((e.lateDays/lateRanking[0].lateDays)*100,100)}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Short hours ranking */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(239,68,68,0.12)' }}>
              <HiOutlineExclamation className="w-4 h-4 text-red-400"/>
            </div>
            <h3 className="font-display font-bold text-white">Incomplete Hours</h3>
          </div>
          {shortRanking.length === 0 ? (
            <div className="text-center text-slate-500 py-6 text-sm">
              ✅ All employees completing required hours!
            </div>
          ) : (
            <div className="space-y-2">
              {shortRanking.map((e, i) => (
                <div key={e.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i===0?'bg-red-500/30 text-red-300':
                    i===1?'bg-red-400/20 text-red-400':
                    'bg-slate-700/30 text-slate-500'
                  }`}>#{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{e.name}</div>
                    <div className="text-slate-500 text-xs">{e.dept}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-red-400 font-bold">{e.shortHoursDays}</div>
                    <div className="text-slate-600 text-[10px]">short days</div>
                  </div>
                  <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full bg-red-400"
                         style={{ width:`${Math.min((e.shortHoursDays/shortRanking[0].shortHoursDays)*100,100)}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Employee regularity table */}
      <div className="card overflow-x-auto p-0">
        <div className="px-6 py-4" style={{ borderBottom:'1px solid rgba(75,191,191,0.1)' }}>
          <h3 className="font-display font-bold text-white">Employee Regularity Summary</h3>
          <p className="text-slate-500 text-xs mt-0.5">{MONTHS[month-1]} {year}</p>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              {['Employee','Dept','Present','Absent','Late','Leave','Hours','Regularity','Flags'].map(h=>(
                <th key={h} className="text-left text-slate-500 text-[10px] font-semibold uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empList.length===0?(
              <tr><td colSpan={9} className="text-center text-slate-500 py-10">No data this period</td></tr>
            ):empList.sort((a,b)=>b.present-a.present).map(e => {
              const total = e.present+e.absent+e.late+e.half_day+e.leave+e.holiday
              const regularPct = total>0 ? Math.round(((e.present+e.half_day)/(total))*100) : 0
              const flags = []
              if (e.lateDays>2) flags.push({ label:`Late ${e.lateDays}x`, color:'text-amber-400' })
              if (e.shortHoursDays>2) flags.push({ label:`Short ${e.shortHoursDays}x`, color:'text-red-400' })
              if (e.absent>3) flags.push({ label:`Absent ${e.absent}x`, color:'text-red-400' })
              return (
                <tr key={e.id} className={`hover:bg-white/[0.02] transition-colors ${flags.length>0?'border-l-2 border-amber-500/40':''}`}
                    style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#0e1420] text-xs font-bold flex-shrink-0"
                           style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>
                        {e.name[0].toUpperCase()}
                      </div>
                      <span className="text-white text-sm font-medium">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{e.dept||'—'}</td>
                  <td className="px-4 py-3 text-[#f97316] font-semibold text-sm">{e.present}</td>
                  <td className="px-4 py-3 text-red-400 font-semibold text-sm">{e.absent||0}</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold text-sm">{e.late||0}</td>
                  <td className="px-4 py-3 text-violet-400 font-semibold text-sm">{e.leave||0}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{e.totalHours.toFixed(1)}h</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${regularPct}%`, background: regularPct>80?TEAL:regularPct>60?'#eab308':'#ef4444' }}/>
                      </div>
                      <span className={`text-xs font-bold ${regularPct>80?'text-[#f97316]':regularPct>60?'text-amber-400':'text-red-400'}`}>
                        {regularPct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {flags.length===0
                        ? <span className="text-[10px] text-emerald-400">✓ Good</span>
                        : flags.map((f,i) => <span key={i} className={`text-[10px] ${f.color}`}>⚠ {f.label}</span>)
                      }
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Date & Time Pickers ───────────────────────────────────────────────────────
function TimePicker({ date, hour, min, onDateChange, onHourChange, onMinChange, label, hint }) {
  return (
    <div>
      {label && <label className="block text-xs text-slate-400 mb-1.5">{label}</label>}
      <div className="grid grid-cols-3 gap-2">
        <input type="date" className="input py-2 text-sm" value={date} onChange={e=>onDateChange(e.target.value)}/>
        <select className="input py-2 text-sm" value={hour} onChange={e=>onHourChange(Number(e.target.value))}>
          {HOURS.map(h=><option key={h} value={h} className="bg-slate-900">{String(h).padStart(2,'0')}:00 {h<12?'AM':'PM'}</option>)}
        </select>
        <select className="input py-2 text-sm" value={min} onChange={e=>onMinChange(Number(e.target.value))}>
          {MINUTES.map(m=><option key={m} value={m} className="bg-slate-900">:{String(m).padStart(2,'0')}</option>)}
        </select>
      </div>
      {hint && <p className="text-slate-600 text-[10px] mt-1">{hint}</p>}
    </div>
  )
}

// ── Entry Modal ───────────────────────────────────────────────────────────────
function EntryModal({ employees, onClose, onSave, existing, companySettings }) {
  const nowPKT      = new Date(Date.now() + 5*3600000)
  const todayPKT    = nowPKT.toISOString().slice(0,10)
  const tomorrowPKT = new Date(nowPKT.getTime()+86400000).toISOString().slice(0,10)
  const shiftStartH = parseInt((companySettings?.shift_start||'18:00').split(':')[0])
  const shiftEndH   = parseInt((companySettings?.shift_end||'03:00').split(':')[0])

  const [status,    setStatus]    = useState(existing?.status||'present')
  const [empId,     setEmpId]     = useState(existing?.employee||'')
  const [shiftDate, setShiftDate] = useState(existing?.shift_date||todayPKT)
  const [notes,     setNotes]     = useState(existing?.notes||'')
  const [saving,    setSaving]    = useState(false)

  const inP  = parsePKT(existing?.check_in_pkt)
  const outP = parsePKT(existing?.check_out_pkt)
  const [inDate,  setInDate]  = useState(inP.date ||todayPKT)
  const [inHour,  setInHour]  = useState(inP.date ?inP.hour:shiftStartH)
  const [inMin,   setInMin]   = useState(inP.date ?inP.min:0)
  const [outDate, setOutDate] = useState(outP.date||tomorrowPKT)
  const [outHour, setOutHour] = useState(outP.date?outP.hour:shiftEndH)
  const [outMin,  setOutMin]  = useState(outP.date?outP.min:0)

  const showTime = STATUS_CFG[status]?.hasTime

  const handleShiftChange = (d) => {
    setShiftDate(d); setInDate(d)
    if (d) { const nx=new Date(d); nx.setDate(nx.getDate()+1); setOutDate(nx.toISOString().slice(0,10)) }
  }

  // Live hours
  let liveHours = null, isLate = false, isShort = false
  if (showTime) {
    try {
      const inDt  = new Date(`${inDate}T${fmt(inHour,inMin)}:00+05:00`)
      const outDt = new Date(`${outDate}T${fmt(outHour,outMin)}:00+05:00`)
      const hrs   = (outDt-inDt)/3600000
      const req   = parseFloat(companySettings?.daily_hours_required||9)
      const [sh,sm] = (companySettings?.shift_start||'18:00').split(':').map(Number)
      const expIn = new Date(`${inDate}T${fmt(sh,sm)}:00+05:00`)
      const mLate = (inDt-expIn)/60000
      isLate  = mLate > parseInt(companySettings?.late_threshold_minutes||30)
      isShort = hrs < req-0.25
      if (hrs>0) liveHours = { hrs, mLate: Math.round(mLate), req }
    } catch {}
  }

  const handleSave = async(e) => {
    e.preventDefault(); setSaving(true)
    const payload = {
      employee: empId, shift_date: shiftDate, status, notes,
      check_in_pkt:  showTime?`${inDate} ${fmt(inHour,inMin)}`:'',
      check_out_pkt: showTime?`${outDate} ${fmt(outHour,outMin)}`:'',
    }
    try {
      if (existing) { await api.patch(`/core/attendance/${existing.id}/`,payload); toast.success('Updated!') }
      else { await api.post('/core/attendance/',payload); toast.success('Recorded!') }
      onSave(); onClose()
    } catch(err) { toast.error(Object.values(err.response?.data||{}).flat().join(' ')||'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl p-6 w-full max-w-lg animate-slide-up my-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white text-lg">{existing?'Edit':'Add'} Attendance</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiOutlineX className="w-5 h-5"/></button>
        </div>
        <div className="glass rounded-xl p-3 mb-4 flex items-start gap-2 text-xs text-amber-400"
             style={{ background:'rgba(234,179,8,0.05)', border:'1px solid rgba(234,179,8,0.15)' }}>
          <HiOutlineClock className="w-4 h-4 flex-shrink-0 mt-0.5"/>
          <span>Shift: <b>{companySettings?.shift_start||'18:00'}</b> → <b>{companySettings?.shift_end||'03:00'}</b> PKT · Grace: <b>{companySettings?.late_threshold_minutes||30}m</b> · Required: <b>{companySettings?.daily_hours_required||9}h</b></span>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Employee *</label>
            <select required className="input" value={empId} onChange={e=>setEmpId(e.target.value)}>
              <option value="" className="bg-slate-900">Select Employee</option>
              {employees.map(emp=><option key={emp.id} value={emp.id} className="bg-slate-900">{emp.full_name} — {emp.department}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Shift Date *</label>
              <input type="date" className="input py-2.5" value={shiftDate} onChange={e=>handleShiftChange(e.target.value)}/>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Status</label>
              <select className="input py-2.5" value={status} onChange={e=>setStatus(e.target.value)}>
                {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k} className="bg-slate-900">{v.label}</option>)}
              </select>
            </div>
          </div>
          {showTime && <>
            <TimePicker label="Check-In (PKT)" date={inDate} hour={inHour} min={inMin}
              onDateChange={setInDate} onHourChange={setInHour} onMinChange={setInMin}
              hint="Date = shift start day (evening)"/>
            <TimePicker label="Check-Out (PKT)" date={outDate} hour={outHour} min={outMin}
              onDateChange={setOutDate} onHourChange={setOutHour} onMinChange={setOutMin}
              hint="For overnight shift = next calendar day"/>
            {liveHours && liveHours.hrs > 0 && (
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between text-sm ${isLate||isShort?'bg-amber-500/10 border border-amber-500/20':'bg-[#f97316]/10 border border-orange-500/20'}`}>
                <span className="text-slate-400">Working hours</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-lg ${isShort?'text-amber-400':'text-[#f97316]'}`}>{liveHours.hrs.toFixed(1)}h</span>
                  {isLate  && <span className="text-xs text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">⚠ Late {liveHours.mLate}m</span>}
                  {isShort && <span className="text-xs text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">⚠ Short {(liveHours.req-liveHours.hrs).toFixed(1)}h</span>}
                </div>
              </div>
            )}
          </>}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
            <input className="input" placeholder="Optional notes" value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving?'Saving...':'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Correction Modal ──────────────────────────────────────────────────────────
function CorrectionModal({ record, onClose, onSave }) {
  const inP  = parsePKT(record.check_in_pkt)
  const outP = parsePKT(record.check_out_pkt)
  const [inDate,  setInDate]  = useState(inP.date ||record.shift_date)
  const [inHour,  setInHour]  = useState(inP.hour ||18)
  const [inMin,   setInMin]   = useState(inP.min  ||0)
  const [outDate, setOutDate] = useState(outP.date||'')
  const [outHour, setOutHour] = useState(outP.hour||3)
  const [outMin,  setOutMin]  = useState(outP.min ||0)
  const [reason, setReason]   = useState('')
  const [saving, setSaving]   = useState(false)

  const handleSave = async(e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/core/corrections/', {
        attendance: record.id,
        requested_in_pkt:  `${inDate} ${fmt(inHour,inMin)}`,
        requested_out_pkt: outDate?`${outDate} ${fmt(outHour,outMin)}`:'',
        reason,
      })
      toast.success('Correction request submitted!')
      onSave(); onClose()
    } catch(err) { toast.error(Object.values(err.response?.data||{}).flat().join(' ')||'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-white text-lg">Request Correction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><HiOutlineX className="w-5 h-5"/></button>
        </div>
        <div className="glass rounded-xl p-3 mb-4 text-sm">
          <div className="text-slate-500 text-xs">Shift Date: <span className="text-white">{record.shift_date}</span></div>
          <div className="text-slate-500 text-xs mt-1">Current: {record.check_in_pkt||'—'} → {record.check_out_pkt||'—'}</div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <TimePicker label="Correct Check-In (PKT)" date={inDate} hour={inHour} min={inMin}
            onDateChange={setInDate} onHourChange={setInHour} onMinChange={setInMin}/>
          <TimePicker label="Correct Check-Out (PKT)" date={outDate} hour={outHour} min={outMin}
            onDateChange={setOutDate} onHourChange={setOutHour} onMinChange={setOutMin}
            hint="Leave blank if only correcting check-in"/>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Reason *</label>
            <textarea required className="input h-20 resize-none text-sm"
              placeholder="Explain the correction..." value={reason} onChange={e=>setReason(e.target.value)}/>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
              {saving?'Submitting...':'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Flags helper ─────────────────────────────────────────────────────────────
function AttendanceFlags({ record, settings }) {
  const flags = []
  if (!record.check_in_pkt) return null
  try {
    const [d1,t1] = record.check_in_pkt.split(' ')
    const inDt    = new Date(`${d1}T${t1}:00+05:00`)
    const [sh,sm] = (settings?.shift_start||'18:00').split(':').map(Number)
    const expIn   = new Date(`${record.shift_date}T${fmt(sh,sm)}:00+05:00`)
    const grace   = parseInt(settings?.late_threshold_minutes||30)
    const mLate   = Math.round((inDt-expIn)/60000)
    if (mLate>grace) flags.push({ l:`Late ${mLate}m`, c:'text-amber-400' })

    const reqH = parseFloat(settings?.daily_hours_required||9)
    if ((record.working_hours||0)<reqH-0.25)
      flags.push({ l:`Short ${(reqH-(record.working_hours||0)).toFixed(1)}h`, c:'text-red-400' })
  } catch {}
  return flags.length>0?(
    <div className="flex flex-wrap gap-1 mt-0.5">
      {flags.map((f,i)=><span key={i} className={`text-[10px] ${f.c}`}>⚠ {f.l}</span>)}
    </div>
  ):null
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user }  = useAuth()
  const canEdit   = user.role==='admin'||user.role==='hr'||user.is_dept_head
  const [records, setRecords]           = useState([])
  const [corrections, setCorrections]   = useState([])
  const [employees, setEmployees]       = useState([])
  const [settings, setSettings]         = useState(null)
  const [loading, setLoading]           = useState(true)
  const [viewMode, setViewMode]         = useState('analytics')  // 'analytics' | 'records' | 'corrections'
  const [showEntry, setShowEntry]       = useState(false)
  const [editRecord, setEditRecord]     = useState(null)
  const [correctionRecord, setCorrectionRecord] = useState(null)
  const [filter, setFilter] = useState({ month:new Date().getMonth()+1, year:new Date().getFullYear() })

  useEffect(()=>{
    api.get('/core/company-settings/').then(({data})=>setSettings(data)).catch(()=>{})
    if(canEdit) api.get('/users/').then(({data})=>setEmployees(data.results||data)).catch(()=>{})
  },[])

  useEffect(()=>{ fetchData() },[filter])

  const fetchData = async() => {
    setLoading(true)
    try {
      const [attRes,corrRes] = await Promise.all([
        api.get(`/core/attendance/?month=${filter.month}&year=${filter.year}`),
        api.get('/core/corrections/'),
      ])
      setRecords(attRes.data.results||attRes.data)
      setCorrections(corrRes.data.results||corrRes.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const handleApprove = async(id)=>{ try{ await api.post(`/core/corrections/${id}/approve/`,{}); toast.success('Approved'); fetchData() }catch{ toast.error('Failed') } }
  const handleReject  = async(id)=>{ try{ await api.post(`/core/corrections/${id}/reject/`,{}); toast.success('Rejected'); fetchData() }catch{ toast.error('Failed') } }

  const pendingCount = corrections.filter(c=>c.status==='pending').length
  const counts = records.reduce((acc,r)=>{ acc[r.status]=(acc[r.status]||0)+1; return acc },{})

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-white text-xl">Attendance</h2>
          <p className="text-slate-500 text-sm">
            Shift: {settings?.shift_start||'18:00'}–{settings?.shift_end||'03:00'} PKT ·
            Required: {settings?.daily_hours_required||9}h ·
            Grace: {settings?.late_threshold_minutes||30}m
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input py-2 text-sm w-28" value={filter.month} onChange={e=>setFilter(p=>({...p,month:+e.target.value}))}>
            {MONTHS_S.map((m,i)=><option key={i+1} value={i+1} className="bg-slate-900">{m}</option>)}
          </select>
          <select className="input py-2 text-sm w-24" value={filter.year} onChange={e=>setFilter(p=>({...p,year:+e.target.value}))}>
            {[2025,2026].map(y=><option key={y} value={y} className="bg-slate-900">{y}</option>)}
          </select>
          {canEdit&&(
            <button onClick={()=>setShowEntry(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
              <HiOutlinePlus className="w-4 h-4"/>Add Entry
            </button>
          )}
        </div>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-1" style={{ borderBottom:'1px solid rgba(75,191,191,0.1)' }}>
        {[
          { k:'analytics',   icon:HiOutlineChartBar,    label:'Analytics' },
          { k:'records',     icon:HiOutlineTable,       label:'Records' },
          { k:'corrections', icon:HiOutlineExclamation, label:`Corrections${pendingCount?` (${pendingCount})`:''}`},
        ].map(t=>(
          <button key={t.k} onClick={()=>setViewMode(t.k)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode===t.k?'text-[#f97316] border-orange-500':'text-slate-500 border-transparent hover:text-white'}`}>
            <t.icon className="w-4 h-4"/>{t.label}
          </button>
        ))}
      </div>

      {loading?(
        <div className="flex justify-center py-14">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor:'rgba(75,191,191,0.3)',borderTopColor:TEAL }}/>
        </div>
      ):viewMode==='analytics'?(
        <AnalyticsPanel records={records} employees={employees} settings={settings} month={filter.month} year={filter.year}/>
      ):viewMode==='records'?(
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(75,191,191,0.1)' }}>
                {(canEdit?['Employee','Shift Date','Check-In','Check-Out','Hours','Status','Actions']:['Shift Date','Check-In','Check-Out','Hours','Status','Actions']).map(h=>(
                  <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length===0?(
                <tr><td colSpan={7} className="text-center text-slate-500 py-14">No records</td></tr>
              ):records.map(r=>(
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  {canEdit&&(
                    <td className="px-5 py-4">
                      <div className="text-white font-medium text-sm">{r.employee_name}</div>
                      <div className="text-slate-500 text-xs">{r.employee_department}</div>
                    </td>
                  )}
                  <td className="px-5 py-4 text-slate-300 text-sm">{r.shift_date}</td>
                  <td className="px-5 py-4 text-slate-200 text-sm font-mono">{r.check_in_pkt?.split(' ')[1]||'—'}</td>
                  <td className="px-5 py-4 text-slate-200 text-sm font-mono">{r.check_out_pkt?.split(' ')[1]||'—'}</td>
                  <td className="px-5 py-4">
                    {r.working_hours>0?(
                      <div>
                        <span className={`font-semibold text-sm ${r.working_hours<(parseFloat(settings?.daily_hours_required||9)-0.25)?'text-amber-400':'text-white'}`}>{r.working_hours}h</span>
                        <AttendanceFlags record={r} settings={settings}/>
                      </div>
                    ):'—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs border ${STATUS_CFG[r.status]?.color||'text-slate-400'}`}>{STATUS_CFG[r.status]?.label||r.status}</span>
                    {r.is_correction&&<span className="ml-1 text-[10px] text-slate-600">edited</span>}
                  </td>
                  <td className="px-5 py-4">
                    {canEdit?(
                      <button onClick={()=>setEditRecord(r)} className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors" style={{ background:'rgba(255,255,255,0.06)' }}>
                        <HiOutlinePencil className="w-3.5 h-3.5"/>
                      </button>
                    ):(
                      <button onClick={()=>setCorrectionRecord(r)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background:'rgba(75,191,191,0.1)',color:TEAL }}>Claim</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ):(
        // Corrections
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(75,191,191,0.1)' }}>
                {['Employee','Shift Date','Requested Times','Reason','Status','Actions'].map(h=>(
                  <th key={h} className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corrections.length===0?(
                <tr><td colSpan={6} className="text-center text-slate-500 py-14">No correction requests</td></tr>
              ):corrections.map(c=>(
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4 text-white font-medium text-sm">{c.employee_name}</td>
                  <td className="px-5 py-4 text-slate-300 text-sm">{c.shift_date}</td>
                  <td className="px-5 py-4 text-slate-300 text-xs font-mono">
                    <div>In: {c.requested_in_pkt||'—'}</div>
                    <div>Out: {c.requested_out_pkt||'—'}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm max-w-xs">{c.reason}</td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${c.status==='pending'?'bg-amber-500/15 text-amber-400':c.status==='approved'?'bg-[#f97316]/15 text-[#f97316]':'bg-red-500/15 text-red-400'}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    {canEdit&&c.status==='pending'&&(
                      <div className="flex gap-2">
                        <button onClick={()=>handleApprove(c.id)} className="p-1.5 rounded-lg" style={{ background:'rgba(16,185,129,0.1)',color:'#34d399' }}><HiOutlineCheck className="w-4 h-4"/></button>
                        <button onClick={()=>handleReject(c.id)}  className="p-1.5 rounded-lg" style={{ background:'rgba(239,68,68,0.1)',color:'#f87171' }}><HiOutlineX className="w-4 h-4"/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEntry&&<EntryModal employees={employees} companySettings={settings} onClose={()=>setShowEntry(false)} onSave={fetchData}/>}
      {editRecord&&<EntryModal employees={employees} existing={editRecord} companySettings={settings} onClose={()=>setEditRecord(null)} onSave={fetchData}/>}
      {correctionRecord&&<CorrectionModal record={correctionRecord} onClose={()=>setCorrectionRecord(null)} onSave={fetchData}/>}
    </div>
  )
}
