// ─────────────────────────────────────────────────────────────────────────────
// OnboardingWizard
//
// Multi-step animated form shown to new employees on first login.
//
// Step flow:
//   0  Welcome
//   1  Personal Information
//   2  Contact Information
//   3  Spouse Details          (female + married only, conditional)
//   4  CNIC Front upload
//   5  CNIC Back upload
//   6  Selfie
//   7  Documents (degree + CV)
//   8  Banking (bank dropdown + account number + IBAN)
//   9  Review & Submit
//
// On submit → success toast → tokens cleared → redirect to /login.
// HR fills employment details (position, department, joining date) from
// the User model — employees no longer fill those.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineCheck,
  HiOutlineUpload, HiOutlineCamera, HiOutlineSparkles,
  HiOutlineExclamationCircle, HiOutlineRefresh,
  HiOutlineDocumentText, HiOutlineAcademicCap,
} from 'react-icons/hi'
import { PAKISTANI_BANKS } from '../../utils/pakistaniBanks'
import './onboarding.css'

const BRAND = '#44BDB2'

// ─── Helpers ───────────────────────────────────────────────────────────────
// Steps as they exist in our switch (raw index). Index 3 = Spouse, shown only
// when needsSpouseStep() returns true; otherwise we skip it.
const STEP_LABELS = [
  'Welcome',        // 0
  'Personal',       // 1
  'Contact',        // 2
  'Spouse',         // 3 (conditional)
  'CNIC Front',     // 4
  'CNIC Back',      // 5
  'Selfie',         // 6
  'Documents',      // 7
  'Banking',        // 8
  'Review',         // 9
]

function needsSpouseStep(form) {
  return form.gender === 'female' && form.marital_status === 'married'
}

// Visible step list (excludes Spouse when not applicable)
function visibleSteps(form) {
  return STEP_LABELS.filter((_, i) => i !== 3 || needsSpouseStep(form))
}

// CNIC live formatter: as the user types, format `XXXXX-XXXXXXX-X`
function formatCNIC(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 5) return digits
  if (digits.length <= 12) return `${digits.slice(0,5)}-${digits.slice(5)}`
  return `${digits.slice(0,5)}-${digits.slice(5,12)}-${digits.slice(12)}`
}
function isValidCNIC(value) {
  return /^\d{13}$/.test((value || '').replace(/\D/g, ''))
}

// ─── Top progress bar ─────────────────────────────────────────────────────
function ProgressDots({ stepIndex, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i}
          className={`ob-dot rounded-full ${
            i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'
          }`}
          style={{ width: i === stepIndex ? 12 : 8, height: i === stepIndex ? 12 : 8 }}/>
      ))}
    </div>
  )
}

// ─── Image upload box (camera-friendly) ───────────────────────────────────
function ImageUploadBox({ label, hint, currentUrl, onPick, accept = 'image/*', capture }) {
  const [preview, setPreview] = useState(currentUrl || null)
  useEffect(() => { setPreview(currentUrl || null) }, [currentUrl])

  const handleChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 8 * 1024 * 1024) {
      toast.error('File is too large (max 8MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
    onPick(f)
  }

  return (
    <label className="block cursor-pointer">
      <div
        className="rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center p-6 ob-pop"
        style={{
          borderColor: preview ? BRAND : 'rgba(255,255,255,0.15)',
          background: preview ? 'rgba(68,189,178,0.05)' : 'rgba(255,255,255,0.03)',
          minHeight: 260,
        }}>
        {preview ? (
          <img src={preview} alt={label}
               style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 12, objectFit: 'contain' }}/>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                 style={{ background: 'rgba(68,189,178,0.12)' }}>
              {capture ? <HiOutlineCamera className="w-7 h-7" style={{ color: BRAND }}/>
                       : <HiOutlineUpload className="w-7 h-7" style={{ color: BRAND }}/>}
            </div>
            <div className="text-white font-semibold mb-1">{label}</div>
            <div className="text-slate-500 text-xs max-w-xs">{hint}</div>
          </>
        )}
      </div>
      <input type="file" accept={accept} capture={capture}
             onChange={handleChange} className="hidden"/>
      {preview && (
        <div className="text-center mt-2 text-xs" style={{ color: BRAND }}>
          Tap to replace
        </div>
      )}
    </label>
  )
}

// ─── Document upload box (PDF or image, no camera) ───────────────────────
function DocUploadBox({ label, hint, icon: Icon, currentUrl, currentName, onPick }) {
  const [chosenName, setChosenName] = useState(currentName || '')
  useEffect(() => { setChosenName(currentName || '') }, [currentName])

  const handleChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 8 * 1024 * 1024) { toast.error('File too large (max 8MB)'); return }
    setChosenName(f.name)
    onPick(f)
  }

  const has = chosenName || currentUrl

  return (
    <label className="block cursor-pointer">
      <div className="rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center p-6 ob-pop"
        style={{
          borderColor: has ? BRAND : 'rgba(255,255,255,0.15)',
          background: has ? 'rgba(68,189,178,0.05)' : 'rgba(255,255,255,0.03)',
          minHeight: 180,
        }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
             style={{ background: has ? `${BRAND}22` : 'rgba(68,189,178,0.12)' }}>
          <Icon className="w-7 h-7" style={{ color: BRAND }}/>
        </div>
        <div className="text-white font-semibold mb-1">{label}</div>
        {has ? (
          <div className="text-xs mt-1 max-w-xs truncate" style={{ color: BRAND }}>
            ✓ {chosenName || 'Uploaded'}
          </div>
        ) : (
          <div className="text-slate-500 text-xs max-w-xs">{hint}</div>
        )}
        {currentUrl && !chosenName && (
          <a href={currentUrl} target="_blank" rel="noreferrer"
             onClick={e => e.stopPropagation()}
             className="text-[11px] mt-1 underline" style={{ color: BRAND }}>
            view current
          </a>
        )}
      </div>
      <input type="file" accept="application/pdf,image/*"
             onChange={handleChange} className="hidden"/>
      {has && (
        <div className="text-center mt-2 text-xs" style={{ color: BRAND }}>
          Tap to replace
        </div>
      )}
    </label>
  )
}

// ─── Field components ─────────────────────────────────────────────────────
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
      {label}{required && <span style={{ color: '#fb7185' }}> *</span>}
    </label>
    {children}
    {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
  </div>
)

const TInput = (props) => (
  <input
    {...props}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
               focus:outline-none focus:border-teal-400/60 placeholder:text-slate-600"/>
)

const TSelect = (props) => (
  <select
    {...props}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
               focus:outline-none focus:border-teal-400/60">
    {props.children}
  </select>
)

const TTextarea = (props) => (
  <textarea
    {...props}
    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm
               focus:outline-none focus:border-teal-400/60 placeholder:text-slate-600"/>
)

const RadioGroup = ({ value, options, onChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {options.map(([v, l]) => {
      const active = value === v
      return (
        <button key={v} type="button" onClick={() => onChange(v)}
          className="ob-pop rounded-xl px-3 py-3 text-sm font-medium"
          style={{
            background: active ? `${BRAND}1f` : 'rgba(255,255,255,0.04)',
            border: active ? `1px solid ${BRAND}66` : '1px solid rgba(255,255,255,0.08)',
            color: active ? BRAND : '#cbd5e1',
          }}>
          {l}
        </button>
      )
    })}
  </div>
)

// ─── Main wizard ──────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { user, refreshUser, logout: authLogout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({
    full_name:'', father_name:'', cnic_number:'', date_of_birth:'',
    gender:'', marital_status:'',
    personal_number:'', father_number:'', emergency_number:'',
    personal_email:'', address:'', city:'',
    husband_name:'', husband_profession:'', husband_number:'',
    bank_name:'', bank_branch:'', account_title:'',
    account_number:'', iban:'',
    status:'draft', hr_notes:'',
  })
  const [stepIdx, setStepIdx] = useState(0)
  const [files, setFiles] = useState({
    cnic_front:null, cnic_back:null, selfie:null,
    latest_degree:null, cv:null,
  })
  const [urls, setUrls] = useState({
    cnic_front_url:'', cnic_back_url:'', selfie_url:'',
    latest_degree_url:'', cv_url:'',
  })

  // Load existing draft / submission
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/onboarding/me/')
        setForm(f => ({ ...f, ...data }))
        setUrls({
          cnic_front_url:    data.cnic_front_url    || '',
          cnic_back_url:     data.cnic_back_url     || '',
          selfie_url:        data.selfie_url        || '',
          latest_degree_url: data.latest_degree_url || '',
          cv_url:            data.cv_url            || '',
        })
        // Skip past welcome if they've already started filling
        if (data.full_name || data.cnic_number) setStepIdx(1)
        // Post-submit states
        if (data.status === 'submitted')         setStepIdx(100)
        if (data.status === 'changes_requested') setStepIdx(101)
        if (data.status === 'approved')          setStepIdx(102)
      } catch {
        toast.error('Failed to load onboarding')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const steps = useMemo(() => visibleSteps(form), [form.gender, form.marital_status])

  // Translate raw stepIdx into the position in visibleSteps for the dots
  const visibleIndex = useMemo(() => {
    if (stepIdx > 10) return steps.length - 1
    let v = 0
    for (let i = 1; i <= stepIdx; i++) {
      if (i === 3 && !needsSpouseStep(form)) continue
      v++
    }
    return v
  }, [stepIdx, steps, form.gender, form.marital_status])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const saveDraft = async (extraFiles = {}) => {
    const fd = new FormData()
    const fields = [
      'full_name','father_name','cnic_number','date_of_birth','gender','marital_status',
      'personal_number','father_number','emergency_number','personal_email','address','city',
      'husband_name','husband_profession','husband_number',
      'bank_name','bank_branch','account_title','account_number','iban',
    ]
    for (const k of fields) {
      const v = form[k]
      if (v !== undefined && v !== null) fd.append(k, v)
    }
    if (extraFiles.cnic_front)    fd.append('cnic_front_image', extraFiles.cnic_front)
    if (extraFiles.cnic_back)     fd.append('cnic_back_image',  extraFiles.cnic_back)
    if (extraFiles.selfie)        fd.append('selfie_image',     extraFiles.selfie)
    if (extraFiles.latest_degree) fd.append('latest_degree',    extraFiles.latest_degree)
    if (extraFiles.cv)            fd.append('cv',               extraFiles.cv)
    const { data } = await api.patch('/onboarding/me/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setUrls({
      cnic_front_url:    data.cnic_front_url    || urls.cnic_front_url,
      cnic_back_url:     data.cnic_back_url     || urls.cnic_back_url,
      selfie_url:        data.selfie_url        || urls.selfie_url,
      latest_degree_url: data.latest_degree_url || urls.latest_degree_url,
      cv_url:            data.cv_url            || urls.cv_url,
    })
    return data
  }

  const goNext = async () => {
    const err = validateStep(stepIdx, form, files, urls)
    if (err) { toast.error(err); return }
    setSaving(true)
    try {
      const extra = {}
      if (stepIdx === 4 && files.cnic_front)    extra.cnic_front = files.cnic_front
      if (stepIdx === 5 && files.cnic_back)     extra.cnic_back  = files.cnic_back
      if (stepIdx === 6 && files.selfie)        extra.selfie     = files.selfie
      if (stepIdx === 7) {
        if (files.latest_degree) extra.latest_degree = files.latest_degree
        if (files.cv)            extra.cv            = files.cv
      }
      await saveDraft(extra)
      let next = stepIdx + 1
      if (next === 3 && !needsSpouseStep(form)) next = 4
      setStepIdx(next)
    } catch (e) {
      // Surface server-side CNIC validation error
      const detail = e.response?.data
      let msg = 'Failed to save'
      if (detail?.cnic_number?.[0]) msg = detail.cnic_number[0]
      else if (detail?.detail)      msg = detail.detail
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const goPrev = () => {
    let prev = stepIdx - 1
    if (prev === 3 && !needsSpouseStep(form)) prev = 2
    if (prev < 1) prev = 0
    setStepIdx(prev)
  }

  // Submit → save final draft → call submit endpoint → toast → log out → /login
  const submitForm = async () => {
    setSaving(true)
    try {
      await saveDraft()
      await api.post('/onboarding/me/submit/')
      toast.success('Submitted to HR for review! You will be logged out now.', { duration: 4000 })
      // Tiny delay so the user sees the success toast before redirect
      setTimeout(() => {
        if (typeof authLogout === 'function') {
          authLogout()
        } else {
          // Fallback: nuke tokens manually
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
        navigate('/login', { replace: true })
        // Force-refresh so AuthContext re-reads localStorage clean
        setTimeout(() => window.location.reload(), 50)
      }, 1200)
    } catch (e) {
      const detail = e.response?.data?.detail || 'Failed to submit'
      const missing = e.response?.data?.missing_fields
      toast.error(missing ? `${detail} Missing: ${missing.join(', ')}` : detail)
      setSaving(false)
    }
  }

  const handleAcknowledgeWelcome = async () => {
    try {
      await api.post('/onboarding/me/welcome-seen/')
      await refreshUser?.()
      navigate('/dashboard')
    } catch { toast.error('Failed to continue') }
  }

  // ── Loading / special states ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'#0b0f17' }}>
        <div className="w-10 h-10 border-2 rounded-full animate-spin"
             style={{ borderColor:`${BRAND}33`, borderTopColor:BRAND }}/>
      </div>
    )
  }
  if (stepIdx === 100) return <SubmittedScreen onLogout={() => {
    if (typeof authLogout === 'function') authLogout()
    else {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
    navigate('/login', { replace: true })
    setTimeout(() => window.location.reload(), 50)
  }}/>
  if (stepIdx === 101) return (
    <ChangesRequestedScreen
      notes={form.hr_notes}
      onContinue={() => setStepIdx(1)}/>
  )
  if (stepIdx === 102) return (
    <ApprovedScreen
      name={form.full_name || user?.first_name || user?.username}
      onContinue={handleAcknowledgeWelcome}/>
  )

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="ob-bg"/>
      <div className="ob-bubble b1"/>
      <div className="ob-bubble b2"/>
      <div className="ob-bubble b3"/>

      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <img src="/bitnex-logo.png" alt="Bitnex" style={{ height: 32, mixBlendMode: 'screen' }}/>
        <div className="text-xs text-slate-400">
          {user?.username && <>Signed in as <span className="text-white">{user.username}</span></>}
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pb-12">
        <div className="rounded-3xl p-6 sm:p-10"
             style={{ background:'rgba(15,23,32,0.85)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      backdropFilter:'blur(24px)' }}>

          {stepIdx > 0 && stepIdx <= 9 && (
            <>
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: BRAND }}>
                  Step {visibleIndex} of {steps.length - 1}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                  {STEP_LABELS[stepIdx]}
                </h2>
              </div>
              <ProgressDots stepIndex={visibleIndex} total={steps.length - 1}/>
            </>
          )}

          <div key={stepIdx} className="ob-step-enter">
            {stepIdx === 0 && <WelcomeStep user={user} onStart={() => setStepIdx(1)}/>}
            {stepIdx === 1 && <PersonalStep form={form} set={set}/>}
            {stepIdx === 2 && <ContactStep form={form} set={set}/>}
            {stepIdx === 3 && <SpouseStep form={form} set={set}/>}
            {stepIdx === 4 && (
              <CNICStep side="front"
                hint="Take a clear photo of the FRONT of your CNIC. All 4 corners and your photo must be visible."
                currentUrl={urls.cnic_front_url}
                onPick={f => setFiles(p => ({ ...p, cnic_front: f }))}/>
            )}
            {stepIdx === 5 && (
              <CNICStep side="back"
                hint="Flip your CNIC and capture the BACK."
                currentUrl={urls.cnic_back_url}
                onPick={f => setFiles(p => ({ ...p, cnic_back: f }))}/>
            )}
            {stepIdx === 6 && (
              <SelfieStep
                currentUrl={urls.selfie_url}
                onPick={f => setFiles(p => ({ ...p, selfie: f }))}/>
            )}
            {stepIdx === 7 && (
              <DocumentsStep
                files={files} urls={urls}
                onPick={(k, f) => setFiles(p => ({ ...p, [k]: f }))}/>
            )}
            {stepIdx === 8 && <BankingStep form={form} set={set}/>}
            {stepIdx === 9 && <ReviewStep form={form} urls={urls} onJump={setStepIdx}/>}
          </div>

          {stepIdx > 0 && stepIdx <= 9 && (
            <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-white/5">
              <button onClick={goPrev} disabled={saving || stepIdx <= 1}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white disabled:opacity-30 flex items-center gap-2"
                style={{ background:'rgba(255,255,255,0.04)' }}>
                <HiOutlineArrowLeft className="w-4 h-4"/> Back
              </button>

              {stepIdx < 9 ? (
                <button onClick={goNext} disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                  style={{ background:BRAND, color:'#0f172a' }}>
                  {saving ? 'Saving…' : 'Continue'} <HiOutlineArrowRight className="w-4 h-4"/>
                </button>
              ) : (
                <button onClick={submitForm} disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                  style={{ background:BRAND, color:'#0f172a' }}>
                  {saving ? 'Submitting…' : 'Submit to HR'} <HiOutlineCheck className="w-4 h-4"/>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Per-step validators ──────────────────────────────────────────────────
function validateStep(idx, form, files, urls) {
  if (idx === 1) {
    if (!form.full_name)        return 'Please enter your full name'
    if (!form.father_name)      return "Please enter your father's name"
    if (!form.cnic_number)      return 'Please enter your CNIC number'
    if (!isValidCNIC(form.cnic_number))
      return 'CNIC must be 13 digits — format XXXXX-XXXXXXX-X (e.g. 35202-1234567-1)'
    if (!form.date_of_birth)    return 'Please enter your date of birth'
    if (!form.gender)           return 'Please select your gender'
    if (!form.marital_status)   return 'Please select marital status'
  }
  if (idx === 2) {
    if (!form.personal_number)  return 'Please enter your personal phone number'
    if (!form.emergency_number) return 'Please enter an emergency contact number'
    if (!form.address)          return 'Please enter your address'
    if (!form.city)             return 'Please enter your city'
  }
  if (idx === 3) {
    if (!form.husband_name)   return "Please enter your husband's name"
    if (!form.husband_number) return "Please enter your husband's contact number"
  }
  if (idx === 4 && !files.cnic_front && !urls.cnic_front_url)
    return 'Please upload the front of your CNIC'
  if (idx === 5 && !files.cnic_back && !urls.cnic_back_url)
    return 'Please upload the back of your CNIC'
  if (idx === 6 && !files.selfie && !urls.selfie_url)
    return 'Please take or upload a selfie'
  if (idx === 7) {
    if (!files.latest_degree && !urls.latest_degree_url)
      return 'Please upload your latest degree'
    if (!files.cv && !urls.cv_url)
      return 'Please upload your CV'
  }
  return null
}

// ─── STEP COMPONENTS ──────────────────────────────────────────────────────
function WelcomeStep({ user, onStart }) {
  const name = user?.first_name || user?.username || 'there'
  return (
    <div className="text-center py-8">
      <div className="inline-flex w-28 h-28 rounded-full items-center justify-center ob-pulse mb-6"
           style={{ background: `linear-gradient(135deg, ${BRAND}, #2f8a82)` }}>
        <HiOutlineSparkles className="w-14 h-14 text-white"/>
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
        Welcome to the <span style={{ color: BRAND }}>Bitnex family</span>, {name}!
      </h1>
      <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed mb-6">
        We're excited to have you on board. Before you dive in, we need a few details to set up your
        profile. It only takes a couple of minutes — and you can save and come back anytime.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8 text-left">
        {[
          { e:'📝', t:'Personal info', d:'Tell us about yourself' },
          { e:'🪪', t:'Verify identity', d:'Upload your CNIC + a selfie' },
          { e:'🎉', t:'Get started', d:'HR reviews & welcomes you' },
        ].map((c,i) => (
          <div key={i} className="rounded-2xl p-4"
               style={{ background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-2xl mb-2">{c.e}</div>
            <div className="text-white font-semibold text-sm">{c.t}</div>
            <div className="text-slate-500 text-xs mt-0.5">{c.d}</div>
          </div>
        ))}
      </div>
      <button onClick={onStart}
        className="px-8 py-3 rounded-2xl font-semibold inline-flex items-center gap-2"
        style={{ background:BRAND, color:'#0f172a' }}>
        Let's get started <HiOutlineArrowRight className="w-5 h-5"/>
      </button>
    </div>
  )
}

function PersonalStep({ form, set }) {
  const cnicValid = !form.cnic_number || isValidCNIC(form.cnic_number)
  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <TInput value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  placeholder="Enter your full name"/>
        </Field>
        <Field label="Father's Name" required>
          <TInput value={form.father_name} onChange={e => set('father_name', e.target.value)}
                  placeholder="Enter your father's name"/>
        </Field>
        <Field label="CNIC Number" required
               error={!cnicValid ? 'CNIC must be 13 digits (XXXXX-XXXXXXX-X)' : null}>
          <TInput
            value={form.cnic_number}
            onChange={e => set('cnic_number', formatCNIC(e.target.value))}
            placeholder="35202-1234567-1"
            inputMode="numeric"
            maxLength={15}/>
        </Field>
        <Field label="Date of Birth" required>
          <TInput type="date" value={form.date_of_birth || ''}
                  onChange={e => set('date_of_birth', e.target.value)}/>
        </Field>
      </div>
      <Field label="Gender" required>
        <RadioGroup value={form.gender} onChange={v => set('gender', v)}
          options={[['male','Male'],['female','Female']]}/>
      </Field>
      <Field label="Marital Status" required>
        <RadioGroup value={form.marital_status} onChange={v => set('marital_status', v)}
          options={[['single','Single'],['married','Married'],['divorced','Divorced'],['widowed','Widowed']]}/>
      </Field>
    </div>
  )
}

function ContactStep({ form, set }) {
  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Personal Number" required>
          <TInput value={form.personal_number} onChange={e => set('personal_number', e.target.value)}
                  placeholder="+92 3XX XXXXXXX"/>
        </Field>
        <Field label="Father's Number">
          <TInput value={form.father_number} onChange={e => set('father_number', e.target.value)}
                  placeholder="+92 3XX XXXXXXX"/>
        </Field>
        <Field label="Emergency Contact Number" required>
          <TInput value={form.emergency_number} onChange={e => set('emergency_number', e.target.value)}
                  placeholder="+92 3XX XXXXXXX"/>
        </Field>
        <Field label="Personal Email">
          <TInput type="email" value={form.personal_email}
                  onChange={e => set('personal_email', e.target.value)}
                  placeholder="you@example.com"/>
        </Field>
      </div>
      <Field label="Address" required>
        <TTextarea rows={3} value={form.address} onChange={e => set('address', e.target.value)}
                   placeholder="House #, Street, Area, Sector"/>
      </Field>
      <Field label="City" required>
        <TInput value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="e.g. Lahore"/>
      </Field>
    </div>
  )
}

function SpouseStep({ form, set }) {
  return (
    <div className="space-y-4 mt-6">
      <div className="rounded-xl p-3 text-xs"
           style={{ background:`${BRAND}14`, border:`1px solid ${BRAND}33`, color:BRAND }}>
        Because you've selected <strong>female + married</strong>, please share a few details about your husband.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Husband's Name" required>
          <TInput value={form.husband_name} onChange={e => set('husband_name', e.target.value)}/>
        </Field>
        <Field label="Profession">
          <TInput value={form.husband_profession}
                  onChange={e => set('husband_profession', e.target.value)}/>
        </Field>
        <Field label="Husband's Contact Number" required>
          <TInput value={form.husband_number} onChange={e => set('husband_number', e.target.value)}/>
        </Field>
      </div>
    </div>
  )
}

function CNICStep({ side, hint, currentUrl, onPick }) {
  return (
    <div className="mt-6">
      <ImageUploadBox
        label={`Upload CNIC – ${side.toUpperCase()}`}
        hint={hint}
        accept="image/*"
        capture="environment"
        currentUrl={currentUrl}
        onPick={onPick}/>
    </div>
  )
}

function SelfieStep({ currentUrl, onPick }) {
  return (
    <div className="mt-6">
      <ImageUploadBox
        label="Take a Selfie"
        hint="A clear, well-lit selfie helps HR verify your identity. Look into the camera and smile!"
        accept="image/*"
        capture="user"
        currentUrl={currentUrl}
        onPick={onPick}/>
    </div>
  )
}

function DocumentsStep({ files, urls, onPick }) {
  return (
    <div className="space-y-4 mt-6">
      <div className="rounded-xl p-3 text-xs"
           style={{ background:`${BRAND}14`, border:`1px solid ${BRAND}33`, color:BRAND }}>
        Upload your latest academic certificate and CV so HR can keep them on file for your records.
        PDF or image is fine — max 8 MB each.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocUploadBox
          label="Latest Degree"
          hint="Your most recent degree or certificate (PDF preferred)"
          icon={HiOutlineAcademicCap}
          currentUrl={urls.latest_degree_url}
          currentName={files.latest_degree?.name || ''}
          onPick={f => onPick('latest_degree', f)}/>
        <DocUploadBox
          label="Curriculum Vitae"
          hint="Your CV / resume (PDF preferred)"
          icon={HiOutlineDocumentText}
          currentUrl={urls.cv_url}
          currentName={files.cv?.name || ''}
          onPick={f => onPick('cv', f)}/>
      </div>
    </div>
  )
}

function BankingStep({ form, set }) {
  return (
    <div className="space-y-4 mt-6">
      <div className="rounded-xl p-3 text-xs text-slate-400"
           style={{ background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.06)' }}>
        These banking details are used to disburse your salary. If you don't have a bank account yet, leave
        the fields empty and HR will collect them later.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Bank">
          <TSelect value={form.bank_name} onChange={e => set('bank_name', e.target.value)}>
            <option value="">— Select bank —</option>
            {PAKISTANI_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </TSelect>
        </Field>
        <Field label="Branch">
          <TInput value={form.bank_branch} onChange={e => set('bank_branch', e.target.value)}
                  placeholder="e.g. Johar Town"/>
        </Field>
        <Field label="Account Title">
          <TInput value={form.account_title} onChange={e => set('account_title', e.target.value)}
                  placeholder="As printed on your cheque book"/>
        </Field>
        <Field label="Account Number">
          <TInput value={form.account_number} onChange={e => set('account_number', e.target.value)}
                  placeholder="e.g. 01234567890123"
                  inputMode="numeric"/>
        </Field>
        <Field label="IBAN">
          <TInput value={form.iban} onChange={e => set('iban', e.target.value)}
                  placeholder="PK00ABCD0000000000000000"/>
        </Field>
      </div>
    </div>
  )
}

function ReviewStep({ form, urls, onJump }) {
  const Row = ({ label, value, step }) => (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/5">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
        <div className="text-white text-sm">{value || <span className="text-rose-400">— missing —</span>}</div>
      </div>
      <button onClick={() => onJump(step)}
        className="text-[11px]" style={{ color: BRAND }}>Edit</button>
    </div>
  )
  return (
    <div className="space-y-5 mt-6">
      <p className="text-slate-400 text-sm">
        Review your details before submitting. After submission you'll be logged out, and HR will review
        your information.
      </p>

      <section className="rounded-2xl p-4"
               style={{ background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Personal</div>
        <Row label="Full Name"      value={form.full_name}      step={1}/>
        <Row label="Father's Name"  value={form.father_name}    step={1}/>
        <Row label="CNIC"           value={form.cnic_number}    step={1}/>
        <Row label="Date of Birth"  value={form.date_of_birth}  step={1}/>
        <Row label="Gender"         value={form.gender}         step={1}/>
        <Row label="Marital Status" value={form.marital_status} step={1}/>
      </section>

      <section className="rounded-2xl p-4"
               style={{ background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Contact</div>
        <Row label="Personal Number"   value={form.personal_number}   step={2}/>
        <Row label="Emergency Contact" value={form.emergency_number}  step={2}/>
        <Row label="Email"             value={form.personal_email}    step={2}/>
        <Row label="Address"           value={form.address}           step={2}/>
        <Row label="City"              value={form.city}              step={2}/>
      </section>

      {needsSpouseStep(form) && (
        <section className="rounded-2xl p-4"
                 style={{ background:'rgba(255,255,255,0.03)',
                          border:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Spouse</div>
          <Row label="Husband Name"   value={form.husband_name}       step={3}/>
          <Row label="Profession"     value={form.husband_profession} step={3}/>
          <Row label="Contact Number" value={form.husband_number}     step={3}/>
        </section>
      )}

      <section className="rounded-2xl p-4"
               style={{ background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Identity & Documents</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
          {[
            ['cnic_front_url','CNIC Front',4,true],
            ['cnic_back_url', 'CNIC Back', 5,true],
            ['selfie_url',    'Selfie',    6,true],
            ['latest_degree_url','Degree', 7,false],
            ['cv_url',        'CV',        7,false],
          ].map(([k,l,s,isImage]) => (
            <button key={k} onClick={() => onJump(s)}
              className="rounded-xl overflow-hidden ob-pop"
              style={{ background:'rgba(255,255,255,0.04)',
                       border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="aspect-video flex items-center justify-center text-xs"
                   style={{ background:'rgba(0,0,0,0.3)' }}>
                {urls[k]
                  ? (isImage
                       ? <img src={urls[k]} alt={l}
                              style={{ maxHeight:'100%', maxWidth:'100%', objectFit:'contain' }}/>
                       : <span style={{ color: BRAND }}>✓ uploaded</span>)
                  : <span className="text-rose-400">missing</span>}
              </div>
              <div className="px-2 py-1 text-xs text-slate-300">{l}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-4"
               style={{ background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Banking</div>
        <Row label="Bank"           value={form.bank_name}      step={8}/>
        <Row label="Account Title"  value={form.account_title}  step={8}/>
        <Row label="Account Number" value={form.account_number} step={8}/>
        <Row label="IBAN"           value={form.iban}           step={8}/>
      </section>
    </div>
  )
}

// ─── Post-submit screens ──────────────────────────────────────────────────
function SubmittedScreen({ onLogout }) {
  // Auto-logout after 2.5s in case the user landed here directly
  useEffect(() => {
    const t = setTimeout(onLogout, 2500)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="ob-bg"/>
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex w-24 h-24 rounded-full items-center justify-center ob-pulse mb-6"
             style={{ background:`linear-gradient(135deg, ${BRAND}, #2f8a82)` }}>
          <HiOutlineCheck className="w-12 h-12 text-white"/>
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">
          Submitted! 🎉
        </h1>
        <p className="text-slate-400 leading-relaxed mb-2">
          Your information has been sent to HR for review.
        </p>
        <p className="text-slate-500 leading-relaxed mb-6 text-sm">
          You'll be logged out in a moment. HR will let you know once your onboarding is approved.
        </p>
      </div>
    </div>
  )
}

function ChangesRequestedScreen({ notes, onContinue }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="ob-bg"/>
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex w-24 h-24 rounded-full items-center justify-center mb-6"
             style={{ background:'rgba(251, 146, 60, 0.18)',
                      border:'1px solid rgba(251,146,60,0.3)' }}>
          <HiOutlineExclamationCircle className="w-12 h-12 text-orange-400"/>
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">
          HR has requested changes
        </h1>
        <p className="text-slate-400 mb-4">Please review the feedback below and update your information.</p>
        {notes && (
          <div className="rounded-2xl p-4 text-left mb-6"
               style={{ background:'rgba(251,146,60,0.08)',
                        border:'1px solid rgba(251,146,60,0.2)' }}>
            <div className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">
              HR Notes
            </div>
            <div className="text-orange-100 text-sm whitespace-pre-wrap">{notes}</div>
          </div>
        )}
        <button onClick={onContinue}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          style={{ background:BRAND, color:'#0f172a' }}>
          <HiOutlineRefresh className="w-4 h-4"/> Update my information
        </button>
      </div>
    </div>
  )
}

function ApprovedScreen({ name, onContinue }) {
  const confetti = useMemo(() => {
    const colors = ['#44BDB2','#a78bfa','#fbbf24','#f472b6','#5eead4','#fb7185']
    return Array.from({ length: 70 }, () => ({
      left:  Math.random() * 100,
      delay: Math.random() * 4,
      dur:   3 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot:   Math.random() * 360,
    }))
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="ob-bg"/>
      {confetti.map((c, i) => (
        <div key={i} className="ob-confetti"
             style={{
               left: `${c.left}%`,
               background: c.color,
               animationDuration: `${c.dur}s`,
               animationDelay:    `${c.delay}s`,
               transform: `rotate(${c.rot}deg)`,
             }}/>
      ))}

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex w-28 h-28 rounded-full items-center justify-center ob-pulse mb-6"
             style={{ background:`linear-gradient(135deg, ${BRAND}, #2f8a82)` }}>
          <HiOutlineSparkles className="w-14 h-14 text-white"/>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
          Welcome to the <span style={{ color: BRAND }}>Bitnex family</span>!
        </h1>
        <p className="text-slate-300 text-lg mb-2">{name} 🎉</p>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
          Your onboarding is complete. You're officially part of the team — let's build something great
          together.
        </p>
        <button onClick={onContinue}
          className="px-8 py-3 rounded-2xl font-semibold inline-flex items-center gap-2 text-base"
          style={{ background:BRAND, color:'#0f172a' }}>
          Enter the dashboard <HiOutlineArrowRight className="w-5 h-5"/>
        </button>
      </div>
    </div>
  )
}
