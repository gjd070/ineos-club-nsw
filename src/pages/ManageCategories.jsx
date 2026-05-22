import { useEffect, useState } from 'react'
import { getCategories, addCategory, updateCategory, deleteCategory } from '../lib/db'

export default function ManageCategories({ onBack }) {
  const [categories, setCategories] = useState([])
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  async function load() {
    getCategories().then(cats => setCategories([...cats].sort((a, b) => a.name.localeCompare(b.name)))).catch(() => {})
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.display_order ?? 0), 0)
    await addCategory(newName, maxOrder + 1)
    setNewName('')
    await load()
    setSaving(false)
  }

  async function handleSaveEdit(id) {
    if (!editName.trim()) return
    await updateCategory(id, editName)
    setEditingId(null)
    await load()
  }

  async function handleDelete(cat) {
    if (!confirm(`Delete category "${cat.name}"? This won't delete existing gear entries.`)) return
    await deleteCategory(cat.id)
    await load()
  }

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-8">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New category name…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="bg-[#1a9fd4] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1589b8] disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
            {editingId === cat.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                  autoFocus
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]"
                />
                <button onClick={() => handleSaveEdit(cat.id)} className="text-xs text-[#1a9fd4] font-medium hover:underline">Save</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800">{cat.name}</span>
                <button
                  onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
