// ─────────────────────────────────────────────────────────────────────────────
// LetterPreview — Bitnex Technologies official letterhead.
//
// Exposed as composable parts so the PDF generator can render header, body
// and footer independently and stitch them onto multiple pages:
//
//   <LetterHeader/>                          — dark banner + curve + logo
//   <LetterBody doc={…}/>                    — title / recipient / body text /
//                                              signature & stamp block
//   <LetterFooter pageNum totalPages/>       — teal bar + contact chips +
//                                              optional "Page X of Y"
//   <LetterPreview doc printable/>           — full single-page composition,
//                                              used for the on-screen preview
//
// Brand color: #44BDB2.
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = '#44BDB2'
export const BRAND_DARK = '#2f8a82'

// Layout constants (kept in sync with pdfGenerator.js)
export const PAGE_W = 794    // A4 width in CSS px @ 96dpi
export const PAGE_H = 1123   // A4 height in CSS px @ 96dpi
export const HEADER_H = 160
export const FOOTER_H = 56

const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Official Bitnex logo (uses /public/bitnex-logo.png)
// ─────────────────────────────────────────────────────────────────────────────
function BitnexLogoImg({ height = 64, opacity = 1 }) {
  return (
    <img src="/bitnex-logo.png" alt="Bitnex Technologies" crossOrigin="anonymous"
         style={{ height, width: 'auto', display: 'block', opacity,
                  mixBlendMode: 'screen' }}/>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer contact-chip icons
// ─────────────────────────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
       stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
)
const PhoneIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
       stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
             19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3
             a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91
             a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72
             A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const PinIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
       stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// HEADER — dark banner with logo
// ─────────────────────────────────────────────────────────────────────────────
export function LetterHeader() {
  return (
    <div style={{ position: 'relative', width: PAGE_W, height: HEADER_H,
                  overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#3d4047' }}/>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0,
                    height: 6, background: BRAND }}/>
      <svg viewBox="0 0 800 160" preserveAspectRatio="none"
           style={{ position: 'absolute', top: 0, left: 0,
                    width: '100%', height: HEADER_H }}
           xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 160 L 0 120 Q 220 148, 360 110 Q 520 70, 800 105 L 800 160 Z"
              fill="#ffffff"/>
        <path d="M 0 115 Q 220 143, 360 105 Q 520 65, 800 100 L 800 107 Q 520 72, 360 112 Q 220 150, 0 122 Z"
              fill={BRAND} opacity="0.85"/>
      </svg>
      <div style={{ position: 'absolute', top: 22, left: 48,
                    display: 'flex', alignItems: 'center' }}>
        <BitnexLogoImg height={64}/>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER — teal bar with contact chips and page number
// ─────────────────────────────────────────────────────────────────────────────
export function LetterFooter({ pageNum, totalPages, showPageNum = true,
                                footerEmail   = 'info@bitnextechnologies.com',
                                footerPhone   = '+92 339-5010115',
                                footerAddress = '277 K Block Johar Town Lahore' }) {
  const showNum = showPageNum && totalPages > 1
  return (
    <div style={{ position: 'relative', width: PAGE_W, height: FOOTER_H,
                  overflow: 'hidden' }}>
      <svg viewBox="0 0 800 56" preserveAspectRatio="none"
           style={{ position: 'absolute', top: 0, left: 0,
                    width: '100%', height: FOOTER_H }}
           xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 0 L 0 56 L 800 56 L 800 18 Q 600 0, 400 12 Q 200 24, 0 0 Z"
              fill={BRAND}/>
        <path d="M 0 0 Q 200 24, 400 12 Q 600 0, 800 18 L 800 0 Z"
              fill="#3d4047"/>
      </svg>

      {/* Page number sits in the dark strip at the top of the footer, centered,
          so it's visible on every page without disturbing the contact chips. */}
      {showNum && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 2,
                      textAlign: 'center', fontSize: 9, fontWeight: 700,
                      color: '#ffffff', letterSpacing: 0.5, zIndex: 2 }}>
          Page {pageNum} of {totalPages}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, height: '100%',
                    display: 'flex', alignItems: 'center',
                    paddingLeft: 50, paddingRight: 50,
                    justifyContent: 'space-between', gap: 24 }}>
        {[[<MailIcon  key="m"/>, footerEmail],
          [<PhoneIcon key="p"/>, footerPhone],
          [<PinIcon   key="i"/>, footerAddress]].map(([icon, txt], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: '#0f172a',
                          borderRadius: 4, display: 'flex',
                          alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <span style={{ color: '#0f172a', fontSize: 11.5, fontWeight: 600 }}>{txt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY — title, recipient block, body text, signature & stamp
// `forPdf`: when true, body content is rendered without the page-sized
// outer wrapper (just the natural-height content). The PDF generator slices
// this across pages. Watermark is included as an absolute child.
// ─────────────────────────────────────────────────────────────────────────────
export function LetterBody({ doc, forPdf = false }) {
  const d = doc.data || {}
  const title = doc.title || 'Official Document'
  const body  = d.body || ''

  const includeSignature = doc.include_signature !== false
  const includeStamp     = doc.include_stamp !== false
  const signatureUrl     = doc.signature_image_url || ''
  const stampUrl         = doc.stamp_image_url || ''

  const sigName  = d.signatory_name  || 'Muhammad Muaaz Hasni'
  const sigTitle = d.signatory_title || 'HR Manager'
  const sigEmail = d.signatory_email || 'hr@bitnextechnologies.com'

  return (
    <div style={{
      position: 'relative',
      width: PAGE_W,
      // For PDF, no fixed height — content flows naturally and pdfGenerator
      // slices into pages.
      minHeight: forPdf ? 'auto' : (PAGE_H - HEADER_H - FOOTER_H),
      background: '#ffffff',
      // Top padding matches HEADER's white curve so the title doesn't crash
      // into the curve.
      padding: '36px 70px 24px',
      fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
      color: '#111827',
      boxSizing: 'border-box',
    }}>
      {/* Watermark behind body content (absolute, doesn't affect flow) */}
      <div style={{
        position: 'absolute',
        top: '40%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(-18deg)',
        opacity: 0.06,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <BitnexLogoImg height={280}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Title */}
        <h1 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700,
                     margin: '12px 0 28px', color: '#1f2937',
                     fontFamily: '"Times New Roman", Georgia, serif' }}>{title}</h1>

        {(d.recipient_name || d.recipient_designation || doc.issue_date) && (
          <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 18 }}>
            {doc.issue_date          && <div><strong>Date:</strong> {fmtDate(doc.issue_date)}</div>}
            {d.recipient_name        && <div><strong>To:</strong> {d.recipient_name}</div>}
            {d.recipient_designation && <div><strong>Designation:</strong> {d.recipient_designation}</div>}
          </div>
        )}

        {d.salutation !== false && d.recipient_name && (
          <div style={{ fontSize: 13.5, marginBottom: 14 }}>
            Dear {d.recipient_name.split(' ')[0] || d.recipient_name},
          </div>
        )}

        <div style={{ fontSize: 13.5, lineHeight: 1.75, whiteSpace: 'pre-wrap',
                      textAlign: 'justify', marginBottom: 24 }}>{body}</div>

        {doc.notes && (
          <div style={{ marginTop: 18, padding: '12px 16px',
                        background: '#ecfdf5', borderLeft: `3px solid ${BRAND}`,
                        fontSize: 12, fontStyle: 'italic', color: '#064e3b' }}>
            <strong>Note: </strong>{doc.notes}
          </div>
        )}

        {/* Signature + stamp */}
        <div style={{ marginTop: 50, display: 'flex',
                      justifyContent: 'space-between', alignItems: 'flex-end',
                      gap: 30,
                      minHeight: includeSignature || includeStamp ? 120 : 0 }}>
          {includeSignature ? (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontStyle: 'italic', marginBottom: 8 }}>Best Regards,</div>
              {signatureUrl ? (
                <img src={signatureUrl} alt="Signature" crossOrigin="anonymous"
                     style={{ maxHeight: 60, maxWidth: 200, display: 'block',
                              marginBottom: 4, objectFit: 'contain' }}/>
              ) : (
                <div style={{ height: 36, marginBottom: 4 }}/>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, fontStyle: 'italic' }}>{sigName}</div>
              <div style={{ fontSize: 12, fontStyle: 'italic' }}>{sigTitle},</div>
              <div style={{ fontSize: 12, fontStyle: 'italic' }}>BitNex Technologies</div>
              <div style={{ fontSize: 11, color: BRAND_DARK, fontStyle: 'italic',
                            textDecoration: 'underline', marginTop: 2 }}>
                www.bitnextechnologies.com
              </div>
              <div style={{ fontSize: 11, color: BRAND_DARK, fontStyle: 'italic',
                            textDecoration: 'underline' }}>{sigEmail}</div>
            </div>
          ) : <div style={{ flex: 1 }}/>}

          {includeStamp && stampUrl && (
            <div style={{ flexShrink: 0 }}>
              <img src={stampUrl} alt="Stamp" crossOrigin="anonymous"
                   style={{ maxHeight: 100, maxWidth: 200, display: 'block',
                            objectFit: 'contain' }}/>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LetterPreview — full single-page composition used by the modal preview pane.
// Multi-page paginated PDF rendering happens via pdfGenerator.js using the
// parts above directly.
// ─────────────────────────────────────────────────────────────────────────────
export default function LetterPreview({ doc, printable = false }) {
  return (
    <div className={printable ? 'letter-print' : 'letter-screen'}
         style={{
           background: '#ffffff',
           width: PAGE_W,
           maxWidth: '100%',
           margin: '0 auto',
           boxShadow: printable ? 'none' : '0 20px 60px rgba(0,0,0,0.5)',
           overflow: 'hidden',
         }}>
      <LetterHeader/>
      <LetterBody doc={doc}/>
      <LetterFooter pageNum={1} totalPages={1}/>
    </div>
  )
}
