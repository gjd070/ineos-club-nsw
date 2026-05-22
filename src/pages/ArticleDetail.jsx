import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { getArticle, getCategories, deleteArticle } from '../lib/db'
import { isAdmin } from '../lib/auth'

export default function ArticleDetail({ id, onBack, onEdit }) {
  const [article, setArticle] = useState(null)
  const [catMap, setCatMap] = useState({})
  const [loading, setLoading] = useState(true)
  const admin = isAdmin()

  useEffect(() => {
    Promise.all([getArticle(id), getCategories()])
      .then(([art, cats]) => {
        setArticle(art)
        setCatMap(Object.fromEntries(cats.map(c => [c.id, c.name])))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this article?')) return
    await deleteArticle(id)
    onBack()
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading…</p>
  if (!article) return <p className="text-red-400 text-sm">Article not found.</p>

  const date = article.created_at?.seconds
    ? new Date(article.created_at.seconds * 1000).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const tagNames = (article.category_ids || []).map(id => catMap[id]).filter(Boolean)

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>

      {article.cover_url && (
        <img src={article.cover_url} alt="" className="w-full h-56 object-cover rounded-xl mb-5" />
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
        {admin && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onEdit(id)} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
            <button onClick={handleDelete} className="text-sm px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">Delete</button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {tagNames.map(name => (
          <span key={name} className="text-xs bg-[#1a9fd4]/10 text-[#1a9fd4] px-2.5 py-0.5 rounded-full font-medium">{name}</span>
        ))}
        {date && <span className="text-xs text-gray-400">{date}</span>}
      </div>

      {/* Markdown body */}
      <div className="prose prose-sm max-w-none text-gray-800 mb-6 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_a]:text-[#1a9fd4] [&_a]:no-underline hover:[&_a]:underline [&_img]:rounded-lg [&_img]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-500 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg">
        <ReactMarkdown>{article.body || ''}</ReactMarkdown>
      </div>

      {/* Inline images */}
      {article.image_urls?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {article.image_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Video links */}
      {article.video_urls?.filter(Boolean).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Videos</h3>
          <div className="space-y-2">
            {article.video_urls.filter(Boolean).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#1a9fd4] hover:underline">
                <span className="text-base">▶</span> {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
