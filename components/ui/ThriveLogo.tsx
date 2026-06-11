export default function ThriveLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const heights: Record<string, number> = { sm: 28, md: 34, lg: 44 }
  const h = heights[size]

  return (
    <svg
      height={h}
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Thrive Scholars"
    >
      {/* T mark — bold upward arrow suggesting growth */}
      <rect x="0" y="8" width="24" height="5" rx="2.5" fill="#005191" />
      <rect x="9.5" y="8" width="5" height="28" rx="2.5" fill="#005191" />
      {/* Yellow accent dot */}
      <circle cx="19" cy="36" r="4" fill="#f7b926" />

      {/* Wordmark */}
      <text
        x="34"
        y="27"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="18"
        fontWeight="700"
        fill="#005191"
        letterSpacing="-0.3"
      >
        Thrive
      </text>
      <text
        x="96"
        y="27"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="18"
        fontWeight="400"
        fill="#102b4e"
        letterSpacing="-0.2"
      >
        Scholars
      </text>
    </svg>
  )
}
