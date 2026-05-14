// ─────────────────────────────────────────────────────────────────────────────
// Reimbursement utilities — labels, statuses, formatters.
// One module reused by all three role-views (employee, accounts, HR).
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: HR sees claims under a different friendly label per requirement —
// the underlying status is the same, but visible chips/section titles differ.
export const STATUS_META = {
  pending:          { label: 'Pending Review',     hr: 'Pending Review',           color: '#eab308' },
  approved:         { label: 'Approved',           hr: 'Approved',                 color: '#06b6d4' },
  forwarded_to_hr:  { label: 'Forwarded to HR',    hr: 'Additional Payment Due',   color: '#a78bfa' },
  settled:          { label: 'Settled',            hr: 'Settled by Accounts',      color: '#10b981' },
  paid_with_salary: { label: 'Paid with Salary',   hr: 'Included in Salary',       color: '#10b981' },
  rejected:         { label: 'Rejected',           hr: 'Rejected',                 color: '#ef4444' },
}

export const CURRENCIES = [
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'PKR', label: 'PKR (₨)', symbol: '₨' },
]

export const fmtAmount = (amount, currency) => {
  const sym = currency === 'USD' ? '$' : '₨'
  return sym + Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export const fmtPKR = (n) => '₨' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })

export const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—'

export const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

// Status chip used everywhere
export function StatusChip({ status, hr = false }) {
  const m = STATUS_META[status] || STATUS_META.pending
  const label = hr ? m.hr : m.label
  return (
    <span className="badge border" style={{
      background: m.color + '20', color: m.color, borderColor: m.color + '40',
    }}>{label}</span>
  )
}
