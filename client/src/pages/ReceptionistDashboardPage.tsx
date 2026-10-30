import { Link } from 'react-router-dom'
import { Activity, ArrowRight, CalendarDays, Plus } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useBookingsQuery, useDashboardSummaryQuery } from '../store/api'
import type { Booking } from '../store/api'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const statusLabel = (status: Booking['status']) => status === 'COMPLETED' ? 'Completed' : 'Pending'

export default function ReceptionistDashboardPage() {
  const { data: bookings = [], error, isLoading } = useBookingsQuery()
  const { data: summary, error: summaryError } = useDashboardSummaryQuery()
  const todayBookings = bookings.filter(booking => booking.booking_date === today())
  const completedToday = todayBookings.filter(booking => booking.status === 'COMPLETED').length
  const pendingServices = todayBookings.filter(booking => booking.status !== 'COMPLETED').length
  return <Page title="" subtitle="">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-sm font-bold text-[#262b33]">Service overview</h2><p className="mt-1 text-xs text-slate-500">Choose a card to open its workspace.</p></div>

    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Metric to="/bookings" tone="blue" label="Service requests today" value={todayBookings.length} note={`${summary?.bookingsToday.confirmed ?? 0} confirmed · ${summary?.bookingsToday.completed ?? 0} completed`} />
      <Metric to="/bookings" tone="green" label="Services completed today" value={completedToday} note="Completed today" icon={Activity} />
      <Metric to="/bookings" tone="amber" label="Pending services" value={pendingServices} note="Confirmed for today" icon={CalendarDays} />
    </div>

    <Panel className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">      <div><h2 className="text-sm font-extrabold">Today’s service requests</h2><p className="mt-1 text-xs text-slate-500">Your schedule, sorted by appointment time.</p></div><Link to="/bookings" className="inline-flex items-center gap-1 text-xs font-bold text-[#b94f1e] hover:text-[#843712]">View all service requests <ArrowRight size={14} /></Link></div>
      {todayBookings.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Time', 'Customer', 'Vehicle', 'Service', 'Status'].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{[...todayBookings].sort((a, b) => a.slot_start.localeCompare(b.slot_start)).map(booking => <tr key={booking.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs font-bold text-blue-800">{booking.slot_start.slice(0, 5)}</td><td className="pr-3 text-xs font-semibold">{booking.customer_name}<small className="block font-normal text-slate-400">{booking.customer_phone}</small></td><td className="pr-3 text-xs">{booking.reg_number} · {booking.make} {booking.model}</td><td className="pr-3 text-xs">{booking.service_type}</td><td><Status status={statusLabel(booking.status)} /></td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-5 py-8 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><CalendarDays size={19} /></span><p className="mt-3 text-sm font-semibold text-slate-700">No appointments scheduled today</p><p className="mt-1 text-xs text-slate-500">Create a service request to add the first visit to today’s schedule.</p><Link to="/bookings" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800"><Plus size={14} />Create service request</Link></div>}
      {isLoading && <p className="mt-3 text-xs text-slate-400">Loading appointments…</p>}{(error || summaryError) && <p role="alert" className="mt-3 text-xs text-rose-600">Unable to load dashboard data.</p>}
    </Panel>
  </Page>
}

const tones = {
  blue: { accent: 'text-[#b94f1e]', border: '#f6c7a8', background: 'linear-gradient(135deg, #fff5ee 0%, #ffffff 76%)' },
  violet: { accent: 'text-[#626873]', border: '#e1e3e6', background: '#ffffff' },
  cyan: { accent: 'text-[#626873]', border: '#e1e3e6', background: '#ffffff' },
  rose: { accent: 'text-[#626873]', border: '#e1e3e6', background: '#ffffff' },
  amber: { accent: 'text-[#626873]', border: '#e1e3e6', background: '#ffffff' },
  green: { accent: 'text-[#626873]', border: '#e1e3e6', background: '#ffffff' },
  pink: { accent: 'text-[#626873]', border: '#e1e3e6', background: '#ffffff' },
  indigo: { accent: 'text-[#626873]', border: '#e1e3e6', background: '#ffffff' },
}

function Metric({ to, tone, label, value, note, icon: Icon = CalendarDays }: { to: string; tone: keyof typeof tones; label: string; value: number | string; note?: string; icon?: typeof CalendarDays }) {
  const colors = tones[tone]
  return <Link to={to} style={{ background: colors.background, borderColor: colors.border }} className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-300/40 focus-visible:ring-2 focus-visible:ring-[#f07836]">
    <span className={`flex items-start justify-between ${colors.accent}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 shadow-sm"><Icon size={19} /></span><ArrowRight size={15} className="translate-x-1 text-slate-400 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span>
    <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>{note && <p className="mt-1.5 text-[11px] text-slate-500">{note}</p>}
  </Link>
}
