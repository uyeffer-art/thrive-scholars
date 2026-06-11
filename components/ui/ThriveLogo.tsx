export default function ThriveLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scales: Record<string, string> = { sm: 'scale-75', md: 'scale-100', lg: 'scale-125' }

  return (
    <span className={`inline-flex items-center gap-2 origin-left ${scales[size]}`}>
      {/* T-mark */}
      <span className="relative flex-shrink-0 w-7 h-7">
        <span
          className="absolute top-0 left-0 w-full h-1.5 rounded-full"
          style={{ background: '#005191' }}
        />
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-full rounded-full"
          style={{ background: '#005191' }}
        />
        <span
          className="absolute bottom-0 right-0.5 w-2 h-2 rounded-full"
          style={{ background: '#f7b926' }}
        />
      </span>
      {/* Wordmark */}
      <span className="leading-none">
        <span className="font-bold text-lg tracking-tight" style={{ color: '#005191' }}>Thrive</span>
        <span className="font-normal text-lg tracking-tight ml-1" style={{ color: '#102b4e' }}>Scholars</span>
      </span>
    </span>
  )
}
