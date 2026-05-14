const SIZE_MAP = { sm: 36, md: 44, lg: 56, xl: 72 }

export default function BitnexLogo({ size = 40, showText = true, className = '' }) {
  const px = typeof size === 'string' ? (SIZE_MAP[size] ?? 40) : size

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={px} height={px} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="18" fill="#F5FAFA"/>
        <path d="M20 22 L20 78 Q20 85 27 85 L48 85 Q62 85 62 72 Q62 63 52 60 Q62 57 62 47 Q62 33 48 33 L27 33 Q20 33 20 22Z"
          fill="none" stroke="#f97316" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M45 22 L80 22 M62 22 L62 85" stroke="#2D3142" strokeWidth="9" strokeLinecap="round"/>
      </svg>
      {showText && (
        <div className="leading-none">
          <div className="font-display font-bold tracking-wide"
               style={{ fontSize: px * 0.38, color: '#f97316', lineHeight: 1.1 }}>
            BITNEX
          </div>
          <div className="font-display font-semibold tracking-widest uppercase"
               style={{ fontSize: px * 0.22, color: '#94a3b8', letterSpacing: '0.15em' }}>
            Technologies
          </div>
        </div>
      )}
    </div>
  )
}
