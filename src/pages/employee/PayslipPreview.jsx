// ─────────────────────────────────────────────────────────────────────────────
// PayslipPreview — official Bitnex letterhead payslip used for both on-screen
// preview and print/PDF download. Uses the same print CSS hooks as the docs
// module (#print-root + .printing-letter + @media print).
//
// Robust to missing structures: if `structure` is absent or empty, the preview
// falls back to the slip's pre-computed `gross_salary` and `base_net` so the
// payslip never renders as all-zeroes.
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmtPKR  = (n) => 'PKR ' + Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
const num     = (v) => Number(v || 0)

export default function PayslipPreview({ slip, structure, employee, printable = false }) {
  // ── Per-line breakdown from structure (preferred) ───────────────────────
  const basic     = num(structure?.basic_salary)
  const house     = num(structure?.house_allowance)
  const transport = num(structure?.transport_allowance)
  const medical   = num(structure?.medical_allowance)
  const otherAll  = num(structure?.other_allowances)
  const tax       = num(structure?.tax_deduction)
  const pf        = num(structure?.provident_fund)
  const otherDed  = num(structure?.other_deductions)

  const bonus     = num(slip.bonus)
  const extra     = num(slip.extra_payment)
  const penalty   = num(slip.penalty_deduction)
  const leaveDed  = num(slip.leave_deduction)

  // ── Detect "no structure data" and fall back to slip-level totals ───────
  // The Salary_serializer already exposes `gross_salary` (from structure)
  // and `base_net` (net of the structure) on every slip — use them as the
  // canonical earnings/deductions figures when individual components are
  // unknown to this user (employees can't always read other employees'
  // structures, but their own slip serializer always has these totals).
  const structComponents = basic + house + transport + medical + otherAll
  const structDeductions = tax + pf + otherDed
  const haveStructure    = structComponents > 0 || structDeductions > 0

  const slipGross        = num(slip.gross_salary)        // base structure earnings
  const slipBaseNet      = num(slip.base_net)            // base structure net (gross - structure deductions)
  const slipBaseDeducts  = Math.max(0, slipGross - slipBaseNet)

  const baseEarnings   = haveStructure ? structComponents : slipGross
  const baseDeductions = haveStructure ? structDeductions : slipBaseDeducts

  const grossEarnings = baseEarnings + bonus + extra
  const totalDed      = baseDeductions + penalty + leaveDed
  const net           = grossEarnings - totalDed

  const ref = `BTX/PS/${String(employee?.id || 0).padStart(4,'0')}/${slip.year}-${String(slip.month).padStart(2,'0')}`
  const remarkLines = (slip.remarks || '').split('\n').filter(Boolean)

  return (
    <div className={printable ? 'letter-print' : 'letter-screen'}
      style={{
        background: '#ffffff', color: '#1a1a1a',
        fontFamily: '"Times New Roman", Georgia, serif',
        padding: '40px 50px', minHeight: printable ? '100%' : 'auto',
        maxWidth: printable ? 'none' : 800, margin: '0 auto',
        boxShadow: printable ? 'none' : '0 8px 32px rgba(0,0,0,0.4)',
        borderRadius: printable ? 0 : 4, position: 'relative',
      }}>
      {/* Letterhead */}
      <div style={{
        borderBottom: '3px solid #f97316', paddingBottom: 16, marginBottom: 22,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 700, color: '#0d0f14' }}>
            BITNEX <span style={{ color: '#f97316' }}>TECHNOLOGIES</span>
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 3, letterSpacing: '1.2px' }}>
            PAYSLIP
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#555', lineHeight: 1.5 }}>
          Ref: {ref}<br/>
          Generated: {fmtDate(new Date())}
        </div>
      </div>

      {/* Title */}
      <h1 style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, letterSpacing: 2,
                   margin: '6px 0 18px', textTransform: 'uppercase' }}>
        Payslip for {MONTHS[slip.month - 1]} {slip.year}
      </h1>

      {/* Employee summary */}
      <table style={{ width: '100%', fontSize: 12, marginBottom: 18, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={cellLabel}>Employee Name</td>
            <td style={cellVal}>{slip.employee_name || employee?.full_name}</td>
            <td style={cellLabel}>Employee ID</td>
            <td style={cellVal}>BTX-{String(employee?.id || slip.employee || 0).padStart(4,'0')}</td>
          </tr>
          <tr>
            <td style={cellLabel}>Department</td>
            <td style={cellVal}>{slip.employee_department || '—'}</td>
            <td style={cellLabel}>Designation</td>
            <td style={cellVal}>{slip.employee_designation || '—'}</td>
          </tr>
          <tr>
            <td style={cellLabel}>Status</td>
            <td style={cellVal}>
              <span style={{ textTransform: 'capitalize' }}>{(slip.status || '').replace(/_/g, ' ')}</span>
            </td>
            <td style={cellLabel}>Paid Date</td>
            <td style={cellVal}>{fmtDate(slip.paid_date)}</td>
          </tr>
        </tbody>
      </table>

      {/* Two-column earnings + deductions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Section title="Earnings">
          {haveStructure ? (
            <>
              <Line label="Basic Salary"        value={basic}     hide={!basic}/>
              <Line label="House Allowance"     value={house}     hide={!house}/>
              <Line label="Transport Allowance" value={transport} hide={!transport}/>
              <Line label="Medical Allowance"   value={medical}   hide={!medical}/>
              <Line label="Other Allowances"    value={otherAll}  hide={!otherAll}/>
            </>
          ) : (
            // Fallback: show a single "Base Salary" line aggregating the structure.
            <Line label="Base Salary" value={baseEarnings}/>
          )}
          {bonus > 0 && <Line label="Bonus" value={bonus} highlight/>}
          {extra > 0 && (
            <Line
              label="Additional Payment / Reimbursement"
              value={extra}
              highlight
              note="Includes approved reimbursement claims"
            />
          )}
          <Total label="Gross Earnings" value={grossEarnings}/>
        </Section>

        <Section title="Deductions">
          {haveStructure ? (
            <>
              <Line label="Income Tax"        value={tax}       hide={!tax}/>
              <Line label="Provident Fund"    value={pf}        hide={!pf}/>
              <Line label="Other Deductions"  value={otherDed}  hide={!otherDed}/>
            </>
          ) : baseDeductions > 0 ? (
            <Line label="Standard Deductions" value={baseDeductions}/>
          ) : null}
          {penalty > 0 && <Line label="Penalty" value={penalty} negative/>}
          {leaveDed > 0 && <Line label="Unpaid Leave" value={leaveDed} negative
                            note={slip.unpaid_leave_days ? `${slip.unpaid_leave_days} day(s)` : null}/>}
          {totalDed === 0 && (
            <div style={{ fontSize: 12, color: '#888', padding: '4px 0', fontStyle: 'italic' }}>
              No deductions this period
            </div>
          )}
          <Total label="Total Deductions" value={totalDed} negative/>
        </Section>
      </div>

      {/* Net payable banner */}
      <div style={{
        background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff',
        padding: '14px 20px', borderRadius: 8, marginBottom: 18,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.9 }}>
          Net Payable
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{fmtPKR(net)}</div>
      </div>

      {/* Remarks (reimbursements highlighted) */}
      {remarkLines.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 6px',
                       borderBottom: '1px solid #ddd', paddingBottom: 4 }}>
            Remarks & Adjustments
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#333', lineHeight: 1.7 }}>
            {remarkLines.map((line, i) => {
              const isReimb = /reimbursement/i.test(line)
              return (
                <li key={i} style={{
                  background: isReimb ? '#fff7ed' : 'transparent',
                  padding: isReimb ? '4px 8px' : '0',
                  borderRadius: isReimb ? 4 : 0,
                  marginBottom: isReimb ? 4 : 0,
                  fontWeight: isReimb ? 600 : 400,
                  color: isReimb ? '#9a3412' : '#333',
                  listStyle: isReimb ? 'none' : 'disc',
                }}>{line}</li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 30, fontSize: 10, color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
        This is a computer-generated payslip and does not require a signature.
      </div>
      <div style={{ position: printable ? 'absolute' : 'static', bottom: 20, left: 50, right: 50,
                    borderTop: '1px solid #ddd', paddingTop: 8, marginTop: printable ? 0 : 14,
                    fontSize: 9, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
        <span>Bitnex Technologies · Lahore, Pakistan</span>
        <span>info@bitnex.tech</span>
      </div>
    </div>
  )
}

// ── Tiny visual primitives ──────────────────────────────────────────────────
const cellLabel = { fontSize: 11, color: '#666', padding: '4px 8px 4px 0', width: '20%', verticalAlign: 'top' }
const cellVal   = { fontSize: 12, color: '#1a1a1a', padding: '4px 12px 4px 0', fontWeight: 500 }

function Section({ title, children }) {
  return (
    <div style={{ border: '1px solid #e5e5e5', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{
        background: '#fff7ed', borderBottom: '1.5px solid #f97316',
        padding: '8px 12px', fontSize: 12, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1, color: '#9a3412',
      }}>{title}</div>
      <div style={{ padding: '8px 12px' }}>{children}</div>
    </div>
  )
}

function Line({ label, value, hide, highlight, negative, note }) {
  if (hide) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '5px 0', fontSize: 12, borderBottom: '1px dashed #f0f0f0',
      color: highlight ? '#9a3412' : '#1a1a1a',
      fontWeight: highlight ? 600 : 400,
    }}>
      <span>
        {label}
        {note && <span style={{ fontSize: 10, color: '#888', marginLeft: 6, fontStyle: 'italic' }}>· {note}</span>}
      </span>
      <span>{negative ? '−' : ''}{fmtPKR(value)}</span>
    </div>
  )
}

function Total({ label, value, negative }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 0 4px', fontSize: 13, fontWeight: 700,
      borderTop: '2px solid #333', marginTop: 6,
    }}>
      <span>{label}</span>
      <span>{negative ? '−' : ''}{fmtPKR(value)}</span>
    </div>
  )
}
