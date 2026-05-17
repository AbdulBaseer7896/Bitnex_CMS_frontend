// ─────────────────────────────────────────────────────────────────────────────
// Letterhead Assets Tab (Settings → Letterhead Assets)
//
// Admin / HR upload, label and manage signature and stamp images. Multiple
// of each kind can exist; the one marked "default" is auto-selected by the
// document generator when no specific asset is chosen.
//
// Layout: two stacked sections (Signatures, Stamps), each with:
//   • A grid of asset cards (image thumbnail, label, default badge, actions)
//   • An "Upload new …" form (file input + label + signatory metadata)
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineUpload, HiOutlineTrash, HiOutlineStar,
  HiOutlinePencil, HiOutlineCheck,
} from 'react-icons/hi'

const BRAND = '#44BDB2'

function AssetCard({ asset, onDelete, onMakeDefault }) {
  return (
    <div className="glass rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-center rounded-lg p-3"
           style={{ background: '#ffffff', minHeight: 90 }}>
        <img src={asset.image_url} alt={asset.label}
             style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}/>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-white text-sm font-medium truncate">{asset.label}</div>
          {(asset.signatory_name || asset.signatory_title) && (
            <div className="text-slate-500 text-[11px] truncate">
              {asset.signatory_name}{asset.signatory_title ? ` · ${asset.signatory_title}` : ''}
            </div>
          )}
        </div>
        {asset.is_default && (
          <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
                style={{ background:`${BRAND}1f`, color:BRAND, border:`1px solid ${BRAND}40` }}>
            <HiOutlineStar className="w-3 h-3"/> default
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {!asset.is_default && (
          <button onClick={() => onMakeDefault(asset)}
            className="flex-1 text-[11px] px-2 py-1.5 rounded-lg text-slate-300 hover:text-white"
            style={{ background:'rgba(255,255,255,0.04)' }}>
            Set as default
          </button>
        )}
        <button onClick={() => onDelete(asset)}
          className="text-[11px] px-2 py-1.5 rounded-lg text-red-400 hover:text-red-300"
          style={{ background:'rgba(220,38,38,0.08)' }}>
          <HiOutlineTrash className="w-3.5 h-3.5"/>
        </button>
      </div>
    </div>
  )
}

function UploadForm({ kind, onUploaded }) {
  const [file, setFile]   = useState(null)
  const [label, setLabel] = useState('')
  const [name, setName]   = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [busy, setBusy]   = useState(false)
  const fileRef = useRef()

  const reset = () => {
    setFile(null); setLabel(''); setName(''); setTitle('')
    setEmail(''); setIsDefault(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file || !label.trim()) {
      toast.error('Please pick an image and provide a label')
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('kind', kind)
      fd.append('label', label.trim())
      fd.append('image', file)
      if (kind === 'signature') {
        if (name)  fd.append('signatory_name',  name)
        if (title) fd.append('signatory_title', title)
        if (email) fd.append('signatory_email', email)
      }
      if (isDefault) fd.append('is_default', 'true')
      const { data } = await api.post('/letterhead/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(`${kind === 'signature' ? 'Signature' : 'Stamp'} uploaded`)
      reset()
      onUploaded(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="glass rounded-xl p-4 space-y-3">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        Upload new {kind === 'signature' ? 'signature' : 'stamp'}
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Label *</label>
        <input className="input text-sm" placeholder={kind === 'signature' ? 'e.g. Muaaz — HR Signature' : 'e.g. Bitnex SMC-PVT Stamp'}
          value={label} onChange={e => setLabel(e.target.value)}/>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Image file *</label>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="block w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3
                     file:rounded-lg file:border-0 file:text-xs file:font-semibold
                     file:text-white"
          style={{ }}/>
        <style>{`input[type=file]::file-selector-button{background:${BRAND};color:#0f172a}`}</style>
      </div>

      {kind === 'signature' && (
        <>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Signatory Name (optional)</label>
            <input className="input text-sm" placeholder="Muhammad Muaaz Hasni"
              value={name} onChange={e => setName(e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Title (optional)</label>
            <input className="input text-sm" placeholder="HR Manager"
              value={title} onChange={e => setTitle(e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email (optional)</label>
            <input className="input text-sm" type="email" placeholder="hr@bitnextechnologies.com"
              value={email} onChange={e => setEmail(e.target.value)}/>
          </div>
        </>
      )}

      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
        <input type="checkbox" checked={isDefault}
          onChange={e => setIsDefault(e.target.checked)}
          style={{ accentColor: BRAND }}/>
        Set as default {kind}
      </label>

      <button type="submit" disabled={busy}
        className="w-full text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background:BRAND, color:'#0f172a' }}>
        <HiOutlineUpload className="w-4 h-4"/>
        {busy ? 'Uploading…' : `Upload ${kind}`}
      </button>
    </form>
  )
}

export default function LetterheadAssetsTab() {
  const [sigs,  setSigs]  = useState([])
  const [stmps, setStmps] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([
        api.get('/letterhead/', { params: { kind: 'signature' } }),
        api.get('/letterhead/', { params: { kind: 'stamp' } }),
      ])
      setSigs(s.data.results || s.data || [])
      setStmps(t.data.results || t.data || [])
    } catch {
      toast.error('Failed to load letterhead assets')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete "${a.label}"?`)) return
    try {
      await api.delete(`/letterhead/${a.id}/`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const handleMakeDefault = async (a) => {
    try {
      await api.post(`/letterhead/${a.id}/make-default/`)
      toast.success('Set as default')
      load()
    } catch { toast.error('Failed to set default') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-bold text-white text-xl">Letterhead Assets</h3>
        <p className="text-slate-500 text-sm mt-0.5">
          Upload and manage signature and stamp images used on generated HR letters.
          One of each kind can be marked default — it'll be picked automatically by
          the document generator unless the operator chooses otherwise.
        </p>
      </div>

      {/* ── Signatures ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="text-sm font-semibold text-white">Signatures</div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 content-start">
            {loading ? (
              <div className="text-slate-500 text-sm col-span-3">Loading…</div>
            ) : sigs.length === 0 ? (
              <div className="text-slate-500 text-sm col-span-3 glass rounded-xl p-6 text-center">
                No signatures uploaded yet.
              </div>
            ) : sigs.map(a => (
              <AssetCard key={a.id} asset={a}
                onDelete={handleDelete} onMakeDefault={handleMakeDefault}/>
            ))}
          </div>
          <UploadForm kind="signature" onUploaded={load}/>
        </div>
      </section>

      {/* ── Stamps ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="text-sm font-semibold text-white">Stamps</div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 content-start">
            {loading ? (
              <div className="text-slate-500 text-sm col-span-3">Loading…</div>
            ) : stmps.length === 0 ? (
              <div className="text-slate-500 text-sm col-span-3 glass rounded-xl p-6 text-center">
                No stamps uploaded yet.
              </div>
            ) : stmps.map(a => (
              <AssetCard key={a.id} asset={a}
                onDelete={handleDelete} onMakeDefault={handleMakeDefault}/>
            ))}
          </div>
          <UploadForm kind="stamp" onUploaded={load}/>
        </div>
      </section>
    </div>
  )
}
