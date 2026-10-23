import { Activity, CalendarDays, CarFront } from 'lucide-react'
import { Page, Panel } from '../components/ui'
import { useDashboardSummaryQuery } from '../store/api'

export function ReportsPage() {
  const { data: summary, error, isLoading } = useDashboardSummaryQuery()
  const stats = summary ? [
    { label: 'Services completed', value: String(summary.servicesCompletedMonth), note: 'This month', icon: Activity },
    { label: 'Bookings today', value: String(summary.bookingsToday.total), note: `${summary.bookingsToday.confirmed} confirmed`, icon: CalendarDays },
    { label: 'Registered vehicles', value: String(summary.registeredVehicles), note: 'In your service center', icon: CarFront },
  ] : []

  return <Page title="Reports" subtitle="Service activity from your records.">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(({ label, value, note, icon: Icon }) => <div key={label} className="rounded-2xl border bg-white p-5"><Icon size={18} className="text-blue-600" /><p className="mt-4 text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p><p className="mt-1 text-[11px] text-slate-400">{note}</p></div>)}</div>
    <Panel className="mt-6"><h2 className="mb-1 text-sm font-extrabold">Service activity</h2><p className="text-xs text-slate-400">Completed services and current bookings.</p>{isLoading && <p className="mt-4 text-xs text-slate-400">Loading reports…</p>}{error && <p role="alert" className="mt-4 text-xs text-rose-600">Unable to load reports.</p>}</Panel>
  </Page>
}
