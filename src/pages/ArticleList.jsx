import { useEffect, useState } from 'react'
import { getArticles, getCategories } from '../lib/db'

export default function ArticleList({ onSelect, onNew }) {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [filterCat, setFilterCat] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getArticles(), getCategories()])
      .then(([arts, cats]) => { setArticles(arts); setCategories(cats) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const filtered = filterCat
    ? articles.filter(a => (a.category_ids || []).includes(filterCat))
    : articles

  const sortedCats = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Articles & Guides</h1>
        <button onClick={onNew}
          className="bg-[#1a9fd4] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1589b8] transition-colors">
          + New Article
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-5">Tips, guides and write-ups from the club.</p>

      <select
        value={filterCat}
        onChange={e => setFilterCat(e.target.value)}
        className="w-full sm:w-64 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-[#1a9fd4] mb-6 text-gray-700"
      >
        <option value="">All Topics</option>
        {sortedCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {loading && <p className="text-gray-400 text-sm">Loading…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-gray-400 text-sm">No articles yet.</p>
      )}

      <div className="space-y-4">
        {filtered.map(article => {
          const tagNames = (article.category_ids || []).map(id => catMap[id]).filter(Boolean)
          const date = article.created_at?.seconds
            ? new Date(article.created_at.seconds * 1000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
            : null
          return (
            <button
              key={article.id}
              onClick={() => onSelect(article.id)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-[#1a9fd4] hover:shadow-sm transition-all"
            >
              {article.cover_url && (
                <img src={article.cover_url} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
              )}
              <h2 className="font-semibold text-gray-900 text-base mb-1">{article.title}</h2>
              {article.excerpt && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{article.excerpt}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {tagNames.map(name => (
                  <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{name}</span>
                ))}
                {date && <span className="text-xs text-gray-400 ml-auto">{date}</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
