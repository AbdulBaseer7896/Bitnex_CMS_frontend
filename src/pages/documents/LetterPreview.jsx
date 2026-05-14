// Reusable official letterhead preview. Used for on-screen preview AND print.
// Pure CSS / inline styles → no extra dependencies. Print uses native browser
// "Save as PDF" dialog via window.print().

import { DOC_LABEL } from './documentTemplates'

const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function LetterPreview({ doc, printable = false }) {
  // doc: { doc_type, issue_date, data: {...}, notes }
  const d = doc.data || {}
  const title = doc.title || DOC_LABEL[doc.doc_type] || 'Official Document'
  const body  = d.body || ''
  const ref   = `BTX/${(doc.doc_type || 'doc').toUpperCase().slice(0,5)}/${(d.employee_id || '0000')}/${new Date(doc.issue_date || Date.now()).getFullYear()}`

  return (
    <div className={printable ? 'letter-print' : 'letter-screen'}
         style={{
           background: '#ffffff', color: '#1a1a1a',
           fontFamily: '"Times New Roman", Georgia, serif',
           padding: '50px 60px', minHeight: printable ? '100%' : 'auto',
           maxWidth: printable ? 'none' : 800, margin: '0 auto',
           boxShadow: printable ? 'none' : '0 8px 32px rgba(0,0,0,0.4)',
           borderRadius: printable ? 0 : 4,
           position: 'relative',
         }}>
      {/* ── Letterhead ─────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '3px solid #f97316', paddingBottom: 18, marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700,
            color: '#0d0f14', letterSpacing: '-0.5px',
          }}>
            BITNEX <span style={{ color: '#f97316' }}>TECHNOLOGIES</span>
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 4, letterSpacing: '1.5px' }}>
            VOIP · WEB & APP DEVELOPMENT · IT SOLUTIONS
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#555', lineHeight: 1.5 }}>
          Lahore, Pakistan<br/>
          info@bitnex.tech<br/>
          www.bitnex.tech
        </div>
      </div>

      {/* ── Ref + Date ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 22 }}>
        <div><strong>Ref:</strong> {ref}</div>
        <div><strong>Date:</strong> {fmtDate(doc.issue_date)}</div>
      </div>

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <h1 style={{
        textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: '2px',
        textDecoration: 'underline', textUnderlineOffset: 6,
        margin: '14px 0 28px', color: '#0d0f14', textTransform: 'uppercase',
      }}>{title}</h1>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={{
        fontSize: 13.5, lineHeight: 1.85, color: '#1a1a1a',
        whiteSpace: 'pre-wrap', textAlign: 'justify',
      }}>{body}</div>

      {/* ── Remarks ───────────────────────────────────────────────────── */}
      {doc.notes && (
        <div style={{
          marginTop: 22, padding: '12px 16px', background: '#fff7ed',
          borderLeft: '3px solid #f97316', fontSize: 12, fontStyle: 'italic',
        }}>
          <strong>Note: </strong>{doc.notes}
        </div>
      )}

      {/* ── Signature ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ width: 200, borderTop: '1px solid #333', paddingTop: 6, fontSize: 12 }}>
            Authorized Signatory
          </div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>HR Department</div>
          <div style={{ fontSize: 11, color: '#666' }}>Bitnex Technologies</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            border: '2px dashed #f97316', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#f97316', fontSize: 10, fontWeight: 600, opacity: 0.7,
          }}>
            COMPANY SEAL
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 22, left: 60, right: 60,
        borderTop: '1px solid #ddd', paddingTop: 10,
        fontSize: 9.5, color: '#888', display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>This is a computer-generated document.</span>
        <span>© Bitnex Technologies</span>
      </div>
    </div>
  )
}
