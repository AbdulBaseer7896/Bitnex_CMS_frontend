import { useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineX, HiOutlineXCircle,
  HiOutlineCurrencyDollar, HiOutlineArrowRight,
  HiOutlinePhotograph, HiOutlineCheckCircle,
} from 'react-icons/hi'
import { fmtAmount, fmtPKR, fmtDate, fmtDateTime, StatusChip } from './utils'

const todayISO = () => new Date().toISOString().slice(0, 10)
const monthOf  = (d) => Number(d.slice(5, 7))
const yearOf   = (d) => Number(d.slice(0, 4))

export default function ClaimDetailModal({ claim, role, onClose, onChanged }) {
  const [busy, setBusy]   = useState(false)
  const [notes, setNotes] = useState('')
  const [rejectReason, setRR] = useState('')
  const [paidDate, setPD] = useState(todayISO())
  const [month, setMonth] = useState(monthOf(todayISO()))
  const [year, setYear]   = useState(yearOf(todayISO()))
  const [showReject, setShowReject] = useState(false)

  const isFinance = role === 'admin' || role === 'accountant'
  const isHR      = role === 'admin' || role === 'hr'

  const call = async (path, body = {}) => {
    setBusy(true)
    try {
      await api.post(`/reimbursements/${claim.id}/${path}/`, body)
      toast.success('Done')
      onChanged()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed')
    } finally { setBusy(false) }
  }

  // Approve removed from UI per requirement. Finance acts directly:
  //   • Reject (any open state)
  //   • Settle Directly (pending / approved-legacy)
  //   • Forward to HR (pending / approved-legacy)
  const openForFinance = ['pending', 'approved'].includes(claim.status)
  const canReject    = isFinance && ['pending', 'approved', 'forwarded_to_hr'].includes(claim.status)
  const canSettle    = isFinance && openForFinance
  const canForward   = isFinance && openForFinance
  const canIncludeHR = isHR      && claim.status === 'forwarded_to_hr'

  const proof = claim.proof_url || claim.proof

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-light rounded-3xl w-full max-w-3xl animate-slide-up my-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Claim RC-{claim.id}</div>
            <h3 className="font-display font-bold text-white text-lg">{claim.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <HiOutlineX className="w-6 h-6"/>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px]">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusChip status={claim.status} hr={role === 'hr'}/>
              {claim.settlement_label && claim.settlement_mode && (
                <span className="badge bg-white/5 text-slate-400 border border-white/10">
                  Route: {claim.settlement_label}
                </span>
              )}
            </div>

            <Row k="Employee" v={`${claim.employee_name} · ${claim.employee_role}`}/>
            {claim.employee_dept && <Row k="Department" v={claim.employee_dept}/>}
            <Row k="Amount" v={
              <span className="font-display font-bold text-white text-base">
                {fmtAmount(claim.amount, claim.currency)}
                {claim.currency === 'USD' && (
                  <span className="text-xs text-slate-500 ml-2 font-normal">
                    ≈ {fmtPKR(claim.amount_pkr)} @ {claim.fx_rate}
                  </span>
                )}
              </span>
            }/>
            <Row k="Date" v={fmtDate(claim.claim_date)}/>
            <Row k="Submitted" v={fmtDateTime(claim.created_at)}/>

            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Reason</div>
              <div className="text-sm text-slate-300 whitespace-pre-wrap">{claim.reason}</div>
            </div>

            {claim.accountant_notes && (
              <div className="rounded-xl p-3 text-xs"
                style={{ background: 'rgba(6,182,212,0.08)', borderLeft: '3px solid #06b6d4' }}>
                <div className="text-cyan-400 font-semibold mb-1">Accounts Notes</div>
                <div className="text-slate-300 whitespace-pre-wrap">{claim.accountant_notes}</div>
              </div>
            )}
            {claim.rejection_reason && (
              <div className="rounded-xl p-3 text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #ef4444' }}>
                <div className="text-red-400 font-semibold mb-1">Rejection Reason</div>
                <div className="text-slate-300 whitespace-pre-wrap">{claim.rejection_reason}</div>
              </div>
            )}

            {/* Owner-facing payout banner */}
            {claim.status === 'paid_with_salary' && (
              <div className="rounded-xl p-3 text-xs"
                style={{ background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid #10b981' }}>
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <HiOutlineCheckCircle className="w-4 h-4"/>
                  Included in your salary
                </div>
                <div className="text-slate-300">
                  {fmtPKR(claim.amount_pkr)} added to your monthly salary slip. It will appear in
                  the next payslip under <strong>Additional Payment / Reimbursement</strong>.
                </div>
              </div>
            )}
            {claim.status === 'settled' && (
              <div className="rounded-xl p-3 text-xs"
                style={{ background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid #10b981' }}>
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <HiOutlineCheckCircle className="w-4 h-4"/>
                  Settled directly
                </div>
                <div className="text-slate-300">
                  {fmtPKR(claim.amount_pkr)} was paid out by Accounts.
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-600 space-y-0.5 pt-2">
              {claim.reviewed_by_name && <div>Reviewed by {claim.reviewed_by_name} · {fmtDateTime(claim.reviewed_at)}</div>}
              {claim.settled_by_name && <div>Settled by {claim.settled_by_name} · {fmtDateTime(claim.settled_at)}</div>}
              {claim.linked_expense && <div>Linked Expense #{claim.linked_expense}</div>}
              {claim.salary_slip && <div>Linked Salary Slip #{claim.salary_slip}</div>}
            </div>
          </div>

          <div className="p-4 border-t md:border-t-0 md:border-l border-white/5 bg-white/[0.02]">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2">Proof</div>
            {proof ? (
              <a href={proof} target="_blank" rel="noreferrer"
                className="block rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/40 transition-colors">
                <img src={proof} alt="proof" className="w-full h-auto object-contain"/>
              </a>
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600 text-xs">
                <HiOutlinePhotograph className="w-8 h-8 mb-1 opacity-50"/>
                No proof attached
              </div>
            )}
          </div>
        </div>

        {(canReject || canSettle || canForward || canIncludeHR) && (
          <div className="px-6 py-4 border-t border-white/5 space-y-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {(canSettle || canForward) && (
              <textarea rows={2} className="input text-xs" placeholder="Notes (optional)"
                value={notes} onChange={e => setNotes(e.target.value)}/>
            )}

            {showReject && (
              <div className="space-y-2">
                <textarea rows={2} className="input text-xs" placeholder="Reason for rejection *"
                  value={rejectReason} onChange={e => setRR(e.target.value)}/>
                <div className="flex gap-2">
                  <button onClick={() => setShowReject(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                  <button disabled={!rejectReason.trim() || busy}
                    onClick={() => call('reject', { reason: rejectReason })}
                    className="btn-danger text-xs px-3 py-1.5">Confirm Rejection</button>
                </div>
              </div>
            )}

            {canSettle && !showReject && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Paid on:</span>
                <input type="date" className="input py-1 text-xs w-auto" value={paidDate}
                  onChange={e => setPD(e.target.value)}/>
              </div>
            )}

            {canIncludeHR && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Include in payroll for:</span>
                <select className="input py-1 text-xs w-auto" value={month}
                  onChange={e => setMonth(Number(e.target.value))}>
                  {Array.from({length: 12}, (_, i) => i+1).map(m => (
                    <option key={m} value={m} className="bg-slate-900">
                      {new Date(2025, m-1, 1).toLocaleString('en', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <input type="number" className="input py-1 text-xs w-20" value={year}
                  onChange={e => setYear(Number(e.target.value))}/>
              </div>
            )}

            {!showReject && (
              <div className="flex gap-2 flex-wrap justify-end">
                {canReject && (
                  <button onClick={() => setShowReject(true)} disabled={busy}
                    className="btn-danger text-xs px-3 py-2 flex items-center gap-1.5">
                    <HiOutlineXCircle className="w-4 h-4"/> Reject
                  </button>
                )}
                {canForward && (
                  <button onClick={() => call('forward_to_hr', { notes })} disabled={busy}
                    className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5"
                    style={{ borderColor: 'rgba(167,139,250,0.4)', color: '#a78bfa' }}>
                    <HiOutlineArrowRight className="w-4 h-4"/> Forward to HR
                  </button>
                )}
                {canSettle && (
                  <button onClick={() => call('settle_direct', { notes, paid_date: paidDate })} disabled={busy}
                    className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                    <HiOutlineCurrencyDollar className="w-4 h-4"/> Settle Directly
                  </button>
                )}
                {canIncludeHR && (
                  <button onClick={() => call('include_in_salary', { month, year })} disabled={busy}
                    className="btn-primary text-xs px-3 py-2 flex items-center gap-1.5">
                    <HiOutlineCheckCircle className="w-4 h-4"/> Add to Salary
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 text-sm">
      <div className="text-slate-500 text-xs uppercase tracking-wider pt-0.5">{k}</div>
      <div className="text-slate-200">{v}</div>
    </div>
  )
}
