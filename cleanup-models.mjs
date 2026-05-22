import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore'

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

const [optSnap, brandSnap] = await Promise.all([
  getDocs(collection(db, 'gear_options')),
  getDocs(collection(db, 'brands')),
])

const brandMap = Object.fromEntries(brandSnap.docs.map(d => [d.id, d.data().name]))
let cleaned = 0

for (const d of optSnap.docs) {
  const opt = d.data()
  if (!opt.brand_id || !opt.model) continue
  const brandName = brandMap[opt.brand_id] || ''
  // Clear model if it equals or is contained within the brand name
  if (opt.model.toLowerCase() === brandName.toLowerCase() ||
      brandName.toLowerCase().includes(opt.model.toLowerCase())) {
    await updateDoc(doc(db, 'gear_options', d.id), { model: null })
    console.log(`Cleared model "${opt.model}" from ${d.id} (brand: ${brandName})`)
    cleaned++
  }
}

console.log(`\nCleaned ${cleaned} options`)
process.exit(0)
