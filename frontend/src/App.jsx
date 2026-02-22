import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Loads from './pages/Loads'
import LoadDetail from './pages/LoadDetail'
import Trucks from './pages/Trucks'
import Reports from './pages/Reports'

const PrivateRoute = ({ children }) => localStorage.getItem('hc_token') ? children : <Navigate to="/login" />

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
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
