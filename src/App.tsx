import { HashRouter, Route, Routes } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { QCForm } from './pages/QCForm'

// Without this, the browser's own scroll restoration tries to put the
// Dashboard back wherever it was last scrolled to whenever you return to
// it (e.g. after saving a case) — which has nothing to do with where the
// case you were just working on actually is in the (possibly reordered)
// list. Dashboard.tsx explicitly scrolls to top on mount instead; this
// stops the browser from fighting that.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

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
