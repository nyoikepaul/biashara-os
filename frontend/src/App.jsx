
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './lib/store'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import RetailPage from './pages/retail/RetailPage'
import PayrollPage from './pages/payroll/PayrollPage'
import RentalsPage from './pages/rentals/RentalsPage'
import SchoolsPage from './pages/schools/SchoolsPage'
import InventoryPage from './pages/inventory/InventoryPage'
import CRMPage from './pages/crm/CRMPage'
import FinancePage from './pages/finance/FinancePage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
 
function Guard({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}
 
export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index              element={<Dashboard />} />
        <Route path="retail/*"    element={<RetailPage />} />
        <Route path="payroll/*"   element={<PayrollPage />} />
        <Route path="hr/*"        element={<PayrollPage />} />
        <Route path="rentals/*"   element={<RentalsPage />} />
        <Route path="schools/*"   element={<SchoolsPage />} />
        <Route path="inventory/*" element={<InventoryPage />} />
        <Route path="crm/*"       element={<CRMPage />} />
        <Route path="finance/*"   element={<FinancePage />} />
        <Route path="reports/*"   element={<ReportsPage />} />
        <Route path="settings/*"  element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
