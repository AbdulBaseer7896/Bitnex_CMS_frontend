/**
 * BitnexLogo — SVG replica of the Bitnex Technologies logo mark
 * Colors: Teal #4BBFBF + Dark #2D3142
 */
export default function BitnexLogo({ size = 40, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo mark — the "BT" interlocked symbol */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer rounded square bg */}
        <rect width="100" height="100" rx="18" fill="#F5FAFA" />

        {/* Teal curved B-shape (left side) */}
        <path
          d="M20 22 L20 78 Q20 85 27 85 L48 85 Q62 85 62 72 Q62 63 52 60 Q62 57 62 47 Q62 33 48 33 L27 33 Q20 33 20 22Z"
          fill="none"
          stroke="#4BBFBF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dark vertical T-bar (right side) */}
        <path
          d="M45 22 L80 22 M62 22 L62 85"
          stroke="#2D3142"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="leading-none">
          <div
            className="font-display font-bold tracking-wide"
            style={{ fontSize: size * 0.38, color: '#4BBFBF', lineHeight: 1.1 }}
          >
            BITNEX
          </div>
          <div
            className="font-display font-semibold tracking-widest uppercase"
            style={{ fontSize: size * 0.22, color: '#94a3b8', letterSpacing: '0.15em' }}
          >
            Technologies
          </div>
        </div>
      )}
    </div>
  )
}
