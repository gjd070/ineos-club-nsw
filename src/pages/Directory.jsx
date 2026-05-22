import { useEffect, useState } from 'react'
import { getMembers } from '../lib/db'
import { ColourDot } from '../components/ColourSwatch'
import PlateChip from '../components/PlateChip'

export default function Directory({ onSelect, onAdd }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMembers().then(data => { setMembers(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
        <button onClick={onAdd} className="bg-[#1a9fd4] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1589b8] transition-colors">
          + Add Profile
        </button>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-[#1a9fd4] hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-semibold text-gray-900 text-lg">{m.name}</span>
              <div className="flex gap-1 items-center mt-1">
                {m.colour && <ColourDot name={m.colour} />}
                {m.roof_colour && m.roof_colour !== m.colour && <ColourDot name={m.roof_colour} size="sm" />}
              </div>
            </div>
            <div className="text-sm text-gray-500 space-y-0.5">
              {(m.year || m.model) && <div>{[m.year, m.model ? `Ineos ${m.model}` : null, m.variant].filter(Boolean).join(' ')}</div>}
              {m.colour && <div>{m.colour}{m.roof_colour ? ` / ${m.roof_colour} roof` : ''}</div>}
              {m.rego && <div className="mt-1"><PlateChip rego={m.rego} state={m.state} /></div>}
            </div>
          </button>
        ))}
      </div>

      {!loading && members.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No members yet.</p>
          <p className="text-sm mt-1">Be the first to add your profile.</p>
        </div>
      )}
    </div>
  )
}
