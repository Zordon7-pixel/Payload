import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Loads from './pages/Loads'
import LoadDetail from './pages/LoadDetail'
import Trucks from './pages/Trucks'
import Reports from './pages/Reports'
import Drivers from './pages/Drivers'
import Maintenance from './pages/Maintenance'
import Team from './pages/Team'
import MyLoads from './pages/MyLoads'
import Logbook from './pages/Logbook'

const PrivateRoute = ({ children }) => localStorage.getItem('hc_token') ? children : <Navigate to="/login" />

const OwnerRoute = ({ children }) => {
  if (!localStorage.getItem('hc_token')) return <Navigate to="/login" />
  try {
    const role = JSON.parse(atob(localStorage.getItem('hc_token').split('.')[1])).role
    if (!['owner','owner_operator'].includes(role)) return <Navigate to="/my-loads" />
  } catch {}
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="loads" element={<Loads />} />
          <Route path="loads/:id" element={<LoadDetail />} />
          <Route path="trucks" element={<Trucks />} />
          <Route path="drivers" element={<OwnerRoute><Drivers /></OwnerRoute>} />
          <Route path="maintenance" element={<OwnerRoute><Maintenance /></OwnerRoute>} />
          <Route path="reports" element={<OwnerRoute><Reports /></OwnerRoute>} />
          <Route path="team" element={<OwnerRoute><Team /></OwnerRoute>} />
          <Route path="logbook" element={<Logbook />} />
        </Route>
        <Route path="/my-loads" element={<PrivateRoute><MyLoads /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
