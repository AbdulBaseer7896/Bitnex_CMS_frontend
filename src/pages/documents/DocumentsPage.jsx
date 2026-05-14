import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineDocumentText, HiOutlineUserCircle,
  HiOutlinePrinter, HiOutlineTrash, HiOutlineFilter, HiOutlineCalendar,
  HiOutlineDownload, HiOutlineX, HiOutlinePlus, HiOutlineRefresh,
} from 'react-icons/hi'
import api from '../../api/client'
import { DOC_TYPES, DOC_LABEL } from './documentTemplates'
import DocumentGeneratorModal from './DocumentGeneratorModal'
import LetterPreview from './LetterPreview'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDT   = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function DocumentsPage() {
  const [employees, setEmployees] = useState([])
  const [empLoad, setEmpLoad]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)

  const [history, setHistory]     = useState([])
  const [histLoad, setHistLoad]   = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [fromDate, setFrom]       = useState('')
  const [toDate, setTo]           = useState('')

  const [genType, setGenType]     = useState(null)
  const [reprint, setReprint]     = useState(null)

  // ── Load employees ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setEmpLoad(true)
      try {
        const { data } = await api.get('/users/?page_size=500')
        const list = (data.results || data).filter(u => u.role !== 'customer')
        setEmployees(list)
        if (list.length) setSelected(list[0])
      } catch { toast.error('Failed to load employees') }
      finally { setEmpLoad(false) }
    })()
  }, [])

  // ── Load history for selected employee ───────────────────────────────────
  const fetchHistory = async () => {
    if (!selected) return
    setHistLoad(true)
    try {
      const params = { employee: selected.id }
      if (typeFilter !== 'all') params.doc_type = typeFilter
      if (fromDate) params.from = fromDate
      if (toDate)   params.to   = toDate
      const { data } = await api.get('/documents/', { params })
      setHistory(data.results || data)
    } catch { toast.error('Failed to load history') }
    finally { setHistLoad(false) }
  }
  useEffect(() => { fetchHistory() }, [selected?.id, typeFilter, fromDate, toDate])

  // ── Filtered employee list ───────────────────────────────────────────────
  const filteredEmps = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(e =>
      (e.full_name || '').toLowerCase().includes(q) ||
      (e.username  || '').toLowerCase().includes(q) ||
      (e.department|| '').toLowerCase().includes(q) ||
      (e.designation || '').toLowerCase().includes(q)
    )
  }, [employees, search])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document from history? This cannot be undone.')) return
    try {
      await api.delete(`/documents/${id}/`)
      toast.success('Deleted')
      fetchHistory()
    } catch { toast.error('Failed to delete') }
  }

  const handleReprint = (doc) => {
    setReprint(doc)
    setTimeout(() => {
      document.body.classList.add('printing-letter')
      setTimeout(() => {
        window.print()
        setTimeout(() => {
          document.body.classList.remove('printing-letter')
          setReprint(null)
        }, 300)
      }, 80)
    }, 50)
  }

  return (
    <>
      {/* Hidden print container for reprint flow */}
      {reprint && (
        <div id="print-root" className="print-only">
          <LetterPreview doc={reprint} printable/>
        </div>
      )}

      <div className="screen-only space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Documents</h1>
            <p className="text-slate-500 text-sm mt-0.5">Generate and manage official HR documents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          {/* ── Left: Employees list ──────────────────────────────────── */}
          <aside className="glass rounded-2xl flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input className="input pl-9 py-2 text-sm" placeholder="Search employee..."
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <div className="text-[11px] text-slate-600 mt-2 px-1">{filteredEmps.length} of {employees.length} employees</div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {empLoad ? (
                <div className="text-center text-slate-500 text-sm py-10">Loading...</div>
              ) : filteredEmps.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-10">No employees found</div>
              ) : filteredEmps.map(e => {
                const isSel = selected?.id === e.id
                const initials = (e.full_name || e.username || 'U').split(' ').map(s => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase()
                return (
                  <button key={e.id} onClick={() => setSelected(e)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSel ? 'bg-orange-500/12 border border-orange-500/25' : 'hover:bg-white/[0.04] border border-transparent'
                    }`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                      {initials || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isSel ? 'text-orange-400' : 'text-white'}`}>{e.full_name || e.username}</div>
                      <div className="text-[11px] text-slate-500 truncate">{e.designation || e.role} · {e.department || '—'}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* ── Right: Detail panel ───────────────────────────────────── */}
          <main className="space-y-4">
            {!selected ? (
              <div className="glass rounded-2xl p-10 text-center text-slate-500">
                <HiOutlineUserCircle className="w-12 h-12 mx-auto mb-3 opacity-40"/>
                Select an employee to begin
              </div>
            ) : (
              <>
                {/* Employee header */}
                <div className="glass rounded-2xl p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                    {(selected.full_name || selected.username || 'U').split(' ').map(s => s[0]).filter(Boolean).slice(0,2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-bold text-white text-lg truncate">{selected.full_name || selected.username}</h2>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>BTX-{String(selected.id).padStart(4, '0')}</span>·
                      <span>{selected.designation || '—'}</span>·
                      <span>{selected.department || '—'}</span>·
                      <span>Joined {fmtDate(selected.joining_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Generate buttons grid */}
                <div className="glass rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <HiOutlinePlus className="w-4 h-4 text-orange-400"/> Generate Document
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                    {DOC_TYPES.map(d => (
                      <button key={d.key} onClick={() => setGenType(d.key)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-all
                                   bg-white/[0.03] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30
                                   text-slate-300 hover:text-orange-400">
                        <span className="text-base">{d.icon}</span>
                        <span className="truncate text-xs font-medium">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div className="glass rounded-2xl p-3 flex items-center gap-2 flex-wrap">
                  <HiOutlineFilter className="w-4 h-4 text-slate-500 ml-1"/>
                  <select className="input py-1.5 text-xs w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="all">All Types</option>
                    {DOC_TYPES.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                  <div className="flex items-center gap-1.5 text-xs">
                    <HiOutlineCalendar className="w-3.5 h-3.5 text-slate-500"/>
                    <input type="date" className="input py-1.5 text-xs w-auto" value={fromDate} onChange={e => setFrom(e.target.value)}/>
                    <span className="text-slate-600">→</span>
                    <input type="date" className="input py-1.5 text-xs w-auto" value={toDate} onChange={e => setTo(e.target.value)}/>
                  </div>
                  {(typeFilter !== 'all' || fromDate || toDate) && (
                    <button onClick={() => { setTypeFilter('all'); setFrom(''); setTo('') }}
                      className="text-xs text-slate-500 hover:text-orange-400 flex items-center gap-1">
                      <HiOutlineX className="w-3 h-3"/> Clear
                    </button>
                  )}
                  <button onClick={fetchHistory} className="ml-auto text-slate-500 hover:text-orange-400" title="Refresh">
                    <HiOutlineRefresh className="w-4 h-4"/>
                  </button>
                </div>

                {/* History table */}
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <HiOutlineDocumentText className="w-4 h-4 text-orange-400"/> Document History
                    </h3>
                    <span className="text-xs text-slate-500">{history.length} record{history.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="overflow-x-auto">
                    {histLoad ? (
                      <div className="text-center text-slate-500 text-sm py-10">Loading...</div>
                    ) : history.length === 0 ? (
                      <div className="text-center text-slate-600 text-sm py-10">
                        <HiOutlineDocumentText className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                        No documents generated yet
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/5">
                            <th className="text-left px-4 py-2.5 font-semibold">Document</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Issue Date</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Generated</th>
                            <th className="text-left px-4 py-2.5 font-semibold">By</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map(d => (
                            <tr key={d.id} className="table-row-hover border-b border-white/[0.03] last:border-0">
                              <td className="px-4 py-3">
                                <div className="text-white font-medium text-sm">{DOC_LABEL[d.doc_type] || d.doc_type}</div>
                                {d.notes && <div className="text-[11px] text-slate-500 truncate max-w-xs">{d.notes}</div>}
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{fmtDate(d.issue_date)}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{fmtDT(d.created_at)}</td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{d.generated_by_name || '—'}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleReprint(d)} title="Download / Print"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                                    <HiOutlineDownload className="w-4 h-4"/>
                                  </button>
                                  <button onClick={() => handleReprint(d)} title="Reprint"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-500/10">
                                    <HiOutlinePrinter className="w-4 h-4"/>
                                  </button>
                                  <button onClick={() => handleDelete(d.id)} title="Delete"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                                    <HiOutlineTrash className="w-4 h-4"/>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Generator modal */}
      {genType && selected && (
        <DocumentGeneratorModal
          employee={selected}
          docType={genType}
          onClose={() => setGenType(null)}
          onSaved={() => { setGenType(null); fetchHistory() }}
        />
      )}
    </>
  )
}
