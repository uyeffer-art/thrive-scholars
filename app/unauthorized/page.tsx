import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-gray-600 mb-6">You don't have permission to view this page.</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm">← Go back home</Link>
      </div>
    </div>
  )
}
