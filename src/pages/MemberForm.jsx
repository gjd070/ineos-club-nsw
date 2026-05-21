import { useEffect, useState } from 'react'
import { getMember, createMember, updateMember, getCategories, getOptions,
         addOption, setMemberGearItem, removeMemberGearItem, getMemberGear } from '../lib/db'
import { ColourPicker } from '../components/ColourSwatch'

const YEARS = Array.from({ length: 8 }, (_, i) => 2022 + i)

export default function MemberForm({ id, onSave, onCancel }) {
  const isEdit = !!id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', rego: '', year: '', colour: '', roof_colour: '' })
  const [categories, setCategories] = useState([])
  const [optionsByCategory, setOptionsByCategory] = useState({})
  const [gearSelections, setGearSelections] = useState({})

  useEffect(() => {
    async function load() {
      const [cats, opts] = await Promise.all([getCategories(), getOptions()])
      setCategories(cats)
      const grouped = {}
      for (const c of cats) grouped[c.id] = opts.filter(o => o.category_id === c.id)
      setOptionsByCategory(grouped)

      if (isEdit) {
        const [m, gearItems] = await Promise.all([getMember(id), getMemberGear(id)])
        if (m) setForm({ name: m.name, rego: m.rego || '', year: m.year || '', colour: m.colour || '', roof_colour: m.roof_colour || '' })
        const sel = {}
        for (const g of gearItems) sel[g.category_id] = { mode: 'existing', optionId: g.option_id }
        setGearSelections(sel)
      }
    }
    load()
  }, [id])

  function setGearFor(categoryId, updates) {
    setGearSelections(s => ({ ...s, [categoryId]: { ...(s[categoryId] || {}), ...updates } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        rego: form.rego.trim().toUpperCase() || null,
        year: form.year ? parseInt(form.year) : null,
        colour: form.colour || null,
        roof_colour: form.roof_colour || null,
      }

      const memberId = isEdit ? id : await createMember(payload)
      if (isEdit) await updateMember(id, payload)

      for (const [catId, sel] of Object.entries(gearSelections)) {
        if (!sel) continue
        let optionId = sel.optionId

        if (sel.mode === 'new' && sel.newBrandModel?.trim()) {
          optionId = await addOption(catId, sel.newBrandModel, sel.newSource)
          // Add to local options list so re-renders show it
          setOptionsByCategory(prev => ({
            ...prev,
            [catId]: [...(prev[catId] || []), { id: optionId, category_id: catId, brand_model: sel.newBrandModel.trim(), source: sel.newSource?.trim() || null }]
          }))
        }

        if (optionId) {
          await setMemberGearItem(memberId, catId, optionId)
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Your Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
              <input
                required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4]"
                placeholder="First name or nickname"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Registration</label>
              <input
                value={form.rego}
                onChange={e => setForm(f => ({ ...f, rego: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] font-mono"
                placeholder="ABC 123"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <select
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white"
              >
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <ColourPicker
            value={form.colour} roofValue={form.roof_colour}
            onChange={c => setForm(f => ({ ...f, colour: c }))}
            onRoofChange={c => setForm(f => ({ ...f, roof_colour: c }))}
          />
        </div>

        {categories.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Gear & Accessories</h2>
            <p className="text-xs text-gray-400 mb-4">Select what you have. Can't find yours? Choose "+ Add new" to add it for everyone.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map(cat => {
                const options = optionsByCategory[cat.id] || []
                const sel = gearSelections[cat.id] || {}
                const isNew = sel.mode === 'new'
                return (
                  <div key={cat.id} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">{cat.name}</label>
                    <select
                      value={isNew ? '__new__' : (sel.optionId || '')}
                      onChange={e => {
                        const v = e.target.value
                        if (v === '__new__') setGearFor(cat.id, { mode: 'new', optionId: null })
                        else if (v === '') setGearFor(cat.id, { mode: 'existing', optionId: null })
                        else setGearFor(cat.id, { mode: 'existing', optionId: v })
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] bg-white"
                    >
                      <option value="">— None —</option>
                      {options.map(o => (
                        <option key={o.id} value={o.id}>{o.brand_model}{o.source ? ` (${o.source})` : ''}</option>
                      ))}
                      <option value="__new__">+ Add new option…</option>
                    </select>
                    {isNew && (
                      <div className="pl-2 space-y-1 border-l-2 border-[#1a9fd4]/30">
                        <input
                          placeholder="Brand / Model / Description *"
                          value={sel.newBrandModel || ''}
                          onChange={e => setGearFor(cat.id, { newBrandModel: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]"
                        />
                        <input
                          placeholder="Where to get it (optional)"
                          value={sel.newSource || ''}
                          onChange={e => setGearFor(cat.id, { newSource: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#1a9fd4]"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-[#1a9fd4] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1589b8] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Profile'}
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
