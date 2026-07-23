import { HashRouter, Route, Routes } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { QCForm } from './pages/QCForm'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inspection/:id" element={<QCForm />} />
      </Routes>
    </HashRouter>
  )
}
