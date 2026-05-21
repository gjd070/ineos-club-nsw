import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ColourDot } from '../components/ColourSwatch'

export default function PartsSearch() {
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('gear_categories').select('*').order('display_order,name').then(({ data }) => setCategories(data || []))
  }, [])

  useEffect(() => {
    if (!selectedCat) { setResults([]); return }
    setLoading(true)
    supabase
      .from('member_gear')
      .select('*, members(name, colour, roof_colour, year, rego), gear_options(brand_model, source)')
      .eq('category_id', selectedCat)
      .order('members(name)')
      .then(({ data }) => {
        setResults(data || [])
        setLoading(false)
      })
  }, [selectedCat])

  // Group by gear option
  const grouped = results.reduce((acc, r) => {
    const key = r.gear_options?.brand_model || 'Unknown'
    if (!acc[key]) acc[key] = { option: r.gear_options, members: [] }
    acc[key].members.push(r.members)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Parts Search</h1>
      <p className="text-sm text-gray-500 mb-6">Select a category to see what other members are running.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id === selectedCat ? '' : c.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedCat === c.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading...</p>}

      {!loading && selectedCat && results.length === 0 && (
        <p className="text-gray-400 text-sm">No members have listed gear for this category yet.</p>
      )}

      {!loading && Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([brandModel, { option, members }]) => (
            <div key={brandModel} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{brandModel}</p>
                  {option?.source && <p className="text-xs text-gray-500 mt-0.5">From: {option.source}</p>}
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 text-sm">
                    {m.colour && <ColourDot name={m.colour} size="sm" />}
                    <span className="font-medium text-gray-700">{m.name}</span>
                    {m.year && <span className="text-gray-400 text-xs">{m.year}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!selectedCat && (
        <div className="text-center py-12 text-gray-300">
          <p className="text-5xl mb-3">🔍</p>
          <p className="text-gray-400">Select a category above to search</p>
        </div>
      )}
    </div>
  )
}
