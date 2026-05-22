import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  getArticle, getCategories,
  createArticle, updateArticle,
  uploadArticleImage, deleteArticleImage,
} from '../lib/db'
import { isAdmin, loginAdmin } from '../lib/auth'

function AdminGate({ children }) {
  const [authed, setAuthed] = useState(isAdmin())
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  if (authed) return children

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Admin Access</h2>
      <p className="text-sm text-gray-500 mb-4">Enter the admin password to write or edit articles.</p>
      <form onSubmit={e => {
        e.preventDefault()
        if (loginAdmin(pw)) setAuthed(true)
        else { setError(true); setPw('') }
      }}>
        <input
          type="password" value={pw} onChange={e => { setPw(e.target.value); setError(false) }}
          placeholder="Admin password"
          className={`w-full border rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:ring-2 focus:ring-[#1a9fd4] ${error ? 'border-red-300' : 'border-gray-200'}`}
        />
        {error && <p className="text-xs text-red-500 mb-2">Incorrect password.</p>}
        <button type="submit" className="w-full bg-[#1a9fd4] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#1589b8]">
          Unlock
        </button>
      </form>
    </div>
  )
}

export default function ArticleEditor({ id, onSave, onCancel }) {
  const isEdit = !!id
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    title: '', excerpt: '', body: '', category_ids: [], video_urls: [''], cover_url: '', cover_path: '',
  })
  const [images, setImages] = useState([]) // [{ url, path }]
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    getCategories().then(cats => setCategories([...cats].sort((a, b) => a.name.localeCompare(b.name)))).catch(() => {})
    if (isEdit) {
      getArticle(id).then(art => {
        if (!art) return
        setForm({
          title: art.title || '',
          excerpt: art.excerpt || '',
          body: art.body || '',
          category_ids: art.category_ids || [],
          video_urls: art.video_urls?.length ? art.video_urls : [''],
          cover_url: art.cover_url || '',
          cover_path: art.cover_path || '',
        })
        setImages(art.images || [])
      }).catch(() => {})
    }
  }, [id])

  function toggleCat(catId) {
    setForm(f => ({
      ...f,
      category_ids: f.category_ids.includes(catId)
        ? f.category_ids.filter(id => id !== catId)
        : [...f.category_ids, catId],
    }))
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      if (form.cover_path) await deleteArticleImage(form.cover_path)
      const { url, path } = await uploadArticleImage(file)
      setForm(f => ({ ...f, cover_url: url, cover_path: path }))
    } finally {
      setUploading(false)
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const uploaded = await Promise.all(files.map(f => uploadArticleImage(f)))
      setImages(prev => [...prev, ...uploaded])
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemoveImage(img) {
    await deleteArticleImage(img.path)
    setImages(prev => prev.filter(i => i.path !== img.path))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        body: form.body,
        category_ids: form.category_ids,
        video_urls: form.video_urls.filter(Boolean),
        cover_url: form.cover_url || null,
        cover_path: form.cover_path || null,
        image_urls: images.map(i => i.url),
        images,
      }
      if (isEdit) await updateArticle(id, payload)
      else await createArticle(payload)
      onSave()
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <AdminGate>
      <div className="max-w-2xl">
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Article' : 'New Article'}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Article title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Short description (shown in list)</label>
            <input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="One line summary…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
          </div>

          {/* Category tags */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Category tags</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c.id} type="button"
                  onClick={() => toggleCat(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    form.category_ids.includes(c.id)
                      ? 'bg-[#1a9fd4] text-white border-[#1a9fd4]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a9fd4]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cover image</label>
            {form.cover_url && (
              <div className="relative mb-2">
                <img src={form.cover_url} alt="" className="w-full h-40 object-cover rounded-lg" />
                <button type="button" onClick={() => setForm(f => ({ ...f, cover_url: '', cover_path: '' }))}
                  className="absolute top-2 right-2 bg-white rounded-full px-2 py-0.5 text-xs text-red-500 border border-red-200 hover:bg-red-50">Remove</button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploading}
              className="text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#1a9fd4] file:text-white file:text-sm file:cursor-pointer" />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Body (Markdown)</label>
              <button type="button" onClick={() => setPreview(p => !p)}
                className="text-xs text-[#1a9fd4] hover:underline">{preview ? 'Edit' : 'Preview'}</button>
            </div>
            {preview ? (
              <div className="min-h-40 border border-gray-200 rounded-lg p-4 prose prose-sm max-w-none [&_a]:text-[#1a9fd4] [&_img]:rounded-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-500 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded">
                <ReactMarkdown>{form.body || '*Nothing yet…*'}</ReactMarkdown>
              </div>
            ) : (
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={12} placeholder="Write in Markdown…&#10;&#10;## Heading&#10;**Bold**, *italic*, [link](url)&#10;&#10;- List item"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] font-mono resize-y" />
            )}
          </div>

          {/* Extra images */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Photos</label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img.url} alt="" className="w-full h-20 object-cover rounded-lg" />
                    <button type="button" onClick={() => handleRemoveImage(img)}
                      className="absolute top-1 right-1 bg-white rounded-full w-5 h-5 text-xs text-red-500 flex items-center justify-center border border-red-200 hover:bg-red-50 leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading}
              className="text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-sm file:cursor-pointer" />
            {uploading && <p className="text-xs text-gray-400 mt-1">Uploading…</p>}
          </div>

          {/* Video links */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Video links</label>
            <div className="space-y-2">
              {form.video_urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input value={url} onChange={e => {
                    const next = [...form.video_urls]
                    next[i] = e.target.value
                    setForm(f => ({ ...f, video_urls: next }))
                  }} placeholder="https://youtube.com/…"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
                  {form.video_urls.length > 1 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, video_urls: f.video_urls.filter((_, j) => j !== i) }))}
                      className="text-xs text-red-400 hover:text-red-600 px-2">Remove</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setForm(f => ({ ...f, video_urls: [...f.video_urls, ''] }))}
                className="text-xs text-[#1a9fd4] hover:underline">+ Add video link</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving || uploading}
              className="bg-[#1a9fd4] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1589b8] disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Publish Article'}
            </button>
            <button type="button" onClick={onCancel}
              className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminGate>
  )
}
