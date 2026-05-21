import { INEOS_COLOURS } from '../lib/colours'

export function ColourDot({ name, size = 'md' }) {
  const colour = INEOS_COLOURS.find(c => c.name === name)
  if (!colour) return null
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'
  return (
    <span
      className={`${sz} rounded-full inline-block border border-black/10 flex-shrink-0`}
      style={{ background: colour.hex }}
      title={colour.name}
    />
  )
}

export function ColourPicker({ value, roofValue, onChange, onRoofChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Body Colour</label>
        <div className="flex flex-wrap gap-2">
          {INEOS_COLOURS.map(c => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => onChange(c.name)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${value === c.name ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:border-gray-400'}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
        {value && <p className="text-xs text-gray-500 mt-1">{value}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Roof Colour <span className="font-normal">(optional — if contrast roof)</span></label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onRoofChange('')}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-gray-400 text-xs transition-all ${!roofValue ? 'border-gray-900 bg-gray-100' : 'border-transparent hover:border-gray-400 bg-gray-100'}`}
            title="Same as body"
          >—</button>
          {INEOS_COLOURS.map(c => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => onRoofChange(c.name)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${roofValue === c.name ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:border-gray-400'}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
        {roofValue && <p className="text-xs text-gray-500 mt-1">{roofValue} roof</p>}
      </div>
    </div>
  )
}
