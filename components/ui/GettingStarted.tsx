import Link from 'next/link'

export type Step = {
  label: string
  description: string
  done: boolean
  href?: string
  cta?: string
}

// A guided progress checklist for new scholars/volunteers.
// Auto-collapses to a slim success note once every step is done.
export default function GettingStarted({ title, steps }: { title: string; steps: Step[] }) {
  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length
  const currentIndex = steps.findIndex(s => !s.done)

  if (allDone) {
    return (
      <div
        className="rounded-xl border px-4 py-3 flex items-center gap-2"
        style={{ background: '#ecfdf3', borderColor: '#abefc6' }}
      >
        <span className="text-base">🎉</span>
        <p className="text-sm font-medium" style={{ color: '#067647' }}>
          You're all set — you've completed every setup step. Nice work!
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h2>
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {doneCount} of {steps.length} done
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--background)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%`, background: 'var(--ts-blue)' }}
          />
        </div>
      </div>

      <ol className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {steps.map((s, i) => {
          const isCurrent = i === currentIndex
          return (
            <li key={s.label} className="flex items-start gap-3 px-6 py-3.5">
              {/* Status marker */}
              <span
                className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={
                  s.done
                    ? { background: '#067647', color: '#fff' }
                    : isCurrent
                    ? { background: 'var(--ts-blue)', color: '#fff' }
                    : { background: 'var(--background)', color: 'var(--muted)', border: '1px solid var(--border)' }
                }
              >
                {s.done ? '✓' : i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: s.done ? 'var(--muted)' : 'var(--foreground)', textDecoration: s.done ? 'line-through' : 'none' }}
                >
                  {s.label}
                </p>
                {!s.done && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.description}</p>
                )}
              </div>

              {/* CTA only on the current step */}
              {isCurrent && s.href && s.cta && (
                <Link
                  href={s.href}
                  className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--ts-blue)' }}
                >
                  {s.cta}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
