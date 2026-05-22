import { useEffect, useState } from 'react'
import { getMember, getMemberGear, deleteMember, getOptions, getCategories, getBrands, getSuppliers } from '../lib/db'
import { ColourDot } from '../components/ColourSwatch'
import PlateChip from '../components/PlateChip'

function optionLabel(opt, brandMap) {
  if (opt.brand_id && brandMap[opt.brand_id]) {
    return [brandMap[opt.brand_id].name, opt.model].filter(Boolean).join(' ')
  }
  return opt.brand_model || opt.model || ''
}

export default function MemberDetail({ id, onEdit, onBack }) {
  const [member, setMember] = useState(null)
  const [gear, setGear] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [m, gearItems, cats, opts, brands, suppliers] = await Promise.all([
        getMember(id),
        getMemberGear(id),
        getCategories(),
        getOptions(),
        getBrands(),
        getSuppliers(),
      ])
      setMember(m)
      const catMap = Object.fromEntries(cats.map(c => [c.id, c]))
      const optMap = Object.fromEntries(opts.map(o => [o.id, o]))
      const brandMap = Object.fromEntries(brands.map(b => [b.id, b]))
      const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s]))
      setGear(
        gearItems
          .map(g => ({
            category: catMap[g.category_id],
            option: optMap[g.option_id],
            notes: g.notes,
            self_installed: g.self_installed,
            brandMap,
            supplierMap,
          }))
          .filter(g => g.category && g.option)
          .sort((a, b) => a.category.name.localeCompare(b.category.name))
      )
      setLoading(false)
    }
    load()
  }, [id])

  async function handleDelete() {
    if (!confirm(`Delete ${member?.name}'s profile?`)) return
    await deleteMember(id)
    onBack()
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (!member) return <p className="text-red-400 text-sm">Member not found.</p>

  return (
    <div>
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1">← Back</button>

      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
            {(member.year || member.model) && (
              <p className="text-gray-500">{[member.year, member.model ? `Ineos ${member.model}` : null, member.variant].filter(Boolean).join(' ')}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(id)} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
            <button onClick={handleDelete} className="text-sm px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {member.colour && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Colour</p>
              <div className="flex items-center gap-2">
                <ColourDot name={member.colour} />
                <span className="text-gray-700">{member.colour}</span>
              </div>
            </div>
          )}
          {member.roof_colour && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Roof</p>
              <div className="flex items-center gap-2">
                <ColourDot name={member.roof_colour} />
                <span className="text-gray-700">{member.roof_colour}</span>
              </div>
            </div>
          )}
          {member.rego && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Rego</p>
              <PlateChip rego={member.rego} state={member.state} />
            </div>
          )}
          {member.fuel && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Fuel</p>
              <span className="text-gray-700">{member.fuel}</span>
            </div>
          )}
          {member.wheels && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Wheels</p>
              <span className="text-gray-700">{member.wheels}"</span>
            </div>
          )}
        </div>
      </div>

      {gear.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Gear & Accessories</h2>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
            {gear.map((g, i) => {
              const label = optionLabel(g.option, g.brandMap)
              const supplier = g.option.supplier_id && g.supplierMap[g.option.supplier_id]
                ? g.supplierMap[g.option.supplier_id].name
                : g.option.source || null
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{g.category.name}</p>
                      <p className="text-sm font-medium text-gray-900">{label || '—'}</p>
                    </div>
                    {g.self_installed && (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap">Self installed</span>
                    )}
                  </div>
                  {(supplier || g.option.url || g.notes) && (
                    <div className="mt-1.5 space-y-0.5">
                      {supplier && <p className="text-xs text-gray-500">Purchased from: {supplier}</p>}
                      {g.option.url && (
                        <a href={g.option.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1a9fd4] hover:underline block">View product ↗</a>
                      )}
                      {g.notes && <p className="text-xs text-gray-600 italic">{g.notes}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No gear listed yet. <button onClick={() => onEdit(id)} className="text-gray-700 underline">Add gear →</button></p>
      )}
    </div>
  )
}
