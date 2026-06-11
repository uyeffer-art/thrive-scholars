// A compact, friendly "how it works" strip of steps.
export default function HowItWorks({
  title,
  steps,
}: {
  title: string
  steps: { icon: string; title: string; text: string }[]
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--ts-very-light-blue)', borderColor: 'var(--ts-light-blue)' }}
    >
      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--ts-dark-blue)' }}>
        {title}
      </p>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                style={{ background: '#fff' }}
              >
                {s.icon}
              </span>
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: 'var(--ts-blue)' }}
              >
                {i + 1}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--ts-dark-blue)' }}>{s.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ts-blue)' }}>{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
