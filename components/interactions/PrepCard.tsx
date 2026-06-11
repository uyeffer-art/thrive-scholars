export default function PrepCard({
  prepContent,
  volunteerName,
  sessionType,
}: {
  prepContent: string
  volunteerName: string
  sessionType: string
}) {
  // Replace basic merge tags for in-app display
  const content = prepContent
    .replace(/\{\{volunteer_first_name\}\}/g, volunteerName)
    .replace(/\{\{session_type\}\}/g, sessionType.replace(/_/g, ' '))

  return (
    <div
      className="mt-3 pt-3 border-t rounded-b-xl p-4 -mx-5 -mb-5"
      style={{ background: 'var(--ts-very-light-blue)', borderColor: 'var(--ts-light-blue)' }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ts-dark-blue)' }}>
        📋 How to prepare for this session
      </p>
      <pre
        className="text-xs whitespace-pre-wrap font-sans leading-relaxed"
        style={{ color: 'var(--ts-blue)' }}
      >
        {content}
      </pre>
    </div>
  )
}
