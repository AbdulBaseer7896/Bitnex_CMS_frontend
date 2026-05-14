// ─────────────────────────────────────────────────────────────────────────────
// Period filter helper – returns ISO date range for predefined periods.
// Used by Accountant Expenses & Reports pages.
// ─────────────────────────────────────────────────────────────────────────────
const iso = (d) => d.toISOString().slice(0, 10)

export const PERIOD_OPTIONS = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'month',     label: 'This Month' },
  { key: 'last_month',label: 'Last Month' },
  { key: 'quarter',   label: 'This Quarter' },
  { key: 'year',      label: 'This Year' },
  { key: 'last_year', label: 'Last Year' },
  { key: 'all',       label: 'All Time' },
  { key: 'custom',    label: 'Custom Range' },
]

// Start of week = Monday (ISO).
const startOfWeek = (d) => {
  const x = new Date(d); const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x
}

export function rangeFor(period, custom = {}) {
  const now = new Date()
  let from = null, to = null
  switch (period) {
    case 'today':
      from = new Date(now); to = new Date(now); break
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      from = y; to = new Date(y); break
    }
    case 'week': {
      const s = startOfWeek(now); from = s; to = new Date(now); break
    }
    case 'last_week': {
      const s = startOfWeek(now); s.setDate(s.getDate() - 7)
      const e = new Date(s); e.setDate(e.getDate() + 6)
      from = s; to = e; break
    }
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to   = new Date(now); break
    case 'last_month':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to   = new Date(now.getFullYear(), now.getMonth(), 0); break
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3)
      from = new Date(now.getFullYear(), q * 3, 1)
      to   = new Date(now); break
    }
    case 'year':
      from = new Date(now.getFullYear(), 0, 1)
      to   = new Date(now); break
    case 'last_year':
      from = new Date(now.getFullYear() - 1, 0, 1)
      to   = new Date(now.getFullYear() - 1, 11, 31); break
    case 'all':
      return { from: null, to: null, label: 'All Time' }
    case 'custom':
      return {
        from: custom.from || null,
        to:   custom.to || null,
        label: custom.from && custom.to ? `${custom.from} → ${custom.to}` : 'Custom Range',
      }
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to   = new Date(now); break
  }
  return { from: iso(from), to: iso(to), label: PERIOD_OPTIONS.find(p => p.key === period)?.label }
}
