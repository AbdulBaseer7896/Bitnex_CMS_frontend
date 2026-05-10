import { useEffect, useState } from 'react'
import api from '../../api/client'
import { HiOutlineCheck, HiOutlineX, HiOutlineFilter, HiOutlineSearch } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const STATUS_COLORS = {
  pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
}

const LEAVE_TYPE_COLORS = {
  annual: 'text-blue-400',
  medical: 'text-rose-400',
  casual: 'text-violet-400',
  maternity: 'text-pink-400',
  paternity: 'text-teal-400',
  unpaid: 'text-slate-400',
}

export default function LeaveManagementPage() {
  const { user } = useAuth()
  const isHRorAdmin = ['admin', 'hr'].includes(user.role)
  const [leaves, setLeaves] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({ leave_type: 'annual', start_date: '', end_date: '', reason: '' })

  useEffect(() => {
    fetchLeaves()
  }, [])

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/applications/')
      setLeaves(data.results || data)
    } catch {
      toast.error('Failed to load leaves')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    try {
      await api.post(`/leaves/applications/${reviewModal.id}/approve/`, { note: reviewNote })
      toast.success('Leave approved')
      setReviewModal(null)
      setReviewNote('')
      fetchLeaves()
    } catch {
      toast.error('Action failed')
    }
  }

  const handleReject = async () => {
    try {
      await api.post(`/leaves/applications/${reviewModal.id}/reject/`, { note: reviewNote })
      toast.success('Leave rejected')
      setReviewModal(null)
      setReviewNote('')
      fetchLeaves()
    } catch {
      toast.error('Action failed')
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    try {
      await api.post('/leaves/applications/', applyForm)
      toast.success('Leave application submitted!')
      setShowApplyModal(false)
      fetchLeaves()
    } catch {
      toast.error('Failed to apply for leave')
    }
  }

  const filtered = leaves.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false
    if (search && !l.employee_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status filter pills */}
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === s ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'glass text-slate-400 hover:text-white'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {isHRorAdmin && (
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="glass rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/40 w-48"
              />
            </div>
          )}
          {!isHRorAdmin && (
            <button onClick={() => setShowApplyModal(true)} className="btn-primary text-sm px-5 py-2.5">
              + Apply for Leave
            </button>
          )}
        </div>
      </div>

      {/* Leave count badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: leaves.length, color: 'text-slate-300' },
          { label: 'Pending', count: leaves.filter(l => l.status === 'pending').length, color: 'text-amber-400' },
          { label: 'Approved', count: leaves.filter(l => l.status === 'approved').length, color: 'text-emerald-400' },
          { label: 'Rejected', count: leaves.filter(l => l.status === 'rejected').length, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-slate-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Leave table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {isHRorAdmin && <th className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3 pr-6">Employee</th>}
                  <th className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3 pr-6">Type</th>
                  <th className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3 pr-6">Dates</th>
                  <th className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3 pr-6">Days</th>
                  <th className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3 pr-6">Status</th>
                  {isHRorAdmin && <th className="text-left text-slate-500 text-xs font-semibold uppercase tracking-wider pb-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-slate-500 py-12">No leave applications found</td></tr>
                ) : filtered.map((leave) => (
                  <tr key={leave.id} className="hover:bg-white/[0.02] transition-colors">
                    {isHRorAdmin && (
                      <td className="py-4 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                            {leave.employee_name?.[0]}
                          </div>
                          <span className="text-white text-sm font-medium">{leave.employee_name}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-4 pr-6">
                      <span className={`text-sm font-medium capitalize ${LEAVE_TYPE_COLORS[leave.leave_type] || 'text-slate-300'}`}>
                        {leave.leave_type}
                      </span>
                    </td>
                    <td className="py-4 pr-6">
                      <div className="text-slate-300 text-sm">{leave.start_date}</div>
                      <div className="text-slate-500 text-xs">to {leave.end_date}</div>
                    </td>
                    <td className="py-4 pr-6">
                      <span className="font-display font-bold text-white">{leave.days_requested}</span>
                      <span className="text-slate-500 text-xs ml-1">days</span>
                    </td>
                    <td className="py-4 pr-6">
                      <span className={`badge capitalize ${STATUS_COLORS[leave.status]}`}>{leave.status}</span>
                    </td>
                    {isHRorAdmin && (
                      <td className="py-4">
                        {leave.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReviewModal(leave)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold transition-colors"
                            >
                              <HiOutlineCheck className="w-4 h-4" />Review
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-white text-xl mb-2">Review Leave Request</h3>
            <div className="glass rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Employee</span>
                <span className="text-white">{reviewModal.employee_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Leave Type</span>
                <span className="text-white capitalize">{reviewModal.leave_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Duration</span>
                <span className="text-white">{reviewModal.days_requested} days ({reviewModal.start_date} → {reviewModal.end_date})</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-500 block mb-1">Reason</span>
                <span className="text-slate-300">{reviewModal.reason}</span>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm text-slate-400 mb-2">Review Note (optional)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="input h-24 resize-none"
                placeholder="Add a note..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold transition-colors">
                <HiOutlineX className="w-4 h-4" /> Reject
              </button>
              <button onClick={handleApprove} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-semibold transition-colors">
                <HiOutlineCheck className="w-4 h-4" /> Approve
              </button>
            </div>
            <button onClick={() => setReviewModal(null)} className="w-full mt-3 text-slate-500 text-sm hover:text-slate-300 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-light rounded-3xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="font-display font-bold text-white text-xl mb-5">Apply for Leave</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Leave Type</label>
                <select
                  value={applyForm.leave_type}
                  onChange={(e) => setApplyForm(p => ({ ...p, leave_type: e.target.value }))}
                  className="input"
                >
                  {['annual', 'medical', 'casual', 'maternity', 'paternity', 'unpaid'].map(t => (
                    <option key={t} value={t} className="bg-slate-900">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                  <input type="date" required value={applyForm.start_date} onChange={(e) => setApplyForm(p => ({ ...p, start_date: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">End Date</label>
                  <input type="date" required value={applyForm.end_date} onChange={(e) => setApplyForm(p => ({ ...p, end_date: e.target.value }))} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Reason</label>
                <textarea required value={applyForm.reason} onChange={(e) => setApplyForm(p => ({ ...p, reason: e.target.value }))} className="input h-24 resize-none" placeholder="Describe your reason..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 btn-ghost">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
