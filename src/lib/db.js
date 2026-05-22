import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  setDoc, query, where, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

// ── Members ────────────────────────────────────────────
export async function getMembers() {
  const snap = await getDocs(collection(db, 'members'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
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
  const gearSnap = await getDocs(query(collection(db, 'member_gear'), where('member_id', '==', id)))
  await Promise.all(gearSnap.docs.map(d => deleteDoc(d.ref)))
  await deleteDoc(doc(db, 'members', id))
}

// ── Gear categories ────────────────────────────────────
export async function getCategories() {
  const snap = await getDocs(collection(db, 'gear_categories'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
}

export async function addCategory(name, display_order) {
  await addDoc(collection(db, 'gear_categories'), { name: name.trim(), display_order })
}

export async function updateCategory(id, name) {
  await updateDoc(doc(db, 'gear_categories', id), { name: name.trim() })
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, 'gear_categories', id))
}

// ── Brands ─────────────────────────────────────────────
export async function getBrands() {
  const snap = await getDocs(collection(db, 'brands'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}

export async function addBrand(name) {
  const ref = await addDoc(collection(db, 'brands'), { name: name.trim() })
  return ref.id
}

export async function updateBrand(id, name) {
  await updateDoc(doc(db, 'brands', id), { name: name.trim() })
}

export async function deleteBrand(id) {
  await deleteDoc(doc(db, 'brands', id))
}

// ── Suppliers ──────────────────────────────────────────
export async function getSuppliers() {
  const snap = await getDocs(collection(db, 'suppliers'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}

export async function addSupplier(name) {
  const ref = await addDoc(collection(db, 'suppliers'), { name: name.trim() })
  return ref.id
}

export async function updateSupplier(id, name) {
  await updateDoc(doc(db, 'suppliers', id), { name: name.trim() })
}

export async function deleteSupplier(id) {
  await deleteDoc(doc(db, 'suppliers', id))
}

// ── Gear options ───────────────────────────────────────
export async function getOptions() {
  const snap = await getDocs(collection(db, 'gear_options'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aLabel = a.model || a.brand_model || ''
      const bLabel = b.model || b.brand_model || ''
      return aLabel.localeCompare(bLabel)
    })
}

export async function addOption(category_id, { brand_id, model, supplier_id, url }) {
  const ref = await addDoc(collection(db, 'gear_options'), {
    category_id,
    brand_id: brand_id || null,
    model: model?.trim() || null,
    supplier_id: supplier_id || null,
    url: url?.trim() || null,
    created_at: serverTimestamp(),
  })
  return ref.id
}

export async function updateOption(id, { brand_id, model, supplier_id, url }) {
  await updateDoc(doc(db, 'gear_options', id), {
    brand_id: brand_id || null,
    model: model?.trim() || null,
    supplier_id: supplier_id || null,
    url: url?.trim() || null,
  })
}

export async function deleteOption(id) {
  const gearSnap = await getDocs(query(collection(db, 'member_gear'), where('option_id', '==', id)))
  await Promise.all(gearSnap.docs.map(d => deleteDoc(d.ref)))
  await deleteDoc(doc(db, 'gear_options', id))
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

export async function getAllMemberGear() {
  const snap = await getDocs(collection(db, 'member_gear'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function setMemberGearItem(member_id, category_id, option_id, { notes, self_installed } = {}) {
  const id = `${member_id}_${category_id}`
  await setDoc(doc(db, 'member_gear', id), {
    member_id, category_id, option_id,
    notes: notes?.trim() || null,
    self_installed: self_installed ?? false,
  })
}

export async function removeMemberGearItem(member_id, category_id) {
  const id = `${member_id}_${category_id}`
  await deleteDoc(doc(db, 'member_gear', id))
}

// ── Articles ───────────────────────────────────────────
export async function getArticles() {
  const snap = await getDocs(collection(db, 'articles'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.created_at?.seconds ?? 0) - (a.created_at?.seconds ?? 0))
}

export async function getArticle(id) {
  const snap = await getDoc(doc(db, 'articles', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createArticle(data) {
  const ref = await addDoc(collection(db, 'articles'), { ...data, created_at: serverTimestamp() })
  return ref.id
}

export async function updateArticle(id, data) {
  await updateDoc(doc(db, 'articles', id), { ...data, updated_at: serverTimestamp() })
}

export async function deleteArticle(id) {
  await deleteDoc(doc(db, 'articles', id))
}

// ── Image upload ───────────────────────────────────────
export async function uploadArticleImage(file) {
  const path = `articles/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return { url: await getDownloadURL(storageRef), path }
}

export async function deleteArticleImage(path) {
  await deleteObject(ref(storage, path)).catch(() => {})
}
