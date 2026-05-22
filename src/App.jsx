import { useState } from 'react'
import { isAuthenticated } from './lib/auth'
import PasswordGate from './components/PasswordGate'
import Nav from './components/Nav'
import Directory from './pages/Directory'
import MemberForm from './pages/MemberForm'
import MemberDetail from './pages/MemberDetail'
import PartsSearch from './pages/PartsSearch'
import Settings from './pages/Settings'

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [page, setPage] = useState('directory')
  const [selectedId, setSelectedId] = useState(null)

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  function nav(p, id = null) {
    setPage(p)
    setSelectedId(id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav page={page} onNav={nav} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {page === 'directory' && <Directory onSelect={id => nav('detail', id)} onAdd={() => nav('add')} />}
        {page === 'detail'    && <MemberDetail id={selectedId} onEdit={id => nav('edit', id)} onBack={() => nav('directory')} />}
        {page === 'add'       && <MemberForm onSave={() => nav('directory')} onCancel={() => nav('directory')} />}
        {page === 'edit'      && <MemberForm id={selectedId} onSave={() => nav('detail', selectedId)} onCancel={() => nav('detail', selectedId)} />}
        {page === 'search'    && <PartsSearch onSelectMember={id => nav('detail', id)} />}
        {page === 'settings'    && <Settings onBack={() => nav('directory')} />}
      </main>
    </div>
  )
}
