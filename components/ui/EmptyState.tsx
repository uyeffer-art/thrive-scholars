import Link from 'next/link'

// Friendly, instructive empty state. Use instead of flat "No X yet" text.
export default function EmptyState({
  icon = '✨',
  title,
  message,
  hint,
  ctaLabel,
  ctaHref,
}: {
  icon?: string
  title: string
  message: string
  hint?: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <div
      className="rounded-2xl border p-10 text-center"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{ background: 'var(--ts-very-light-blue)' }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h3>
      <p className="mt-1.5 text-sm max-w-md mx-auto" style={{ color: 'var(--muted)' }}>{message}</p>
      {hint && (
        <p className="mt-3 text-xs max-w-md mx-auto rounded-lg px-3 py-2"
          style={{ background: 'var(--background)', color: 'var(--ts-blue)' }}>
          💡 {hint}
        </p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--ts-blue)' }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
