import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

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

const categories = [
  'Raised Air Intake', 'Bull Bar', 'Brush Bars', 'Side Steps', 'Roof Rack',
  'Starlink', 'Rear Door Table', 'Seat Covers', 'UHF Radio', 'UHF Aerial',
  'Dashcam', 'Camp Battery', 'Solar', 'Rear Windows', 'Camp Lights',
  'Rear Shelf', 'Rear Interior Sides', 'Wrap / Protection Film',
]

for (let i = 0; i < categories.length; i++) {
  await addDoc(collection(db, 'gear_categories'), { name: categories[i], display_order: i + 1 })
  console.log('Added:', categories[i])
}

console.log('Done!')
process.exit(0)
