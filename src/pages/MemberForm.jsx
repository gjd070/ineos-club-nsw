import { useEffect, useState } from 'react'
import {
  getMember, createMember, updateMember,
  getCategories, getOptions, getBrands, getSuppliers,
  addBrand, addSupplier,
  addOption, updateOption, deleteOption,
  setMemberGearItem, removeMemberGearItem, getMemberGear,
} from '../lib/db'
import { ColourPicker } from '../components/ColourSwatch'

const YEARS = Array.from({ length: 8 }, (_, i) => 2022 + i)
const MODELS = ['Grenadier', 'Quartermaster']
const VARIANTS = ['Trialmaster', 'Fieldmaster', 'Standard']
const STATES = ['NSW', 'QLD', 'VIC', 'SA', 'ACT']
const FUEL_TYPES = ['Petrol', 'Diesel']
const WHEEL_SIZES = ['17"', '18"']

function optionLabel(opt, brandMap) {
  if (opt.brand_id && brandMap[opt.brand_id]) {
    return [brandMap[opt.brand_id].name, opt.model].filter(Boolean).join(' ')
  }
  return opt.brand_model || opt.model || ''
}

// Dropdown with an inline "Add new…" option
function AddableSelect({ value, onChange, items, placeholder, onAdd, className = '' }) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    const id = await onAdd(newName.trim())
    onChange(id)
    setAdding(false)
    setNewName('')
    setSaving(false)
  }

  if (adding) {
    return (
      <div className="flex gap-1">
        <input
          autoFocus
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
            if (e.key === 'Escape') { setAdding(false); setNewName('') }
          }}
          placeholder="Enter name…"
          className={`flex-1 border border-[#1a9fd4] rounded-lg px-2 py-1.5 text-xs outline-none ${className}`}
        />
        <button type="button" onClick={handleAdd} disabled={saving || !newName.trim()}
          className="text-xs bg-[#1a9fd4] text-white px-2.5 py-1.5 rounded-lg disabled:opacity-50 whitespace-nowrap">Add</button>
        <button type="button" onClick={() => { setAdding(false); setNewName('') }}
          className="text-xs text-gray-400 px-1 hover:text-gray-700">✕</button>
      </div>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={e => {
        if (e.target.value === '__add__') { setAdding(true); }
        else onChange(e.target.value)
      }}
      className={`w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white ${className}`}
    >
      <option value="">{placeholder}</option>
      {items.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      <option value="__add__">+ Add new…</option>
    </select>
  )
}

export default function MemberForm({ id, onSave, onCancel }) {
  const isEdit = !!id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', rego: '', state: 'NSW', year: '', model: '', variant: '', fuel: '', wheels: '', colour: '', roof_colour: '' })
  const [categories, setCategories] = useState([])
  const [optionsByCategory, setOptionsByCategory] = useState({})
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [gearSelections, setGearSelections] = useState({})

  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]))

  useEffect(() => {
    async function load() {
      const [cats, opts, brnds, supps] = await Promise.all([getCategories(), getOptions(), getBrands(), getSuppliers()])
      setCategories(cats)
      setBrands(brnds)
      setSuppliers(supps)
      const grouped = {}
      for (const c of cats) grouped[c.id] = opts.filter(o => o.category_id === c.id)
      setOptionsByCategory(grouped)

      if (isEdit) {
        const [m, gearItems] = await Promise.all([getMember(id), getMemberGear(id)])
        if (m) setForm({
          name: m.name, rego: m.rego || '', state: m.state || 'NSW',
          year: m.year || '', model: m.model || '', variant: m.variant || '',
          fuel: m.fuel || '', wheels: m.wheels || '',
          colour: m.colour || '', roof_colour: m.roof_colour || '',
        })
        const sel = {}
        for (const g of gearItems) {
          const opt = opts.find(o => o.id === g.option_id)
          sel[g.category_id] = {
            mode: 'existing', optionId: g.option_id,
            notes: g.notes || '', self_installed: g.self_installed ?? false,
            editBrandId: opt?.brand_id || '',
            editModel: opt?.model || '',
            editSupplierId: opt?.supplier_id || '',
            editUrl: opt?.url || '',
            optionDirty: false,
          }
        }
        setGearSelections(sel)
      }
    }
    load()
  }, [id])

  function setGearFor(categoryId, updates) {
    setGearSelections(s => ({ ...s, [categoryId]: { ...(s[categoryId] || {}), ...updates } }))
  }

  async function handleAddBrand(name) {
    const newId = await addBrand(name)
    setBrands(b => [...b, { id: newId, name }].sort((a, b) => a.name.localeCompare(b.name)))
    return newId
  }

  async function handleAddSupplier(name) {
    const newId = await addSupplier(name)
    setSuppliers(s => [...s, { id: newId, name }].sort((a, b) => a.name.localeCompare(b.name)))
    return newId
  }

  async function handleSaveOptionEdit(catId, optionId) {
    const sel = gearSelections[catId]
    await updateOption(optionId, { brand_id: sel.editBrandId, model: sel.editModel, supplier_id: sel.editSupplierId, url: sel.editUrl })
    setOptionsByCategory(prev => ({
      ...prev,
      [catId]: (prev[catId] || []).map(o =>
        o.id === optionId ? { ...o, brand_id: sel.editBrandId || null, model: sel.editModel?.trim() || null, supplier_id: sel.editSupplierId || null, url: sel.editUrl?.trim() || null } : o
      )
    }))
    setGearFor(catId, { optionDirty: false })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        rego: form.rego.trim().toUpperCase() || null,
        state: form.state || 'NSW',
        year: form.year ? parseInt(form.year) : null,
        model: form.model || null,
        variant: form.variant || null,
        fuel: form.fuel || null,
        wheels: form.wheels || null,
        colour: form.colour || null,
        roof_colour: form.roof_colour || null,
      }

      const memberId = isEdit ? id : await createMember(payload)
      if (isEdit) await updateMember(id, payload)

      for (const [catId, sel] of Object.entries(gearSelections)) {
        if (!sel) continue
        let optionId = sel.optionId

        if (sel.mode === 'new' && (sel.newBrandId || sel.newModel?.trim())) {
          optionId = await addOption(catId, { brand_id: sel.newBrandId, model: sel.newModel, supplier_id: sel.newSupplierId, url: sel.newUrl })
          const newOpt = { id: optionId, category_id: catId, brand_id: sel.newBrandId || null, model: sel.newModel?.trim() || null, supplier_id: sel.newSupplierId || null, url: sel.newUrl?.trim() || null }
          setOptionsByCategory(prev => ({ ...prev, [catId]: [...(prev[catId] || []), newOpt] }))
        }

        if (optionId) {
          await setMemberGearItem(memberId, catId, optionId, { notes: sel.notes, self_installed: sel.self_installed })
        } else {
          await removeMemberGearItem(memberId, catId)
        }
      }

      onSave()
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div>
      <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Profile' : 'Add Your Profile'}</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vehicle details */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Your Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]" placeholder="First name or nickname" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Registration</label>
              <div className="flex gap-2">
                <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={form.rego} onChange={e => setForm(f => ({ ...f, rego: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] font-mono" placeholder="ABC 123" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
              <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                <option value="">Select model</option>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Variant</label>
              <select value={form.variant} onChange={e => setForm(f => ({ ...f, variant: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                <option value="">Select variant</option>
                {VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fuel Type</label>
              <select value={form.fuel} onChange={e => setForm(f => ({ ...f, fuel: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                <option value="">Select fuel type</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Wheel Size</label>
              <select value={form.wheels} onChange={e => setForm(f => ({ ...f, wheels: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white">
                <option value="">Select wheel size</option>
                {WHEEL_SIZES.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <ColourPicker
            value={form.colour} roofValue={form.roof_colour}
            onChange={c => setForm(f => ({ ...f, colour: c }))}
            onRoofChange={c => setForm(f => ({ ...f, roof_colour: c }))}
          />
        </div>

        {/* Gear */}
        {categories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Gear & Accessories</h2>
            <p className="text-xs text-gray-400 mb-4">Select what you have. Can't find yours? Choose "+ Add new option" to add it for everyone.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {categories.map(cat => {
                const options = optionsByCategory[cat.id] || []
                const sel = gearSelections[cat.id] || {}
                const isNew = sel.mode === 'new'
                const hasSelection = isNew ? !!(sel.newBrandId || sel.newModel?.trim()) : !!sel.optionId
                const selectedOption = options.find(o => o.id === sel.optionId)

                return (
                  <div key={cat.id} className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-600">{cat.name}</label>

                    {/* Option selector */}
                    <select
                      value={isNew ? '__new__' : (sel.optionId || '')}
                      onChange={e => {
                        const v = e.target.value
                        if (v === '__new__') setGearFor(cat.id, { mode: 'new', optionId: null })
                        else if (v === '') setGearFor(cat.id, { mode: 'existing', optionId: null })
                        else {
                          const opt = options.find(o => o.id === v)
                          setGearFor(cat.id, {
                            mode: 'existing', optionId: v,
                            editBrandId: opt?.brand_id || '',
                            editModel: opt?.model || '',
                            editSupplierId: opt?.supplier_id || '',
                            editUrl: opt?.url || '',
                            optionDirty: false,
                          })
                        }
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white"
                    >
                      <option value="">— None —</option>
                      {options.map(o => (
                        <option key={o.id} value={o.id}>{optionLabel(o, brandMap)}</option>
                      ))}
                      <option value="__new__">+ Add new option…</option>
                    </select>

                    {/* New option fields */}
                    {isNew && (
                      <div className="pl-2 space-y-2 border-l-2 border-[#1a9fd4]/30">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Brand</p>
                          <AddableSelect
                            value={sel.newBrandId || ''}
                            onChange={v => setGearFor(cat.id, { newBrandId: v })}
                            items={brands}
                            placeholder="Select brand…"
                            onAdd={handleAddBrand}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Model / Description</p>
                          <input placeholder="e.g. Dual Battery Kit" value={sel.newModel || ''}
                            onChange={e => setGearFor(cat.id, { newModel: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Purchased from</p>
                          <AddableSelect
                            value={sel.newSupplierId || ''}
                            onChange={v => setGearFor(cat.id, { newSupplierId: v })}
                            items={suppliers}
                            placeholder="Select supplier…"
                            onAdd={handleAddSupplier}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Product URL</p>
                          <input placeholder="https://…" value={sel.newUrl || ''}
                            onChange={e => setGearFor(cat.id, { newUrl: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
                        </div>
                      </div>
                    )}

                    {/* Existing option fields — always visible when selected */}
                    {!isNew && sel.optionId && (
                      <div className="pl-2 space-y-2 border-l-2 border-gray-200">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Brand</p>
                          <AddableSelect
                            value={sel.editBrandId || ''}
                            onChange={v => setGearFor(cat.id, { editBrandId: v, optionDirty: true })}
                            items={brands}
                            placeholder="Select brand…"
                            onAdd={handleAddBrand}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Model / Description</p>
                          <input placeholder="e.g. Dual Battery Kit" value={sel.editModel || ''}
                            onChange={e => setGearFor(cat.id, { editModel: e.target.value, optionDirty: true })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Purchased from</p>
                          <AddableSelect
                            value={sel.editSupplierId || ''}
                            onChange={v => setGearFor(cat.id, { editSupplierId: v, optionDirty: true })}
                            items={suppliers}
                            placeholder="Select supplier…"
                            onAdd={handleAddSupplier}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Product URL</p>
                          <input placeholder="https://…" value={sel.editUrl || ''}
                            onChange={e => setGearFor(cat.id, { editUrl: e.target.value, optionDirty: true })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]" />
                        </div>
                        {sel.optionDirty && (
                          <div className="flex gap-2 items-center">
                            <button type="button" onClick={() => handleSaveOptionEdit(cat.id, sel.optionId)}
                              className="text-xs text-[#1a9fd4] font-medium hover:underline">Save option changes</button>
                            <span className="text-xs text-gray-400">(updates for all members)</span>
                          </div>
                        )}
                        <button type="button"
                          onClick={async () => {
                            if (!confirm(`Delete this option? This will remove it from all members.`)) return
                            await deleteOption(sel.optionId)
                            setOptionsByCategory(prev => ({ ...prev, [cat.id]: (prev[cat.id] || []).filter(o => o.id !== sel.optionId) }))
                            setGearFor(cat.id, { mode: 'existing', optionId: null })
                          }}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete option</button>
                      </div>
                    )}

                    {/* Self installed + Notes */}
                    {hasSelection && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={sel.self_installed ?? false}
                            onChange={e => setGearFor(cat.id, { self_installed: e.target.checked })}
                            className="rounded border-gray-300 text-[#1a9fd4] focus:ring-[#1a9fd4]" />
                          <span className="text-xs text-gray-600">Self installed</span>
                        </label>
                        <textarea placeholder="Notes or tips… (optional)" value={sel.notes || ''}
                          onChange={e => setGearFor(cat.id, { notes: e.target.value })}
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4] resize-none" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-[#1a9fd4] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1589b8] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Profile'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
