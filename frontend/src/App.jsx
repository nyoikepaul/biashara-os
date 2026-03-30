import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/store'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import RetailPage from './pages/retail/RetailPage'
import PayrollPage from './pages/payroll/PayrollPage'
import RentalsPage from './pages/rentals/RentalsPage'
import SchoolsPage from './pages/schools/SchoolsPage'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="retail/*" element={<RetailPage />} />
        <Route path="payroll/*" element={<PayrollPage />} />
        <Route path="rentals/*" element={<RentalsPage />} />
        <Route path="schools/*" element={<SchoolsPage />} />
      </Route>
    </Routes>
  )
}
