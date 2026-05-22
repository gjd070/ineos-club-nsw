import { useEffect, useState } from 'react'
import {
  getCategories, addCategory, updateCategory, deleteCategory,
  getBrands, addBrand, updateBrand, deleteBrand,
  getSuppliers, addSupplier, updateSupplier, deleteSupplier,
  getOptions, updateOption, deleteOption,
} from '../lib/db'

function ManageList({ title, items, onAdd, onUpdate, onDelete }) {
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    await onAdd(newName)
    setNewName('')
    setSaving(false)
  }

  async function handleSave(id) {
    if (!editName.trim()) return
    await onUpdate(id, editName)
    setEditingId(null)
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}…`}
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
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            {editingId === item.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(item.id); if (e.key === 'Escape') setEditingId(null) }}
                  autoFocus
                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]"
                />
                <button onClick={() => handleSave(item.id)} className="text-xs text-[#1a9fd4] font-medium hover:underline">Save</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                <button onClick={() => { setEditingId(item.id); setEditName(item.name) }} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
                <button onClick={() => onDelete(item)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-400">None added yet.</p>}
      </div>
    </div>
  )
}

function OptionRow({ opt, brandMap, supplierMap, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    brand_id: opt.brand_id || '',
    model: opt.model || '',
    supplier_id: opt.supplier_id || '',
    url: opt.url || '',
  })

  const brandName = opt.brand_id && brandMap[opt.brand_id] ? brandMap[opt.brand_id] : null
  const label = brandName ? [brandName, opt.model].filter(Boolean).join(' ') : opt.brand_model || opt.model || '—'

  async function handleSave() {
    await onSave(opt.id, form)
    setEditing(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
      {!editing ? (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm text-gray-800">{label}</span>
          {opt.url && <a href={opt.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1a9fd4] hover:underline">↗</a>}
          <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
          <button onClick={() => onDelete(opt)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Brand</p>
              <select value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                <option value="">No brand</option>
                {Object.entries(brandMap).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Model / Description</p>
              <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                placeholder="e.g. Dual Battery Kit"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Purchased from</p>
              <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                <option value="">No supplier</option>
                {Object.entries(supplierMap).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Product URL</p>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="text-xs text-[#1a9fd4] font-medium hover:underline">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ManageOptions({ categories, brands, suppliers, options, onUpdate, onDelete }) {
  const [expandedCat, setExpandedCat] = useState(null)

  const brandMap = Object.fromEntries(brands.map(b => [b.id, b.name]))
  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))
  const sortedCats = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-3">Options</h2>
      <p className="text-xs text-gray-400 mb-4">Click a category to view and edit its options.</p>
      <div className="space-y-1.5">
        {sortedCats.map(cat => {
          const catOptions = options
            .filter(o => o.category_id === cat.id)
            .sort((a, b) => {
              const la = brandMap[a.brand_id] ? [brandMap[a.brand_id], a.model].filter(Boolean).join(' ') : a.brand_model || a.model || ''
              const lb = brandMap[b.brand_id] ? [brandMap[b.brand_id], b.model].filter(Boolean).join(' ') : b.brand_model || b.model || ''
              return la.localeCompare(lb)
            })
          const isOpen = expandedCat === cat.id

          return (
            <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setExpandedCat(isOpen ? null : cat.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{catOptions.length} option{catOptions.length !== 1 ? 's' : ''}</span>
                  <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 p-2 space-y-1.5 bg-gray-50">
                  {catOptions.length === 0 && <p className="text-xs text-gray-400 px-1">No options yet.</p>}
                  {catOptions.map(opt => (
                    <OptionRow
                      key={opt.id}
                      opt={opt}
                      brandMap={brandMap}
                      supplierMap={supplierMap}
                      onSave={onUpdate}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Settings({ onBack }) {
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [options, setOptions] = useState([])
  const [tab, setTab] = useState('categories')

  async function loadCategories() { getCategories().then(setCategories).catch(() => {}) }
  async function loadBrands() { getBrands().then(setBrands).catch(() => {}) }
  async function loadSuppliers() { getSuppliers().then(setSuppliers).catch(() => {}) }
  async function loadOptions() { getOptions().then(setOptions).catch(() => {}) }

  useEffect(() => { loadCategories(); loadBrands(); loadSuppliers(); loadOptions() }, [])

  const tabs = [
    { id: 'categories', label: 'Categories' },
    { id: 'brands', label: 'Brands' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'options', label: 'Options' },
  ]

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-[#1a9fd4] text-[#1a9fd4]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        <ManageList
          title="Categories"
          items={[...categories].sort((a, b) => a.name.localeCompare(b.name))}
          onAdd={async name => { const max = categories.reduce((m, c) => Math.max(m, c.display_order ?? 0), 0); await addCategory(name, max + 1); loadCategories() }}
          onUpdate={async (id, name) => { await updateCategory(id, name); loadCategories() }}
          onDelete={async item => { if (!confirm(`Delete "${item.name}"?`)) return; await deleteCategory(item.id); loadCategories() }}
        />
      )}
      {tab === 'brands' && (
        <ManageList
          title="Brands"
          items={brands}
          onAdd={async name => { await addBrand(name); loadBrands() }}
          onUpdate={async (id, name) => { await updateBrand(id, name); loadBrands() }}
          onDelete={async item => { if (!confirm(`Delete "${item.name}"?`)) return; await deleteBrand(item.id); loadBrands() }}
        />
      )}
      {tab === 'suppliers' && (
        <ManageList
          title="Suppliers"
          items={suppliers}
          onAdd={async name => { await addSupplier(name); loadSuppliers() }}
          onUpdate={async (id, name) => { await updateSupplier(id, name); loadSuppliers() }}
          onDelete={async item => { if (!confirm(`Delete "${item.name}"?`)) return; await deleteSupplier(item.id); loadSuppliers() }}
        />
      )}
      {tab === 'options' && (
        <ManageOptions
          categories={categories}
          brands={brands}
          suppliers={suppliers}
          options={options}
          onUpdate={async (id, data) => { await updateOption(id, data); loadOptions() }}
          onDelete={async opt => {
            if (!confirm(`Delete this option? It will be removed from all members.`)) return
            await deleteOption(opt.id)
            loadOptions()
          }}
        />
      )}
    </div>
  )
}
