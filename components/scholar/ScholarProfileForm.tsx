'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CAREER_INTERESTS = [
  'Finance', 'Consulting', 'Technology', 'Healthcare', 'Law',
  'Education', 'Non-profit', 'Government', 'Media', 'Engineering',
  'Marketing', 'Real Estate', 'Entrepreneurship', 'Science / Research',
]

const PERSONAL_INTERESTS = [
  'Music', 'Sports', 'Art / Design', 'Writing', 'Gaming',
  'Travel', 'Cooking', 'Fitness', 'Reading', 'Volunteering',
  'Photography', 'Film / TV', 'Fashion', 'Politics / Activism',
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

const CURRENT_STAGES = [
  { value: 'pre-college', label: 'Pre-college / High school' },
  { value: 'college-1', label: 'College — Year 1' },
  { value: 'college-2', label: 'College — Year 2' },
  { value: 'college-3', label: 'College — Year 3' },
  { value: 'college-4', label: 'College — Year 4' },
  { value: 'post-grad', label: 'Post-grad / Working' },
]

export default function ScholarProfileForm({
  userId,
  profile,
  scholar,
}: {
  userId: string
  profile: any
  scholar: any
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

  // Scholar fields
  const [highSchool, setHighSchool] = useState(scholar?.high_school ?? '')
  const [college, setCollege] = useState(scholar?.college ?? '')
  const [collegeGradYear, setCollegeGradYear] = useState(scholar?.college_grad_year ?? '')
  const [gradSchool, setGradSchool] = useState(scholar?.grad_school ?? '')
  const [currentStage, setCurrentStage] = useState(scholar?.current_stage ?? '')
  const [geoPreference, setGeoPreference] = useState(scholar?.geographic_preference ?? '')
  const [firstGen, setFirstGen] = useState(scholar?.first_gen ?? false)
  const [gender, setGender] = useState(scholar?.gender ?? '')
  const [raceEthnicity, setRaceEthnicity] = useState<string[]>(scholar?.race_ethnicity ?? [])
  const [careerInterests, setCareerInterests] = useState<string[]>(scholar?.career_interests ?? [])
  const [personalInterests, setPersonalInterests] = useState<string[]>(scholar?.personal_interests ?? [])

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

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

    const { error: scholarErr } = await supabase
      .from('scholars')
      .update({
        high_school: highSchool || null,
        college: college || null,
        college_grad_year: collegeGradYear ? Number(collegeGradYear) : null,
        grad_school: gradSchool || null,
        current_stage: currentStage || null,
        geographic_preference: geoPreference || null,
        first_gen: firstGen,
        gender: gender || null,
        race_ethnicity: raceEthnicity,
        career_interests: careerInterests,
        personal_interests: personalInterests,
      })
      .eq('profile_id', userId)

    if (scholarErr) {
      setError(scholarErr.message)
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
              <button key={r} type="button" onClick={() => toggleItem(raceEthnicity, setRaceEthnicity, r)}
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
          <label htmlFor="first_gen" className="text-sm text-gray-700">I am a first-generation college student</label>
        </div>
      </div>

      {/* Academic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Academic information</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current stage</label>
          <select value={currentStage} onChange={e => setCurrentStage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select…</option>
            {CURRENT_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">High school</label>
          <input type="text" value={highSchool} onChange={e => setHighSchool(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College / University</label>
            <input type="text" value={college} onChange={e => setCollege(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected grad year</label>
            <input type="number" min={2020} max={2040} value={collegeGradYear} onChange={e => setCollegeGradYear(e.target.value)}
              placeholder="2027"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Graduate school <span className="text-gray-400 font-normal">(if applicable)</span></label>
          <input type="text" value={gradSchool} onChange={e => setGradSchool(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Geographic preference</label>
          <input type="text" value={geoPreference} onChange={e => setGeoPreference(e.target.value)}
            placeholder="e.g. New York, NY"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Interests</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Career interests <span className="text-gray-400 font-normal">(used in matching)</span></label>
          <div className="flex flex-wrap gap-2">
            {CAREER_INTERESTS.map(i => (
              <button key={i} type="button" onClick={() => toggleItem(careerInterests, setCareerInterests, i)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  careerInterests.includes(i) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Personal interests</label>
          <div className="flex flex-wrap gap-2">
            {PERSONAL_INTERESTS.map(i => (
              <button key={i} type="button" onClick={() => toggleItem(personalInterests, setPersonalInterests, i)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  personalInterests.includes(i) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                {i}
              </button>
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
