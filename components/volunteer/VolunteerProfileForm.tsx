'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INDUSTRIES = [
  'Finance', 'Consulting', 'Technology', 'Healthcare', 'Law',
  'Education', 'Non-profit', 'Government', 'Media', 'Engineering',
  'Marketing', 'Real Estate', 'Entrepreneurship', 'Science / Research',
]

const PROGRAM_TYPES = [
  { value: 'mentorship_year', label: 'Mentorship Year (long-term)' },
  { value: 'coffee_chat', label: 'Coffee Chats (30 min)' },
  { value: 'mock_interview', label: 'Mock Interviews (45 min)' },
  { value: 'resume_review', label: 'Resume Reviews' },
]

const RACE_OPTIONS = [
  'Black / African American',
  'Hispanic / Latino',
  'Asian / Pacific Islander',
  'White / Caucasian',
  'Native American / Alaska Native',
  'Middle Eastern / North African',
  'Multiracial',
  'Prefer not to say',
]

export default function VolunteerProfileForm({
  userId,
  profile,
  volunteer,
}: {
  userId: string
  profile: any
  volunteer: any
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Profile fields
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'America/New_York')

  // Volunteer fields
  const [employer, setEmployer] = useState(volunteer?.employer ?? '')
  const [jobTitle, setJobTitle] = useState(volunteer?.job_title ?? '')
  const [industry, setIndustry] = useState(volunteer?.industry ?? '')
  const [yearsExp, setYearsExp] = useState(volunteer?.years_experience ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(volunteer?.linkedin_url ?? '')
  const [undergradInstitution, setUndergradInstitution] = useState(volunteer?.undergrad_institution ?? '')
  const [gradInstitution, setGradInstitution] = useState(volunteer?.grad_institution ?? '')
  const [geoPreference, setGeoPreference] = useState(volunteer?.geographic_preference ?? '')
  const [calBookingUrl, setCalBookingUrl] = useState(volunteer?.cal_booking_url ?? '')
  const [maxMatches, setMaxMatches] = useState(volunteer?.max_concurrent_matches ?? 2)
  const [firstGen, setFirstGen] = useState(volunteer?.first_gen ?? false)
  const [gender, setGender] = useState(volunteer?.gender ?? '')
  const [raceEthnicity, setRaceEthnicity] = useState<string[]>(volunteer?.race_ethnicity ?? [])
  const [programTypes, setProgramTypes] = useState<string[]>(volunteer?.available_program_types ?? [])

  function toggleRace(r: string) {
    setRaceEthnicity(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    )
  }

  function toggleProgramType(pt: string) {
    setProgramTypes(prev =>
      prev.includes(pt) ? prev.filter(x => x !== pt) : [...prev, pt]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    // Update profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        city: city || null,
        state: state || null,
        timezone,
      })
      .eq('id', userId)

    if (profileErr) {
      setError(profileErr.message)
      setSaving(false)
      return
    }

    // Update volunteer
    const { error: volErr } = await supabase
      .from('volunteers')
      .update({
        employer: employer || null,
        job_title: jobTitle || null,
        industry: industry || null,
        years_experience: yearsExp ? Number(yearsExp) : null,
        linkedin_url: linkedinUrl || null,
        undergrad_institution: undergradInstitution || null,
        grad_institution: gradInstitution || null,
        geographic_preference: geoPreference || null,
        cal_booking_url: calBookingUrl || null,
        max_concurrent_matches: maxMatches,
        first_gen: firstGen,
        gender: gender || null,
        race_ethnicity: raceEthnicity,
        available_program_types: programTypes,
      })
      .eq('profile_id', userId)

    if (volErr) {
      setError(volErr.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    router.refresh()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Profile saved successfully. Your matching embedding will refresh on the next match run.
        </div>
      )}

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Personal information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" value={state} onChange={e => setState(e.target.value)}
              placeholder="NY"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select value={gender} onChange={e => setGender(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Prefer not to say</option>
            <option value="Man">Man</option>
            <option value="Woman">Woman</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Race / ethnicity</label>
          <div className="flex flex-wrap gap-2">
            {RACE_OPTIONS.map(r => (
              <button key={r} type="button" onClick={() => toggleRace(r)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  raceEthnicity.includes(r) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input id="first_gen" type="checkbox" checked={firstGen} onChange={e => setFirstGen(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="first_gen" className="text-sm text-gray-700">I was a first-generation college student</label>
        </div>
      </div>

      {/* Professional info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Professional information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
            <input type="text" value={employer} onChange={e => setEmployer(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select…</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years experience</label>
            <input type="number" min={0} max={50} value={yearsExp} onChange={e => setYearsExp(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Undergrad institution</label>
            <input type="text" value={undergradInstitution} onChange={e => setUndergradInstitution(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grad institution</label>
            <input type="text" value={gradInstitution} onChange={e => setGradInstitution(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Availability & scheduling</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geographic preference</label>
          <input type="text" value={geoPreference} onChange={e => setGeoPreference(e.target.value)}
            placeholder="e.g. New York, NY"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cal.com booking link
            <span className="ml-1 text-gray-400 font-normal">(scholars use this to schedule sessions)</span>
          </label>
          <input type="url" value={calBookingUrl} onChange={e => setCalBookingUrl(e.target.value)}
            placeholder="https://cal.com/yourname"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max concurrent mentees</label>
          <select value={maxMatches} onChange={e => setMaxMatches(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Programs I can participate in</label>
          <div className="space-y-2">
            {PROGRAM_TYPES.map(pt => (
              <label key={pt.value} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={programTypes.includes(pt.value)} onChange={() => toggleProgramType(pt.value)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">{pt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
