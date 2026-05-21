import { useState } from 'react'
import { login } from '../lib/auth'
import logo from '../assets/logo.png'

export default function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (login(pw)) {
      onAuth()
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-[#1a9fd4] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <img src={logo} alt="INEOS 4x4 Club NSW" className="h-24 w-auto mx-auto mb-6" />
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            placeholder="Club password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            className={`w-full border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a9fd4] ${error ? 'border-red-400' : 'border-gray-200'}`}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">Incorrect password.</p>}
          <button type="submit" className="w-full bg-[#1a9fd4] text-white rounded-lg py-3 text-sm font-semibold hover:bg-[#1589b8] transition-colors">
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
