import { type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Page } from '../components/ui'
import { WorkspaceLayout } from '../layouts/WorkspaceLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { BookingsPage } from '../pages/BookingsPage'
import { RemindersPage } from '../pages/RemindersPage'
import { ReportsPage } from '../pages/ReportsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { LoginPage } from '../pages/LoginPage'
import { BookingConfirmation, PublicBooking } from '../pages/PublicBooking'
import CustomersPage from '../pages/CustomersPage'
import VehiclesPage from '../pages/VehiclesPage'
import NewVehiclePage from '../pages/NewVehiclePage'
import VehicleDetailPage from '../pages/VehicleDetailPage'
import EditVehiclePage from '../pages/EditVehiclePage'
import StaffPage from '../pages/StaffPage'
import ReceptionistDashboardPage from '../pages/ReceptionistDashboardPage'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { signOut } from '../store/authSlice'

function RoleGate({ role, allowed, children }: { role: string; allowed: string[]; children: ReactNode }) {
  return allowed.includes(role) ? <>{children}</> : <Page title="Access restricted" subtitle="Your staff role does not have access to this section. Contact an administrator if you need access." />
}

export function AppRouter() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const role = useAppSelector(state => state.auth.role) ?? ''

  return <Routes>
    <Route path="/login" element={role ? <Navigate to="/" replace /> : <LoginPage />} />
    <Route path="/book" element={role === 'ADMIN' ? <Navigate to="/" replace /> : <PublicBooking />} />
    <Route path="/confirmation" element={<BookingConfirmation />} />
    <Route path="/" element={role ? <WorkspaceLayout role={role} onSignOut={() => dispatch(signOut())} /> : <Navigate to="/login" replace state={{ from: location.pathname }} />}>
      <Route index element={role === 'ADMIN' ? <DashboardPage /> : <ReceptionistDashboardPage />} />
      <Route path="bookings" element={<RoleGate role={role} allowed={['ADMIN', 'RECEPTIONIST']}><BookingsPage allowCreate={role === 'RECEPTIONIST'} /></RoleGate>} />
      <Route path="customers" element={<RoleGate role={role} allowed={['ADMIN', 'RECEPTIONIST']}><CustomersPage /></RoleGate>} />
      <Route path="vehicles" element={<RoleGate role={role} allowed={['ADMIN', 'RECEPTIONIST']}><VehiclesPage /></RoleGate>} />
      <Route path="vehicles/new" element={<RoleGate role={role} allowed={['ADMIN', 'RECEPTIONIST']}><NewVehiclePage /></RoleGate>} />
      <Route path="vehicles/:id/edit" element={<RoleGate role={role} allowed={['ADMIN', 'RECEPTIONIST']}><EditVehiclePage /></RoleGate>} />
      <Route path="vehicles/:id" element={<RoleGate role={role} allowed={['ADMIN', 'RECEPTIONIST']}><VehicleDetailPage /></RoleGate>} />
      <Route path="reminders" element={<RoleGate role={role} allowed={['ADMIN', 'RECEPTIONIST']}><RemindersPage /></RoleGate>} />
      <Route path="staff" element={<RoleGate role={role} allowed={['ADMIN']}><StaffPage /></RoleGate>} />
      <Route path="reports" element={<RoleGate role={role} allowed={['ADMIN']}><ReportsPage /></RoleGate>} />
      <Route path="settings" element={<RoleGate role={role} allowed={['ADMIN']}><SettingsPage /></RoleGate>} />
      <Route path="*" element={<Page title="Page not found" subtitle="This workspace page is not available." />} />
    </Route>
  </Routes>
}
