// ─────────────────────────────────────────────────────────────────────────────
// OnboardingFormPrint — Bitnex EMPLOYEE INFORMATION FORM (printable).
//
// Mirrors the official paper form exactly:
//   • 4-column layout: column 1 = LABEL, column 2 = VALUE,
//                       column 3 = LABEL, column 4 = VALUE
//   • Title is gender-aware (MALE / FEMALE)
//   • Sections: Personal · Contact · Husband (female+married) · Banking
//     (Employment is HR-managed, not collected from the employee)
//   • Declaration + Employee Signature + Thumb Impression + HR Approval
//   • Identity Verification image strip (CNIC front/back + selfie)
//   • Legal Disclaimer
//
// Used by the existing pdfGenerator (header + body slice + footer per page).
// ─────────────────────────────────────────────────────────────────────────────

const BRAND = '#44BDB2'

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

// Visual constants matching the real form
const BORDER       = '1px solid #475569'
const HEADER_BG    = '#475569'
const ROW_HEIGHT   = 42  // px — keeps each row a comfortable size
const LABEL_COLOR  = '#0f172a'
const VALUE_COLOR  = '#1f2937'

// ─── Cell primitives ──────────────────────────────────────────────────────
// A "LabelCell" holds only the field label (uppercase, small, bold, dark).
// A "ValueCell" holds only the value (regular weight, larger).
// Each row is built as <Lc><Vc><Lc><Vc> in a 4-column grid.

function LabelCell({ children, w = '25%' }) {
  return (
    <td style={{
      border: BORDER,
      padding: '8px 10px 2px 10px',
      verticalAlign: 'top',
      fontSize: 10.5,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: LABEL_COLOR,
      width: w,
      background: '#f8fafc',
    }}>{children}</td>
  )
}

function ValueCell({ children, w = '25%' }) {
  return (
    <td style={{
      border: BORDER,
      padding: '8px 10px',
      verticalAlign: 'middle',
      fontSize: 11.5,
      color: VALUE_COLOR,
      width: w,
      minHeight: ROW_HEIGHT,
    }}>{children || '\u00A0'}</td>
  )
}

// Section banner spans all 4 cells
function SectionBanner({ children }) {
  return (
    <tr>
      <td colSpan={4} style={{
        background: HEADER_BG,
        color: '#ffffff',
        padding: '7px 12px',
        fontSize: 11.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        border: BORDER,
      }}>{children}</td>
    </tr>
  )
}

// One row with two label/value pairs
function PairRow({ l1, v1, l2, v2 }) {
  return (
    <tr>
      <LabelCell>{l1}</LabelCell>
      <ValueCell>{v1}</ValueCell>
      <LabelCell>{l2}</LabelCell>
      <ValueCell>{v2}</ValueCell>
    </tr>
  )
}

// Marital Status row spans columns 3+4 with checkbox-style choices
function MaritalStatusRow({ gender, marital }) {
  const opts = [
    ['single',   'Single'],
    ['married',  'Married'],
    ['divorced', 'Divorced'],
    ['widowed',  'Widowed'],
  ]
  return (
    <tr>
      <LabelCell>Gender</LabelCell>
      <ValueCell>{(gender || '').toUpperCase()}</ValueCell>
      <LabelCell>Marital Status</LabelCell>
      <td style={{ border: BORDER, padding: '8px 10px', verticalAlign: 'middle',
                   fontSize: 11.5, color: VALUE_COLOR, width: '25%' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {opts.map(([v, l]) => {
            const checked = marital === v
            return (
              <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 11, height: 11, display: 'inline-block',
                  border: '1.5px solid #1f2937',
                  background: checked ? '#1f2937' : 'transparent',
                }}/>
                <span style={{ fontSize: 11 }}>{l}</span>
              </span>
            )
          })}
        </div>
      </td>
    </tr>
  )
}

// Address rows are full-width (4-col span)
function FullWidthRow({ label, children }) {
  return (
    <>
      <tr>
        <td colSpan={4} style={{
          border: BORDER, padding: '8px 10px 2px 10px',
          fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 0.4, color: LABEL_COLOR, background: '#f8fafc',
        }}>{label}</td>
      </tr>
      <tr>
        <td colSpan={4} style={{
          border: BORDER, padding: '6px 10px 10px 10px',
          fontSize: 11.5, color: VALUE_COLOR, whiteSpace: 'pre-wrap',
          minHeight: ROW_HEIGHT,
        }}>{children || '\u00A0'}</td>
      </tr>
    </>
  )
}

// ─── Main printable component ─────────────────────────────────────────────
export default function OnboardingFormPrint({ form = {}, stampUrl = '' }) {
  const isFemale  = form.gender === 'female'
  const isMarried = form.marital_status === 'married'
  const showSpouse = isFemale && isMarried

  return (
    <div style={{
      width: 794,
      padding: '36px 56px 24px',
      background: '#ffffff',
      color: '#111827',
      fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {/* Title */}
      <h1 style={{ textAlign: 'center', margin: '6px 0 18px',
                   fontSize: 18, fontWeight: 700,
                   color: '#1f2937', letterSpacing: 0.5,
                   fontFamily: '"Times New Roman", Georgia, serif' }}>
        EMPLOYEE INFORMATION FORM ({(form.gender || 'male').toUpperCase()})
      </h1>

      {/* PERSONAL */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12,
                      tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
          <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
        </colgroup>
        <tbody>
          <SectionBanner>Personal Information</SectionBanner>
          <PairRow l1="Full Name"   v1={form.full_name}
                   l2="Father's Name" v2={form.father_name}/>
          <PairRow l1="CNIC"        v1={form.cnic_number}
                   l2="Date of Birth" v2={fmtDate(form.date_of_birth)}/>
          <MaritalStatusRow gender={form.gender} marital={form.marital_status}/>
        </tbody>
      </table>

      {/* CONTACT */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12,
                      tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
          <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
        </colgroup>
        <tbody>
          <SectionBanner>Contact Information</SectionBanner>
          <PairRow l1="Personal Number"  v1={form.personal_number}
                   l2="Father's Number"  v2={form.father_number}/>
          <PairRow l1="Emergency Number" v1={form.emergency_number}
                   l2="Email"            v2={form.personal_email}/>
          <FullWidthRow label="Address">
            {form.address}{form.city ? `, ${form.city}` : ''}
          </FullWidthRow>
        </tbody>
      </table>

      {/* HUSBAND (female + married only) */}
      {showSpouse && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12,
                        tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
            <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
          </colgroup>
          <tbody>
            <SectionBanner>If Married (Husband Details)</SectionBanner>
            <PairRow l1="Husband Name"   v1={form.husband_name}
                     l2="Profession"     v2={form.husband_profession}/>
            <tr>
              <LabelCell>Contact Number</LabelCell>
              <ValueCell>{form.husband_number}</ValueCell>
              <td style={{ border: BORDER }}/>
              <td style={{ border: BORDER }}/>
            </tr>
          </tbody>
        </table>
      )}

      {/* EMPLOYMENT — HR-managed, shown only if HR has filled it */}
      {(form.position || form.department || form.joining_date) && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12,
                        tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
            <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
          </colgroup>
          <tbody>
            <SectionBanner>Employment Details</SectionBanner>
            <PairRow l1="Position"   v1={form.position}
                     l2="Department" v2={form.department}/>
            <PairRow l1="Date of Training (unpaid)" v1={form.date_of_training}
                     l2="Joining / Payroll Date"    v2={fmtDate(form.joining_date)}/>
          </tbody>
        </table>
      )}

      {/* BANKING */}
      {(form.bank_name || form.iban || form.account_title || form.account_number) && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12,
                        tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
            <col style={{ width: '22%' }}/><col style={{ width: '28%' }}/>
          </colgroup>
          <tbody>
            <SectionBanner>Banking (Salary Disbursement)</SectionBanner>
            <PairRow l1="Bank Name" v1={form.bank_name}
                     l2="Branch"    v2={form.bank_branch}/>
            <PairRow l1="Account Title"  v1={form.account_title}
                     l2="Account Number" v2={form.account_number}/>
            <tr>
              <LabelCell>IBAN</LabelCell>
              <ValueCell>{form.iban}</ValueCell>
              <td style={{ border: BORDER }}/>
              <td style={{ border: BORDER }}/>
            </tr>
          </tbody>
        </table>
      )}

      {/* Declaration */}
      <div style={{ marginTop: 16, fontSize: 11.5, lineHeight: 1.65,
                    color: '#1f2937', textAlign: 'justify' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>DECLARATION:</div>
        I hereby declare that the above information is true and correct. Any false information may lead
        to disciplinary action or termination of my employment with Bitnex Technologies.
      </div>

      {/* Thumb impression + HR approval (employee signature removed per spec) */}
      <div style={{ marginTop: 22, display: 'flex',
                    justifyContent: 'space-between', alignItems: 'flex-end',
                    gap: 24 }}>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        marginBottom: 6 }}>
            Thumb Impression
          </div>
          <div style={{
            width: 70, height: 70,
            border: '1.5px dashed #6b7280', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: '#9ca3af',
          }}>—</div>
        </div>

        <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: 0.5,
                        marginBottom: 6 }}>HR Approval</div>
          {stampUrl
            ? <img src={stampUrl} alt="Stamp" crossOrigin="anonymous"
                   style={{ maxHeight: 80, maxWidth: 160, objectFit: 'contain',
                            marginLeft: 'auto', display: 'block' }}/>
            : <div style={{ height: 50, borderBottom: '1px solid #1f2937',
                            marginLeft: 'auto', maxWidth: 160 }}/>}
          <div style={{ marginTop: 4, fontSize: 11 }}>
            {form.approved_by_name || ''}
          </div>
          {form.approved_at && (
            <div style={{ fontSize: 10, color: '#6b7280' }}>
              Approved {fmtDate(form.approved_at)}
            </div>
          )}
        </div>
      </div>

      {/* CNIC + Selfie image strip */}
      {(form.cnic_front_url || form.cnic_back_url || form.selfie_url) && (
        <div style={{ marginTop: 26 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 0.5, color: BRAND, marginBottom: 8,
          }}>Identity Verification (Attached)</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between',
                        flexWrap: 'wrap' }}>
            {[
              ['cnic_front_url', 'CNIC – Front'],
              ['cnic_back_url',  'CNIC – Back'],
              ['selfie_url',     'Selfie'],
            ].map(([k, l]) => (
              <div key={k} style={{
                flex: '1 1 30%',
                minWidth: 140,
                border: BORDER,
                padding: 6,
              }}>
                <div style={{
                  fontSize: 9.5, color: '#1f2937', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.4,
                  marginBottom: 4,
                }}>{l}</div>
                {form[k]
                  ? <img src={form[k]} alt={l} crossOrigin="anonymous"
                         style={{ width: '100%', maxHeight: 110,
                                  objectFit: 'contain', display: 'block' }}/>
                  : <div style={{
                      height: 80, background: '#f3f4f6',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10, color: '#9ca3af',
                    }}>not uploaded</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal disclaimer */}
      <div style={{
        marginTop: 18,
        padding: '10px 12px',
        fontSize: 10, lineHeight: 1.5, color: '#475569',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
      }}>
        <span style={{ fontWeight: 700, color: '#1f2937' }}>NOTE / LEGAL DISCLAIMER:</span>{' '}
        This document is an official record of Bitnex Technologies. The provided information may be used
        for administrative and legal purposes including payroll, taxation, attendance, and compliance
        with the laws of the Islamic Republic of Pakistan. Any falsification, misrepresentation or
        forgery may result in immediate termination of employment and may be subject to legal action.
      </div>
    </div>
  )
}
