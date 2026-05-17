// ─────────────────────────────────────────────────────────────────────────────
// PDF export for Bitnex letters.
//
// Produces a real .pdf file (no browser print dialog) by:
//   1. Rendering a "header chunk" (dark banner + logo + curves) once
//   2. Rendering a "footer chunk" (teal bar + contact chips + page-N text) once
//   3. Rendering the document body (no header/footer) at A4 width
//   4. Slicing the body canvas into A4-sized chunks and assembling pages,
//      pasting header + body-slice + footer + page-number on each page
//
// Header and footer therefore appear on EVERY page, and the body content
// flows naturally across pages without being clipped or duplicated.
//
// Filename: `${employee_name}_${doc_type}.pdf` (sanitized to A-Z0-9_-).
// ─────────────────────────────────────────────────────────────────────────────

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// A4 dimensions in millimetres (jsPDF default unit for portrait A4).
const A4_W_MM = 210
const A4_H_MM = 297

// We render off-screen at this CSS pixel width, then jsPDF scales to A4.
// 794px ≈ 210mm at 96dpi (standard browser DPI).
const A4_W_PX = 794
const A4_H_PX = 1123

// Letter sections in CSS pixels (must match LetterPreview.jsx).
const HEADER_H_PX = 160
const FOOTER_H_PX = 56
const BODY_PAD_TOP_PX    = 32   // breathing room below the curved header
const BODY_PAD_BOTTOM_PX = 24   // breathing room above the footer
const SIDE_PAD_PX        = 70   // matches LetterPreview's horizontal padding

// Quality multiplier for html2canvas. Higher = sharper PDF, larger filesize.
const SCALE = 2

// ────────────────────────────────────────────────────────────────────────────
// Sanitize a string into a safe filename token.
//   "Ali Khan!"           → "Ali_Khan"
//   "Experience Letter"   → "Experience_Letter"
// ────────────────────────────────────────────────────────────────────────────
function safeToken(s) {
  return String(s || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'document'
}

export function buildFilename(employeeName, docType) {
  return `${safeToken(employeeName)}_${safeToken(docType)}.pdf`
}

// ────────────────────────────────────────────────────────────────────────────
// Take an HTMLElement and convert it to a canvas at our chosen scale.
// We disable html2canvas's "foreignObjectRendering" path because it produces
// visibly different output across browsers; the default canvas-rendering path
// is more consistent.
// ────────────────────────────────────────────────────────────────────────────
async function elementToCanvas(el) {
  return html2canvas(el, {
    scale: SCALE,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false,
    logging: false,
    // Make sure html2canvas captures the element at its declared width,
    // not the viewport width.
    width:  el.offsetWidth,
    height: el.offsetHeight,
    windowWidth:  el.offsetWidth,
    windowHeight: el.offsetHeight,
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Render a node off-screen, snapshot to canvas, then remove it.
// The host div is positioned far off-screen but kept in normal flow so child
// layouts (flex, absolute children, etc.) compute correctly.
// ────────────────────────────────────────────────────────────────────────────
async function renderNodeToCanvas(reactNode, renderFn) {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left  = '-10000px'
  host.style.top   = '0'
  host.style.width = `${A4_W_PX}px`
  host.style.background = '#ffffff'
  document.body.appendChild(host)

  try {
    await renderFn(host)
    // Allow images (logo, signature, stamp) one tick to load before snapshot.
    // Without this, the canvas can capture broken-image icons.
    await waitForImages(host)
    const canvas = await elementToCanvas(host)
    return canvas
  } finally {
    document.body.removeChild(host)
  }
}

function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'))
  if (!imgs.length) return Promise.resolve()
  return Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve()
    return new Promise(resolve => {
      img.addEventListener('load',  resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
      // Hard ceiling so a stuck image doesn't hang the download.
      setTimeout(resolve, 4000)
    })
  }))
}

// ────────────────────────────────────────────────────────────────────────────
// Main entry point. Given the same renderers used by LetterPreview, build a
// multi-page PDF that repeats header and footer on every page.
//
//   downloadLetterPDF({
//     filename,
//     renderHeader: (host) => ReactDOM.render(<HeaderOnly/>, host),
//     renderFooter: (host, pageNum, totalPages) => ...,
//     renderBody:   (host) => ReactDOM.render(<BodyOnly/>, host),
//   })
// ────────────────────────────────────────────────────────────────────────────
export async function downloadLetterPDF({
  filename,
  renderHeader,
  renderFooter,
  renderBody,
}) {
  // 1 — Snapshot header and body in parallel. We re-render the footer once
  // per page because page numbers are baked into the footer canvas.
  const [headerCanvas, bodyCanvas] = await Promise.all([
    renderNodeToCanvas(null, renderHeader),
    renderNodeToCanvas(null, renderBody),
  ])

  // jsPDF setup — A4 portrait, millimetre units.
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  // Convert px → mm (scaled by SCALE because canvas is 2x source pixels).
  const pxToMm = (px) => (px / A4_W_PX) * A4_W_MM
  const headerMmH = pxToMm(headerCanvas.height / SCALE)
  const footerMmH = pxToMm(FOOTER_H_PX)
  const bodyAreaMmH = A4_H_MM - headerMmH - footerMmH
  // Body area in body-canvas pixel space (taking SCALE into account):
  const bodyAreaPxH = (bodyAreaMmH / A4_H_MM) * (A4_H_PX * SCALE)

  // 2 — Figure out how many pages we need.
  const totalPages = Math.max(1, Math.ceil(bodyCanvas.height / bodyAreaPxH))

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) pdf.addPage('a4', 'portrait')

    // ── Draw header (same on every page) ────────────────────────────────
    pdf.addImage(
      headerCanvas, 'PNG',
      0, 0,
      A4_W_MM, headerMmH,
      undefined, 'FAST',
    )

    // ── Slice the body canvas for this page ─────────────────────────────
    const sliceStartPx = p * bodyAreaPxH
    const sliceEndPx   = Math.min(bodyCanvas.height, sliceStartPx + bodyAreaPxH)
    const sliceHeightPx = sliceEndPx - sliceStartPx
    if (sliceHeightPx > 0) {
      // Copy this slice into a temporary canvas so we can pass a PNG to jsPDF.
      const slice = document.createElement('canvas')
      slice.width  = bodyCanvas.width
      slice.height = sliceHeightPx
      const sctx = slice.getContext('2d')
      sctx.fillStyle = '#ffffff'
      sctx.fillRect(0, 0, slice.width, slice.height)
      sctx.drawImage(
        bodyCanvas,
        0, sliceStartPx, bodyCanvas.width, sliceHeightPx,
        0, 0,           bodyCanvas.width, sliceHeightPx,
      )
      const sliceMmH = pxToMm(sliceHeightPx / SCALE)
      pdf.addImage(
        slice, 'PNG',
        0, headerMmH,
        A4_W_MM, sliceMmH,
        undefined, 'FAST',
      )
    }

    // ── Draw footer with page-number ────────────────────────────────────
    // Re-render the footer for this page since the page number is part of it.
    // eslint-disable-next-line no-await-in-loop
    const footerCanvas = await renderNodeToCanvas(null,
      (host) => renderFooter(host, p + 1, totalPages))
    pdf.addImage(
      footerCanvas, 'PNG',
      0, A4_H_MM - footerMmH,
      A4_W_MM, footerMmH,
      undefined, 'FAST',
    )
  }

  pdf.save(filename)
}
