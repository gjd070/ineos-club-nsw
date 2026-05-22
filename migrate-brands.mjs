import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore'
import { readFileSync } from 'fs'

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

// Parse TSV — columns: option_id, original_brand_model, brand, model, source, url
const tsv = readFileSync('/Users/gavindietz/.claude/channels/discord/inbox/1779406915317-1507166552531927162.tsv', 'utf8')
const rows = tsv.split('\n')
  .map(r => r.split('\t').map(c => c.trim()))
  .filter(r => r[0] && r[0] !== 'option_id') // skip blank + header rows

function deriveModel(original, brandName) {
  if (!original) return null
  if (!brandName) return original.trim() || null
  // Remove brand name from the original string (case-insensitive)
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const model = original.replace(new RegExp(escaped, 'i'), '').trim().replace(/^[\s\-–—]+/, '').trim()
  return model || null
}

// Collect unique brand names
const uniqueBrands = [...new Set(rows.map(r => r[2]).filter(Boolean))]
console.log(`Unique brands: ${uniqueBrands.length}`)
console.log(uniqueBrands.join(', '))

// Fetch existing brands from Firestore
const existingSnap = await getDocs(collection(db, 'brands'))
const existingBrands = Object.fromEntries(existingSnap.docs.map(d => [d.data().name, d.id]))

// Create missing brands
const brandIdMap = { ...existingBrands }
for (const name of uniqueBrands) {
  if (brandIdMap[name]) {
    console.log(`Brand exists: ${name} (${brandIdMap[name]})`)
  } else {
    const ref = await addDoc(collection(db, 'brands'), { name })
    brandIdMap[name] = ref.id
    console.log(`Created brand: ${name} (${ref.id})`)
  }
}

// Update each gear_options document
let updated = 0, skipped = 0
for (const row of rows) {
  const [optionId, original, brandName, , ,] = row
  if (!optionId) { skipped++; continue }

  const brand_id = brandName ? (brandIdMap[brandName] || null) : null
  const model = deriveModel(original, brandName)

  await updateDoc(doc(db, 'gear_options', optionId), { brand_id, model })
  console.log(`Updated ${optionId}: brand="${brandName}" model="${model}"`)
  updated++
}

console.log(`\nDone — ${updated} options updated, ${skipped} skipped`)
process.exit(0)
