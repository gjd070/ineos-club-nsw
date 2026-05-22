import { useEffect, useState } from 'react'
import { getCategories, getAllMemberGear, getOptions, getMembers, getBrands, getArticles } from '../lib/db'
import { ColourDot } from '../components/ColourSwatch'

function optionLabel(opt, brandMap) {
  if (opt.brand_id && brandMap[opt.brand_id]) {
    return [brandMap[opt.brand_id].name, opt.model].filter(Boolean).join(' ')
  }
  return opt.brand_model || opt.model || ''
}

export default function PartsSearch({ onSelectMember }) {
  const [categories, setCategories] = useState([])
  const [selectedCat, setSelectedCat] = useState('')
  const [searchText, setSearchText] = useState('')
  const [allOptions, setAllOptions] = useState([])
  const [allMembers, setAllMembers] = useState([])
  const [allMemberGear, setAllMemberGear] = useState([])
  const [brandMap, setBrandMap] = useState({})
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getCategories(), getOptions(), getMembers(), getAllMemberGear(), getBrands(), getArticles()])
      .then(([cats, opts, members, gear, brands, arts]) => {
        setCategories(cats)
        setAllOptions(opts)
        setAllMembers(members)
        setAllMemberGear(gear)
        setBrandMap(Object.fromEntries(brands.map(b => [b.id, b])))
        setArticles(arts)
        setBootstrapped(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const optMap = Object.fromEntries(allOptions.map(o => [o.id, o]))
  const memberMap = Object.fromEntries(allMembers.map(m => [m.id, m]))

  let matchingOptions = allOptions
  if (selectedCat) matchingOptions = matchingOptions.filter(o => o.category_id === selectedCat)
  if (searchText.trim()) {
    const lower = searchText.toLowerCase()
    matchingOptions = matchingOptions.filter(o => {
      const label = optionLabel(o, brandMap).toLowerCase()
      return label.includes(lower) || o.brand_model?.toLowerCase().includes(lower) || o.source?.toLowerCase().includes(lower)
    })
  }

  const matchingOptionIds = new Set(matchingOptions.map(o => o.id))

  const grouped = allMemberGear
    .filter(g => matchingOptionIds.has(g.option_id))
    .reduce((acc, g) => {
      const option = optMap[g.option_id]
      const member = memberMap[g.member_id]
      if (!option || !member) return acc
      if (!acc[g.option_id]) acc[g.option_id] = { option, members: [] }
      acc[g.option_id].members.push({ ...member, notes: g.notes })
      return acc
    }, {})

  const results = Object.values(grouped).sort((a, b) =>
    optionLabel(a.option, brandMap).localeCompare(optionLabel(b.option, brandMap))
  )

  const hasResults = results.length > 0
  const isFiltered = selectedCat || searchText.trim()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Parts Search</h1>
      <p className="text-sm text-gray-500 mb-5">Find members by gear, brand, or category.</p>

      {/* Search controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          className="sm:w-56 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-[#1a9fd4] text-gray-700"
        >
          <option value="">All Categories</option>
          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search brand or model…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1a9fd4]"
        />
        {(selectedCat || searchText) && (
          <button
            onClick={() => { setSelectedCat(''); setSearchText('') }}
            className="text-sm text-gray-400 hover:text-gray-700 px-3 whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading...</p>}

      {!loading && isFiltered && !hasResults && bootstrapped && (
        <p className="text-gray-400 text-sm">No results found.</p>
      )}

      {!loading && hasResults && (
        <div className="space-y-4">
          {results.map(({ option, members }) => {
            const label = optionLabel(option, brandMap)
            const catName = categories.find(c => c.id === option.category_id)?.name
            return (
              <div key={option.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    {catName && <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{catName}</p>}
                    <p className="font-semibold text-gray-900">{label || '—'}</p>
                    {option.url && <a href={option.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1a9fd4] hover:underline mt-0.5 block">View product ↗</a>}
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {members.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectMember?.(m.id)}
                      className="w-full bg-gray-50 rounded-lg px-2.5 py-2 text-sm text-left hover:bg-blue-50 hover:ring-1 hover:ring-[#1a9fd4] transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        {m.colour && <ColourDot name={m.colour} size="sm" />}
                        <span className="font-medium text-gray-700">{m.name}</span>
                        {m.year && <span className="text-gray-400 text-xs">{m.year}</span>}
                        {m.model && <span className="text-gray-400 text-xs">Ineos {m.model}</span>}
                      </div>
                      {m.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{m.notes}</p>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !hasResults && !isFiltered && bootstrapped && (
        <p className="text-gray-400 text-sm">No gear entries yet.</p>
      )}

      {/* Related articles when a category is selected */}
      {!loading && selectedCat && bootstrapped && (() => {
        const related = articles.filter(a => (a.category_ids || []).includes(selectedCat))
        if (!related.length) return null
        return (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Related Articles</h2>
            <div className="space-y-2">
              {related.map(article => (
                <a key={article.id} href={`#article-${article.id}`}
                  onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('nav-article', { detail: article.id })) }}
                  className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:border-[#1a9fd4] transition-colors group"
                >
                  {article.cover_url && (
                    <img src={article.cover_url} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#1a9fd4] transition-colors">{article.title}</p>
                    {article.excerpt && <p className="text-xs text-gray-500 mt-0.5 truncate">{article.excerpt}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
