import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  setDoc, query, where, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Members ────────────────────────────────────────────
export async function getMembers() {
  const snap = await getDocs(query(collection(db, 'members'), orderBy('name')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getMember(id) {
  const snap = await getDoc(doc(db, 'members', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createMember(data) {
  const ref = await addDoc(collection(db, 'members'), { ...data, created_at: serverTimestamp() })
  return ref.id
}

export async function updateMember(id, data) {
  await updateDoc(doc(db, 'members', id), data)
}

export async function deleteMember(id) {
  // delete gear first
  const gearSnap = await getDocs(query(collection(db, 'member_gear'), where('member_id', '==', id)))
  await Promise.all(gearSnap.docs.map(d => deleteDoc(d.ref)))
  await deleteDoc(doc(db, 'members', id))
}

// ── Gear categories ────────────────────────────────────
export async function getCategories() {
  const snap = await getDocs(query(collection(db, 'gear_categories'), orderBy('display_order'), orderBy('name')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Gear options ───────────────────────────────────────
export async function getOptions() {
  const snap = await getDocs(query(collection(db, 'gear_options'), orderBy('brand_model')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addOption(category_id, brand_model, source) {
  const ref = await addDoc(collection(db, 'gear_options'), {
    category_id, brand_model: brand_model.trim(), source: source?.trim() || null,
    created_at: serverTimestamp(),
  })
  return ref.id
}

// ── Member gear ────────────────────────────────────────
export async function getMemberGear(member_id) {
  const snap = await getDocs(query(collection(db, 'member_gear'), where('member_id', '==', member_id)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getGearByCategory(category_id) {
  const snap = await getDocs(query(collection(db, 'member_gear'), where('category_id', '==', category_id)))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function setMemberGearItem(member_id, category_id, option_id) {
  // Use deterministic ID so upsert works
  const id = `${member_id}_${category_id}`
  await setDoc(doc(db, 'member_gear', id), { member_id, category_id, option_id })
}

export async function removeMemberGearItem(member_id, category_id) {
  const id = `${member_id}_${category_id}`
  await deleteDoc(doc(db, 'member_gear', id))
}
