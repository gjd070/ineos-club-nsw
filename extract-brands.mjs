import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { writeFileSync } from 'fs'

const firebaseConfig = {
  apiKey: 'AIzaSyD8sP8gtI2MOIsqY1mKENaJeXobnH1ddKg',
  authDomain: 'ineosnswprofiles.firebaseapp.com',
  projectId: 'ineosnswprofiles',
  storageBucket: 'ineosnswprofiles.firebasestorage.app',
  messagingSenderId: '668726222596',
  appId: '1:668726222596:web:5b7f920c4c2fb98828fa51',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Known multi-word brands (checked first, longest match wins)
const KNOWN_BRANDS = [
  'Old Man Emu', 'TJM', 'ARB', 'Warn', 'Maxtrax', 'Dobinsons',
  'Rhino Rack', 'Thule', 'Garmin', 'Uniden', 'GME', 'Oricom',
  'Engel', 'Waeco', 'National Luna', 'Redarc', 'Victron',
  'iTechworld', 'Projecta', 'Kings', 'Ridge Ryder', 'OzTent',
  'MSA', '4WD Supacentre', 'Tough Dog', 'Ironman 4x4', 'Ironman',
  'Pedders', 'Monroe', 'Bilstein', 'Fox', 'Tuff Terrain',
  'Narva', 'STEDI', 'Lightforce', 'Baja Designs', 'Vision X',
  'Rigid Industries', 'KC HiLiTES', 'KC', 'Lazer', 'Hella',
  'BlackVue', 'Thinkware', 'Nextbase', 'Viofo',
  'Hulk 4x4', 'Runva', 'Comeup', 'Factor 55',
  'Tred', 'Hi-Lift', 'Bushranger', 'Safari', 'Snorkel',
  'Hayman Reese', 'Treg', 'Hitch Safe',
  'National Tyres', 'Cooper Tyres', 'Cooper', 'BF Goodrich',
  'Falken', 'Mickey Thompson', 'Nitto', 'Toyo', 'Maxxis',
  'Yokohama', 'General Tire', 'Pirelli',
  'Method Race Wheels', 'Black Rhino', 'KMC', 'Icon Alloys',
]

function guessBrand(brandModel) {
  if (!brandModel) return { brand: '', model: '' }
  const s = brandModel.trim()

  // Check known multi-word brands first (longest match wins)
  const sorted = [...KNOWN_BRANDS].sort((a, b) => b.length - a.length)
  for (const known of sorted) {
    if (s.toLowerCase().startsWith(known.toLowerCase())) {
      const model = s.slice(known.length).trim()
      return { brand: known, model }
    }
  }

  // Fall back to first word as brand
  const parts = s.split(' ')
  return { brand: parts[0], model: parts.slice(1).join(' ') }
}

const snap = await getDocs(collection(db, 'gear_options'))
const options = snap.docs.map(d => ({ id: d.id, ...d.data() }))

console.log(`Found ${options.length} gear options`)

const rows = [['option_id', 'original_brand_model', 'guessed_brand', 'guessed_model', 'source', 'url']]

for (const opt of options) {
  const raw = opt.brand_model || ''
  const { brand, model } = guessBrand(raw)
  rows.push([
    opt.id,
    raw,
    brand,
    model,
    opt.source || '',
    opt.url || '',
  ])
}

// CSV encode
const csv = rows.map(r => r.map(cell => {
  const s = String(cell)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}).join(',')).join('\n')

writeFileSync('brands-extract.csv', csv)
console.log('Written to brands-extract.csv')
process.exit(0)
