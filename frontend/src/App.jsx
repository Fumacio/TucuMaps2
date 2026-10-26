import { Navigate, Route, Routes } from 'react-router-dom'
import BarraInferior from './components/BarraInferior.jsx'
import Agenda from './pages/Agenda.jsx'
import VistaMapa from './pages/VistaMapa.jsx'

function App() {
  return (
    <div className="app">
      <main className="app__contenido">
        <Routes>
          <Route path="/" element={<VistaMapa />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BarraInferior />
    </div>
  )
}

export default App
