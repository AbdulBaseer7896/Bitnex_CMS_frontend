import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineRefresh, HiOutlineExclamation, HiOutlineX, HiOutlineCheck,
  HiOutlineDatabase, HiOutlineUsers, HiOutlineTrash,
  HiOutlineArrowRight, HiOutlineInformationCircle, HiOutlineSearch,
  HiOutlineArchive, HiOutlineClipboardCheck, HiOutlineUser,
  HiOutlineCalendar, HiOutlineClock, HiOutlineChevronDown, HiOutlineChevronUp,
} from 'react-icons/hi'

const REMOVAL_REASONS = [
  ['deleted_from_dat',  'Deleted from DAT system'],
  ['replaced',          'Replaced / Renamed'],
  ['transferred',       'Transferred to another account'],
  ['banned',            'Banned by DAT'],
  ['contract_ended',    'Contract Ended'],
  ['other',             'Other'],
]
const REMOVAL_REASON_LABELS = Object.fromEntries(REMOVAL_REASONS)
const inp2 = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50'
const TEAL = '#f97316'

// ── Archive confirm modal ─────────────────────────────────────────────────────
function ArchiveModal({ title, description, onArchive, onClose }) {
  const [reason, setReason] = useState('deleted_from_dat')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const confirm = async () => {
    setSaving(true)
    try { await onArchive(reason, notes) } finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-light rounded-2xl w-full max-w-md" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-white font-bold text-lg">Archive Record</h3>
            <p className="text-slate-500 text-xs mt-0.5">{title}</p>
          </div>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-slate-300 text-sm">{description}</p>
            <p className="text-slate-500 text-xs mt-2">This record will appear in the <strong className="text-white">Resolved History</strong> tab.</p>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Why was this removed?</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className={inp2}>
              {REMOVAL_REASONS.map(([v,l]) => <option key={v} value={v} className="bg-[#0e1420]">{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block font-medium">Additional Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inp2} placeholder="Any additional context…" />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm">Cancel</button>
          <button onClick={confirm} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}>
            {saving ? 'Archiving…' : 'Confirm & Archive'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Customer badge ────────────────────────────────────────────────────────────
function CustomerBadge({ name, label = 'Assigned to' }) {
  if (!name) return null
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ background: 'rgba(75,191,191,0.1)', border: '1px solid rgba(75,191,191,0.2)' }}>
      <HiOutlineUser className="w-3.5 h-3.5 text-[#f97316]" />
      <span className="text-slate-400">{label}:</span>
      <span className="text-[#f97316] font-semibold">{name}</span>
    </span>
  )
}

// ── DAT Account conflict card ─────────────────────────────────────────────────
function DATAccountConflict({ account, onResolved }) {
  const [saving, setSaving] = useState(false)
  const [archiveModal, setArchiveModal] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isRemoved = account.sync_status === 'removed'
  const hasSeats  = (account.active_seat_count || 0) > 0

  const resolve = async (action) => {
    setSaving(true)
    try {
      await api.post(`/store/conflicts/resolve/dat-account/${account.id}/`, { action })
      toast.success(action === 'accept_mongo' ? `MongoDB version applied for ${account.name}` : `Resolved: ${account.name}`)
      onResolved()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const archiveAccount = async (reason, notes) => {
    await api.post(`/store/archive/dat-account/${account.id}/`, { removal_reason: reason, removal_notes: notes })
    toast.success(`${account.name} archived to Resolved History`)
    setArchiveModal(false)
    onResolved()
  }

  return (
    <div className="glass-light rounded-2xl p-5"
      style={{ border: `1px solid ${isRemoved ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}` }}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isRemoved ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
          {isRemoved ? <HiOutlineTrash className="w-5 h-5 text-red-400" /> : <HiOutlineExclamation className="w-5 h-5 text-orange-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-white font-bold">{account.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isRemoved ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'}`}>
              {isRemoved ? '⚠ REMOVED FROM MONGODB' : '⚠ CONFLICT'}
            </span>
            <span className="text-slate-500 text-xs">DAT Account</span>
          </div>
          {account.proxy && <div className="text-slate-500 text-xs font-mono mb-2">{account.proxy}</div>}
          <div className="flex flex-wrap gap-2 mt-1">
            {hasSeats && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <HiOutlineUsers className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-300 font-semibold">{account.active_seat_count} active seat{account.active_seat_count > 1 ? 's' : ''} affected</span>
              </span>
            )}
            {account.customer_names?.map(cn => <CustomerBadge key={cn} name={cn} />)}
          </div>
        </div>
      </div>

      {isRemoved ? (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="text-red-300 font-semibold text-sm mb-1">Not found in latest MongoDB sync</div>
          <div className="text-slate-400 text-sm">
            {hasSeats
              ? `${account.active_seat_count} customer seat(s) are currently using this account and will be affected.`
              : 'No active customer seats are linked to this account.'}
          </div>
          {account.removal_reason && <div className="text-slate-500 text-xs mt-2 italic">Detected reason: {account.removal_reason}</div>}
        </div>
      ) : account.conflict_data && (
        <div className="mb-4">
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-orange-400 text-xs font-semibold mb-2 hover:text-orange-300">
            {expanded ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
            {Object.keys(account.conflict_data).length} field difference{Object.keys(account.conflict_data).length > 1 ? 's' : ''}
          </button>
          {expanded && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(249,115,22,0.15)' }}>
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ background: 'rgba(249,115,22,0.08)' }}>
                <div className="text-orange-400">Field</div><div className="text-slate-500">CMS</div><div className="text-emerald-400">MongoDB</div>
              </div>
              <div className="divide-y divide-white/5">
                {Object.entries(account.conflict_data).map(([field, vals]) => (
                  <div key={field} className="grid grid-cols-3 gap-4 px-4 py-2.5">
                    <div className="text-slate-500 text-xs capitalize">{field.replace(/_/g, ' ')}</div>
                    <div className="text-white font-mono text-xs">{String(vals.cms || '—')}</div>
                    <div className="text-emerald-400 font-mono text-xs">{String(vals.mongo || '—')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {isRemoved ? (
          <>
            <button onClick={() => resolve('keep_cms')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25">
              <HiOutlineCheck className="w-4 h-4" /> Keep — Renamed / Moved
            </button>
            <button onClick={() => resolve('mark_removed')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25">
              <HiOutlineTrash className="w-4 h-4" /> Confirm Deleted from DAT
            </button>
            <button onClick={() => setArchiveModal(true)} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20 hover:bg-slate-500/25">
              <HiOutlineArchive className="w-4 h-4" /> Archive to History
            </button>
          </>
        ) : (
          <>
            <button onClick={() => resolve('keep_cms')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25">
              <HiOutlineCheck className="w-4 h-4" /> Keep CMS version
            </button>
            <button onClick={() => resolve('accept_mongo')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[#0e1420] font-semibold"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <HiOutlineArrowRight className="w-4 h-4" /> Accept MongoDB version
            </button>
          </>
        )}
      </div>

      {archiveModal && (
        <ArchiveModal
          title={account.name}
          description={`Archive "${account.name}" from active DAT accounts.${hasSeats ? ` This will affect ${account.active_seat_count} customer seat(s).` : ''}`}
          onArchive={archiveAccount}
          onClose={() => setArchiveModal(false)}
        />
      )}
    </div>
  )
}

// ── MongoUser conflict card ───────────────────────────────────────────────────
function MongoUserConflict({ user, onResolved }) {
  const [saving, setSaving] = useState(false)
  const [archiveModal, setArchiveModal] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isRemoved = user.sync_status === 'removed'

  const resolve = async (action) => {
    setSaving(true)
    try {
      await api.post(`/store/conflicts/resolve/mongo-user/${user.id}/`, { action })
      const labels = { keep_cms: 'CMS version kept', accept_mongo: 'MongoDB version accepted', mark_deleted: 'User marked as deleted' }
      toast.success(labels[action] || 'Resolved')
      onResolved()
    } catch (e) { toast.error(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const archiveUser = async (reason, notes) => {
    await api.post(`/store/archive/dat-user/${user.id}/`, { removal_reason: reason, removal_notes: notes })
    toast.success(`${user.name} archived to Resolved History`)
    setArchiveModal(false)
    onResolved()
  }

  return (
    <div className="glass-light rounded-2xl p-5"
      style={{ border: `1px solid ${isRemoved ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}` }}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-[#0e1420] ${isRemoved ? 'bg-red-400' : 'bg-orange-400'}`}>
          {(user.name?.[0] || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-white font-bold">{user.name}</span>
            <span className="text-slate-400 text-sm">{user.email}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isRemoved ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'}`}>
              {isRemoved ? '⚠ REMOVED FROM MONGODB' : '⚠ CONFLICT'}
            </span>
            {user.is_banned && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/15 text-red-400">DAT Banned</span>}
          </div>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {user.dat_account_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-white/5 text-slate-400">
                <HiOutlineDatabase className="w-3 h-3" /> {user.dat_account_name}
              </span>
            )}
            {/* Customer who has this user assigned — KEY INFO */}
            {user.assigned_customer_name && (
              <CustomerBadge name={user.assigned_customer_name} label="Customer" />
            )}
            {user.removed_at && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <HiOutlineClock className="w-3 h-3" />
                Detected: {new Date(user.removed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {isRemoved ? (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="text-red-300 font-semibold text-sm mb-1">Not found in latest MongoDB sync</div>
          <div className="text-slate-400 text-sm">
            {user.assigned_customer_name ? (
              <>Customer <span className="text-[#f97316] font-semibold">{user.assigned_customer_name}</span> has this user assigned to their active seat.</>
            ) : 'No active customer seat is currently assigned to this user.'}
            {' '}They may have been deleted, renamed, or moved.
          </div>
          {user.removal_reason && <div className="text-slate-500 text-xs mt-2 italic">Detected: {user.removal_reason}</div>}
        </div>
      ) : user.conflict_data && (
        <div className="mb-4">
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-orange-400 text-xs font-semibold mb-2 hover:text-orange-300">
            {expanded ? <HiOutlineChevronUp className="w-3.5 h-3.5" /> : <HiOutlineChevronDown className="w-3.5 h-3.5" />}
            {Object.keys(user.conflict_data).length} field difference{Object.keys(user.conflict_data).length > 1 ? 's' : ''}
          </button>
          {expanded && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(249,115,22,0.15)' }}>
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ background: 'rgba(249,115,22,0.08)' }}>
                <div className="text-orange-400">Field</div><div className="text-slate-500">CMS</div><div className="text-emerald-400">MongoDB</div>
              </div>
              <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                {Object.entries(user.conflict_data).map(([field, vals]) => (
                  <div key={field} className="grid grid-cols-3 gap-4 px-4 py-2.5">
                    <div className="text-slate-500 text-xs capitalize">{field.replace(/_/g, ' ')}</div>
                    <div className="text-white font-mono text-xs">{String(vals.cms ?? '—')}</div>
                    <div className="text-emerald-400 font-mono text-xs">{String(vals.mongo ?? '—')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {isRemoved ? (
          <>
            <button onClick={() => resolve('keep_cms')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25">
              <HiOutlineCheck className="w-4 h-4" /> Keep — Renamed / Moved
            </button>
            <button onClick={() => setArchiveModal(true)} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25">
              <HiOutlineArchive className="w-4 h-4" /> Archive to History
            </button>
          </>
        ) : (
          <>
            <button onClick={() => resolve('keep_cms')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25">
              <HiOutlineCheck className="w-4 h-4" /> Keep CMS version
            </button>
            <button onClick={() => resolve('accept_mongo')} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[#0e1420] font-semibold"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
              <HiOutlineArrowRight className="w-4 h-4" /> Accept MongoDB version
            </button>
            <button onClick={() => setArchiveModal(true)} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20 hover:bg-slate-500/25">
              <HiOutlineArchive className="w-4 h-4" /> Archive
            </button>
          </>
        )}
      </div>

      {archiveModal && (
        <ArchiveModal
          title={`${user.name} — ${user.email}`}
          description={`Archive "${user.name}" from active DAT users.${user.assigned_customer_name ? ` Currently assigned to customer: ${user.assigned_customer_name}.` : ''}`}
          onArchive={archiveUser}
          onClose={() => setArchiveModal(false)}
        />
      )}
    </div>
  )
}

// ── Resolved History record card ──────────────────────────────────────────────
const RESOLUTION_LABELS = {
  accept_mongo: { label: 'MongoDB Applied', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  mark_removed: { label: 'Confirmed Deleted', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  mark_deleted: { label: 'Confirmed Deleted', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  keep_cms:     { label: 'CMS Kept', color: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
}

function ResolvedRecordCard({ record }) {
  const [expanded, setExpanded] = useState(false)
  const isAccount   = record.record_type === 'dat_account'
  const typeColor   = isAccount ? 'text-[#f97316]' : 'text-purple-400'
  const typeBg      = isAccount ? 'rgba(75,191,191,0.1)' : 'rgba(139,92,246,0.1)'
  const typeBorder  = isAccount ? 'rgba(75,191,191,0.2)' : 'rgba(139,92,246,0.2)'
  const seats       = record.seat_pricing || []
  const revenue     = record.total_monthly_revenue || { amount: 0, currency: 'PKR' }
  const resolution  = RESOLUTION_LABELS[record.resolution_action] || { label: record.resolution_action || 'Resolved', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }

  return (
    <div className="glass-light rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(16,185,129,0.15)' }}>
      {/* Main card */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: typeBg, border: `1px solid ${typeBorder}` }}>
            {isAccount
              ? <HiOutlineDatabase className={`w-4 h-4 ${typeColor}`} />
              : <HiOutlineUser className={`w-4 h-4 ${typeColor}`} />}
          </div>
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-white font-semibold text-sm">{record.record_name}</span>
              {record.record_email && <span className="text-slate-400 text-xs">{record.record_email}</span>}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${resolution.color}`}>
                {resolution.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: typeBg, color: isAccount ? '#f97316' : '#a78bfa' }}>
                {isAccount ? 'DAT Account' : 'DAT User'}
              </span>
            </div>

            {/* DAT account & customer */}
            <div className="flex flex-wrap gap-2 mb-2">
              {record.dat_account_name && !isAccount && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-white/5 text-slate-400">
                  <HiOutlineDatabase className="w-3 h-3" /> {record.dat_account_name}
                </span>
              )}
              {record.customer_name && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs"
                  style={{ background: 'rgba(75,191,191,0.08)', border: '1px solid rgba(75,191,191,0.15)' }}>
                  <HiOutlineUser className="w-3 h-3 text-[#f97316]" />
                  <span className="text-slate-400">Was assigned to:</span>
                  <span className="text-[#f97316] font-semibold">{record.customer_name}</span>
                </span>
              )}
            </div>

            {/* Revenue summary */}
            {revenue.amount > 0 && (
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <span className="text-slate-400">Monthly Revenue Lost: </span>
                  <span className="text-emerald-400 font-bold">{revenue.currency} {parseFloat(revenue.amount).toLocaleString()}</span>
                  {seats.length > 0 && <span className="text-slate-500 ml-1">({seats.length} seat{seats.length > 1 ? 's' : ''})</span>}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/15">
                {REMOVAL_REASON_LABELS[record.removal_reason] || record.removal_reason}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <HiOutlineCalendar className="w-3 h-3" />
                {new Date(record.resolved_at).toLocaleDateString()} {new Date(record.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {record.resolved_by_name && (
                <span className="flex items-center gap-1 text-slate-500">
                  <HiOutlineUser className="w-3 h-3" /> by {record.resolved_by_name}
                </span>
              )}
            </div>

            {record.removal_notes && !record.removal_notes.startsWith('Auto-recorded') && (
              <div className="text-slate-500 text-xs mt-1.5 italic">"{record.removal_notes}"</div>
            )}

            {/* Expand toggle */}
            {(seats.length > 0 || record.original_data) && (
              <button onClick={() => setExpanded(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
                {expanded ? <HiOutlineChevronUp className="w-3 h-3" /> : <HiOutlineChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide details' : `View details${seats.length > 0 ? ` (${seats.length} seat${seats.length > 1 ? 's' : ''})` : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: seat pricing table + raw snapshot */}
      {expanded && (
        <div className="border-t border-white/5">
          {/* Seat pricing */}
          {seats.length > 0 && (
            <div className="p-4 pt-3">
              <div className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-widest">Customer Seat Pricing at Removal</div>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid gap-0">
                  <div className="grid grid-cols-4 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div>Customer</div><div>Monthly Price</div><div>Expiry</div><div>Status</div>
                  </div>
                  {seats.map((s, i) => (
                    <div key={i} className="grid grid-cols-4 px-3 py-2.5 text-xs border-t border-white/5">
                      <div>
                        <div className="text-white font-medium">{s.customer}</div>
                        <div className="text-slate-500">{s.customer_email}</div>
                      </div>
                      <div className="text-emerald-400 font-bold self-center">
                        {s.currency} {parseFloat(s.monthly_price || 0).toLocaleString()}
                      </div>
                      <div className="text-slate-400 self-center">{s.expiry_date || '—'}</div>
                      <div className="self-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-500'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Raw snapshot */}
          {record.original_data && (
            <div className="px-4 pb-4">
              <div className="text-slate-500 text-xs font-semibold mb-1.5 uppercase tracking-widest">Full Data Snapshot</div>
              <div className="p-3 rounded-xl text-xs font-mono text-slate-400 overflow-auto max-h-48"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <pre className="whitespace-pre-wrap">{JSON.stringify(record.original_data, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ConflictsPage({ user }) {
  const [accounts, setAccounts]   = useState([])
  const [users, setUsers]         = useState([])
  const [resolved, setResolved]   = useState([])
  const [diagnosis, setDiagnosis] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [resolvedLoading, setResolvedLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [diagLoading, setDiagLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch]       = useState('')
  const [resolvedSearch, setResolvedSearch]   = useState('')
  const [resolvedFilter, setResolvedFilter]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [accRes, userRes] = await Promise.all([
        api.get('/store/dat-accounts/?page_size=1000&sync_status=conflict,removed').catch(() => ({ data: { results: [] } })),
        api.get('/store/mongo-users/?page_size=1000&sync_status=conflict,removed').catch(() => ({ data: { results: [] } })),
      ])
      let listAccounts = [], listUsers = []
      try {
        const lr = await api.get('/store/conflicts/list_conflicts/')
        listAccounts = lr.data?.dat_accounts || []
        listUsers    = lr.data?.mongo_users  || []
      } catch {}
      const accsV  = Array.isArray(accRes.data)  ? accRes.data  : accRes.data.results  || []
      const usersV = Array.isArray(userRes.data) ? userRes.data : userRes.data.results || []
      const accMap = new Map(); [...accsV, ...listAccounts].forEach(a => { if (a.id) accMap.set(a.id, a) })
      const usrMap = new Map(); [...usersV, ...listUsers].forEach(u => { if (u.id) usrMap.set(u.id, u) })
      setAccounts([...accMap.values()].filter(a => a.sync_status === 'conflict' || a.sync_status === 'removed'))
      setUsers([...usrMap.values()].filter(u => u.sync_status === 'conflict' || u.sync_status === 'removed'))
    } catch (e) { toast.error('Failed to load conflicts') }
    finally { setLoading(false); setHasLoaded(true) }
  }, [])

  const loadResolved = useCallback(async () => {
    setResolvedLoading(true)
    try {
      const params = resolvedFilter ? `?record_type=${resolvedFilter}&page_size=200` : '?page_size=200'
      const res = await api.get('/store/removed-records/' + params)
      setResolved(Array.isArray(res.data) ? res.data : res.data.results || [])
    } catch { toast.error('Failed to load resolved history') }
    finally { setResolvedLoading(false) }
  }, [resolvedFilter])

  const runDiagnosis = async () => {
    setDiagLoading(true)
    try { const { data } = await api.get('/store/sync/diagnose/'); setDiagnosis(data) }
    catch (e) { toast.error(e.response?.data?.error || 'Diagnosis failed') }
    finally { setDiagLoading(false) }
  }

  useEffect(() => { load() }, [load])
  useEffect(() => { if (activeTab === 'resolved') loadResolved() }, [activeTab, loadResolved])

  const filteredAccounts = accounts.filter(a => !search || a.name?.toLowerCase().includes(search.toLowerCase()))
  const filteredUsers    = users.filter(u => !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()))
  const filteredResolved = resolved.filter(r => {
    if (!resolvedSearch) return true
    const q = resolvedSearch.toLowerCase()
    return r.record_name?.toLowerCase().includes(q) || r.record_email?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q) || r.dat_account_name?.toLowerCase().includes(q)
  })

  const removedAccounts  = accounts.filter(a => a.sync_status === 'removed')
  const conflictAccounts = accounts.filter(a => a.sync_status === 'conflict')
  const removedUsers     = users.filter(u => u.sync_status === 'removed')
  const conflictUsers    = users.filter(u => u.sync_status === 'conflict')
  const totalIssues      = accounts.length + users.length

  const TABS = [
    { id: 'all',              label: 'All Issues',       count: totalIssues,                                   alert: true },
    { id: 'removed_accounts', label: 'Removed Accounts', count: removedAccounts.length,                        alert: true },
    { id: 'removed_users',    label: 'Removed Users',    count: removedUsers.length,                           alert: true },
    { id: 'conflicts',        label: 'Data Conflicts',   count: conflictAccounts.length + conflictUsers.length, alert: true },
    { id: 'resolved',         label: 'Resolved History', count: resolved.length,                               alert: false },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Sync Conflicts & Removals</h1>
          <p className="text-slate-500 text-sm mt-1">Records needing attention — plus full resolved history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
            <HiOutlineRefresh className="w-5 h-5" />
          </button>
          <button onClick={runDiagnosis} disabled={diagLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(75,191,191,0.15)', border: '1px solid rgba(75,191,191,0.3)', color: '#f97316' }}>
            <HiOutlineInformationCircle className={'w-4 h-4 ' + (diagLoading ? 'animate-spin' : '')} />
            {diagLoading ? 'Diagnosing…' : 'Run Diagnosis'}
          </button>
        </div>
      </div>

      {/* All in sync */}
      {totalIssues === 0 && !loading && hasLoaded && activeTab !== 'resolved' && (
        <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <HiOutlineCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <div className="text-emerald-300 font-semibold">All data is in sync</div>
          <div className="text-slate-500 text-sm mt-1">No open conflicts or removals — check Resolved History for past actions</div>
        </div>
      )}

      {/* Summary stats */}
      {totalIssues > 0 && activeTab !== 'resolved' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Removed Accounts', value: removedAccounts.length,  color: 'text-red-400',    bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
            { label: 'Removed Users',    value: removedUsers.length,     color: 'text-red-400',    bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
            { label: 'Account Conflicts',value: conflictAccounts.length, color: 'text-orange-400', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
            { label: 'User Conflicts',   value: conflictUsers.length,    color: 'text-orange-400', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className={'text-2xl font-bold ' + s.color}>{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Diagnosis panel */}
      {diagnosis && (
        <div className="glass-light rounded-2xl p-5" style={{ border: '1px solid rgba(75,191,191,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">MongoDB Diagnosis Report</h3>
            <button onClick={() => setDiagnosis(null)} className="text-slate-500 hover:text-white"><HiOutlineX className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'MongoDB Users', value: diagnosis.collection_counts?.users || 0, color: 'text-[#f97316]' },
              { label: 'MongoDB Permissions', value: diagnosis.collection_counts?.permissions || 0, color: 'text-purple-400' },
              { label: 'Users WITH Permission', value: diagnosis.user_perm_match?.users_with_perm || 0, color: 'text-emerald-400' },
              { label: 'Users WITHOUT Permission', value: diagnosis.user_perm_match?.users_without_perm || 0, color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className={'text-2xl font-bold ' + s.color}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-slate-400 mb-2 font-semibold">CMS Status</div>
              <div className="space-y-1">
                {[['Total in CMS', diagnosis.cms_counts?.total_in_cms || 0, 'text-white'],
                  ['Active', diagnosis.cms_counts?.active_in_cms || 0, 'text-emerald-400'],
                  ['Marked Removed', diagnosis.cms_counts?.removed_in_cms || 0, 'text-red-400'],
                  ['Not yet imported', diagnosis.cms_counts?.mongo_users_not_in_cms || 0, 'text-orange-400'],
                ].map(([l,v,c]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-slate-500">{l}</span><span className={c}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {diagnosis.sample_user && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-slate-400 mb-2 font-semibold">Sample MongoDB User</div>
                <div className="text-white">{diagnosis.sample_user.name}</div>
                <div className="text-slate-500">{diagnosis.sample_user.email}</div>
                <div className="text-slate-600 text-[10px] mt-1">Fields: {diagnosis.sample_user.fields?.join(', ')}</div>
              </div>
            )}
            {diagnosis.sample_permission && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-slate-400 mb-2 font-semibold">Sample Permission</div>
                <div className="text-slate-500">userId type: <span className="text-orange-400">{diagnosis.sample_permission.userId_raw_type}</span></div>
                <div className="text-slate-500">dataSessionId: <span className="text-white font-mono">{diagnosis.sample_permission.dataSessionId?.slice(0,20) || '—'}</span></div>
              </div>
            )}
          </div>
          {(diagnosis.cms_counts?.mongo_users_not_in_cms || 0) > 0 && (
            <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <span className="text-orange-300 font-semibold">⚠ {diagnosis.cms_counts.mongo_users_not_in_cms} MongoDB users not in CMS yet.</span>
              <span className="text-slate-400 ml-2">Run "Import from MongoDB" to sync them.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ' +
              (activeTab === t.id
                ? t.id === 'resolved' ? 'text-emerald-400' : 'text-[#f97316]'
                : 'text-slate-400 hover:text-white border border-white/10')}
            style={activeTab === t.id ? {
              background: t.id === 'resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(75,191,191,0.12)',
              border: `1px solid ${t.id === 'resolved' ? 'rgba(16,185,129,0.3)' : 'rgba(75,191,191,0.2)'}`
            } : {}}>
            {t.id === 'resolved' && <HiOutlineClipboardCheck className="w-4 h-4" />}
            {t.label}
            {t.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${t.alert ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── RESOLVED HISTORY content ── */}
      {activeTab === 'resolved' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={resolvedSearch} onChange={e => setResolvedSearch(e.target.value)}
                placeholder="Search name, email, customer…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50" />
            </div>
            <select value={resolvedFilter} onChange={e => setResolvedFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm">
              <option value="" className="bg-[#0e1420]">All Types</option>
              <option value="dat_account" className="bg-[#0e1420]">DAT Accounts</option>
              <option value="dat_user" className="bg-[#0e1420]">DAT Users</option>
            </select>
            <button onClick={loadResolved}
              className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white">
              <HiOutlineRefresh className={`w-4 h-4 ${resolvedLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {resolvedLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
            </div>
          ) : filteredResolved.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <HiOutlineClipboardCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <div className="text-slate-400 font-medium">No resolved records yet</div>
              <div className="text-slate-600 text-sm mt-1">Archived conflicts will appear here with full details and customer assignment history</div>
            </div>
          ) : (
            <>
              <div className="text-slate-500 text-xs">{filteredResolved.length} resolved record{filteredResolved.length !== 1 ? 's' : ''}</div>
              <div className="space-y-3">
                {filteredResolved.map(r => <ResolvedRecordCard key={r.id} record={r} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── OPEN CONFLICTS content ── */}
      {activeTab !== 'resolved' && (
        <>
          {(totalIssues > 0 || search) && (
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50" />
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }} />
            </div>
          ) : (
            <div className="space-y-4">
              {(activeTab === 'all' || activeTab === 'removed_accounts' || activeTab === 'conflicts') && filteredAccounts.length > 0 && (
                <div>
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <HiOutlineDatabase className="w-4 h-4" />
                    DAT Accounts ({filteredAccounts.filter(a =>
                      activeTab === 'removed_accounts' ? a.sync_status === 'removed'
                      : activeTab === 'conflicts' ? a.sync_status === 'conflict' : true).length})
                  </h3>
                  <div className="space-y-3">
                    {filteredAccounts
                      .filter(a => activeTab === 'removed_accounts' ? a.sync_status === 'removed' : activeTab === 'conflicts' ? a.sync_status === 'conflict' : true)
                      .map(a => <DATAccountConflict key={a.id} account={a} onResolved={load} />)}
                  </div>
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'removed_users' || activeTab === 'conflicts') && filteredUsers.length > 0 && (
                <div>
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <HiOutlineUsers className="w-4 h-4" />
                    DAT Users ({filteredUsers.filter(u =>
                      activeTab === 'removed_users' ? u.sync_status === 'removed'
                      : activeTab === 'conflicts' ? u.sync_status === 'conflict' : true).length})
                  </h3>
                  <div className="space-y-3">
                    {filteredUsers
                      .filter(u => activeTab === 'removed_users' ? u.sync_status === 'removed' : activeTab === 'conflicts' ? u.sync_status === 'conflict' : true)
                      .map(u => <MongoUserConflict key={u.id} user={u} onResolved={load} />)}
                  </div>
                </div>
              )}

              {filteredAccounts.length === 0 && filteredUsers.length === 0 && totalIssues > 0 && (
                <div className="text-center py-8 text-slate-500">No issues matching your search</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
