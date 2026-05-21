const KEY = 'ineos_auth'
const PASSWORD = import.meta.env.VITE_CLUB_PASSWORD

export function isAuthenticated() {
  return sessionStorage.getItem(KEY) === 'true'
}

export function login(password) {
  if (password === PASSWORD) {
    sessionStorage.setItem(KEY, 'true')
    return true
  }
  return false
}

export function logout() {
  sessionStorage.removeItem(KEY)
}
