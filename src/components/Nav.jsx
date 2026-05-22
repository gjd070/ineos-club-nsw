import logo from '../assets/logo.png'
import { logout } from '../lib/auth'

export default function Nav({ page, onNav }) {
  const link = (p, label) => (
    <button
      onClick={() => onNav(p)}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
        page === p ? 'bg-[#1a9fd4] text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => onNav('directory')} className="flex items-center gap-2">
          <img src={logo} alt="INEOS 4x4 Club NSW" className="h-9 w-auto" />
        </button>
        <nav className="flex items-center gap-1">
          {link('directory', 'Members')}
          {link('search', 'Parts Search')}
          {link('settings', 'Settings')}
          <button
            onClick={() => { logout(); window.location.reload() }}
            className="text-sm text-gray-400 hover:text-gray-700 ml-2 px-2"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  )
}
