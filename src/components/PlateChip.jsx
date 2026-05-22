const STATE_STYLES = {
  NSW: { strip: 'bg-yellow-400', stripText: 'text-gray-900', border: 'border-gray-800' },
  QLD: { strip: 'bg-[#6d1f2e]',  stripText: 'text-white',    border: 'border-[#6d1f2e]' },
  VIC: { strip: 'bg-[#003087]',  stripText: 'text-white',    border: 'border-[#003087]' },
  SA:  { strip: 'bg-[#2b6e3f]',  stripText: 'text-white',    border: 'border-[#2b6e3f]' },
  ACT: { strip: 'bg-[#005a8e]',  stripText: 'text-white',    border: 'border-[#005a8e]' },
}

export default function PlateChip({ rego, state = 'NSW' }) {
  if (!rego) return null
  const s = STATE_STYLES[state] || STATE_STYLES.NSW
  return (
    <div className={`inline-flex items-stretch rounded overflow-hidden border ${s.border} text-xs font-bold shadow-sm`}>
      <div className={`${s.strip} px-1 flex items-center justify-center`}>
        <span className={`text-[8px] font-black ${s.stripText} leading-none`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em' }}>{state}</span>
      </div>
      <div className="bg-white px-2.5 py-1 text-gray-900 font-black tracking-widest uppercase" style={{ fontFamily: 'monospace', letterSpacing: '0.15em' }}>
        {rego}
      </div>
    </div>
  )
}
