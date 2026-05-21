import { useEffect, useState } from 'react'
import { getMember, getMemberGear, deleteMember, getOptions, getCategories } from '../lib/db'
import { ColourDot } from '../components/ColourSwatch'

export default function MemberDetail({ id, onEdit, onBack }) {
  const [member, setMember] = useState(null)
  const [gear, setGear] = useState([])   // [{ category, option }]
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [m, gearItems, cats, opts] = await Promise.all([
        getMember(id),
        getMemberGear(id),
        getCategories(),
        getOptions(),
      ])
      setMember(m)
      const catMap = Object.fromEntries(cats.map(c => [c.id, c]))
      const optMap = Object.fromEntries(opts.map(o => [o.id, o]))
      setGear(
        gearItems
          .map(g => ({ category: catMap[g.category_id], option: optMap[g.option_id] }))
          .filter(g => g.category && g.option)
          .sort((a, b) => (a.category.display_order ?? 0) - (b.category.display_order ?? 0))
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

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
            {member.year && <p className="text-gray-500">{member.year} Grenadier</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(id)} className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
            <button onClick={handleDelete} className="text-sm px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
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
              <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-sm">{member.rego}</span>
            </div>
          )}
        </div>
      </div>

      {gear.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Gear & Accessories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gear.map((g, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{g.category.name}</p>
                <p className="text-sm font-medium text-gray-900">{g.option.brand_model}</p>
                {g.option.source && <p className="text-xs text-gray-500 mt-0.5">From: {g.option.source}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">No gear listed yet. <button onClick={() => onEdit(id)} className="text-gray-700 underline">Add gear →</button></p>
      )}
    </div>
  )
}
