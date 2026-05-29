import { signInAnonymously, signOut } from 'firebase/auth'
import { auth } from './firebase'

const KEY = 'ineos_auth'
const ADMIN_KEY = 'ineos_admin_auth'
const PASSWORD = import.meta.env.VITE_CLUB_PASSWORD
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

export function isAuthenticated() {
  return sessionStorage.getItem(KEY) === 'true'
}

export async function login(password) {
  if (password === PASSWORD) {
    await signInAnonymously(auth)
    sessionStorage.setItem(KEY, 'true')
    return true
  }
  return false
}

export async function logout() {
  await signOut(auth)
  sessionStorage.removeItem(KEY)
  sessionStorage.removeItem(ADMIN_KEY)
}

export function isAdmin() {
  return sessionStorage.getItem(ADMIN_KEY) === 'true'
}

export function loginAdmin(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, 'true')
    return true
  }
  return false
}
