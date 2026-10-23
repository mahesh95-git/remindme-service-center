import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Bell, CalendarDays, CarFront, Clock3, Plus, Sparkles, UserRound, Users } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useBookingsQuery, useDashboardSummaryQuery } from '../store/api'
import type { Booking } from '../store/api'
import { exportReportPdf, exportReportSpreadsheet } from '../lib/reportExport'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const statusLabel = (status: Booking['status']) => status === 'CONFIRMED' ? 'Confirmed' : status === 'CANCELLED' ? 'Cancelled' : 'Completed'

export default function ReceptionistDashboardPage() {
  const { data: bookings = [], error, isLoading } = useBookingsQuery()
  const { data: summary, error: summaryError } = useDashboardSummaryQuery()
  const todayBookings = bookings.filter(booking => booking.booking_date === today())
  const upcomingBookings = bookings.filter(booking => booking.status === 'CONFIRMED' && booking.booking_date >= today())
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  return <Page title="Reception desk" subtitle="Your service center at a glance. Make today run smoothly.">
    <section style={{ background: 'linear-gradient(110deg, #2546c8 0%, #365cf5 55%, #6386ff 100%)' }} className="relative mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-blue-200/60 sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-32 h-80 w-80 rounded-full border-[48px] border-white/[0.08]" />
      <div className="pointer-events-none absolute -bottom-36 right-44 h-64 w-64 rounded-full bg-cyan-300/10 blur-2xl" />
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-50"><Sparkles size={13} /> Service center live</span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Good {greeting} <span aria-hidden="true">👋</span></h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-blue-100"><Clock3 size={15} />{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}<span className="text-white/40">·</span>{todayBookings.length} appointments today</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/bookings" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-blue-800 shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50"><Plus size={16} />Create booking</Link>
          <Link to="/customers" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-xs font-bold text-white transition hover:bg-white/20"><Users size={15} />Find customer</Link>
        </div>
      </div>
    </section>

    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-sm font-bold text-slate-800">Service overview</h2><p className="mt-1 text-xs text-slate-500">Choose a card to open its workspace.</p></div>
      <div className="flex gap-2">
        <button type="button" disabled={!summary} onClick={() => summary && exportReportSpreadsheet({ title: 'Reception dashboard', summary, bookings })} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50">Export spreadsheet</button>
        <button type="button" disabled={!summary} onClick={() => summary && exportReportPdf({ title: 'Reception dashboard report', summary, bookings })} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50">Export PDF</button>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric to="/bookings" tone="blue" label="Bookings today" value={todayBookings.length} note={`${summary?.bookingsToday.confirmed ?? 0} confirmed · ${summary?.bookingsToday.completed ?? 0} completed`} />
      <Metric to="/bookings" tone="violet" label="Upcoming confirmed" value={upcomingBookings.length} note="Ready for the schedule" icon={CalendarDays} />
      <Metric to="/bookings" tone="cyan" label="All bookings" value={bookings.length} note="Across all dates" icon={CalendarDays} />
      <Metric to="/customers" tone="rose" label="Active customers" value={summary?.activeCustomers ?? 0} icon={Users} />
      <Metric to="/vehicles" tone="amber" label="Registered vehicles" value={summary?.registeredVehicles ?? 0} icon={CarFront} />
      <Metric to="/bookings" tone="green" label="Services completed" value={summary?.servicesCompletedMonth ?? 0} note="This month" icon={Activity} />
      <Metric to="/reminders" tone="pink" label="Reminders tracked" value={summary?.remindersCount ?? 0} icon={Bell} />
      <Metric to="/bookings" tone="indigo" label="Active staff" value={summary?.activeStaff ?? 0} icon={UserRound} />
    </div>

    {summary && <ActivityChart data={summary.monthlyBookingTrend} />}
    <Panel className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-extrabold">Today’s appointments</h2><p className="mt-1 text-xs text-slate-500">Your schedule, sorted by appointment time.</p></div><Link to="/bookings" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">View all bookings <ArrowRight size={14} /></Link></div>
      {todayBookings.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Time', 'Customer', 'Vehicle', 'Service', 'Status'].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{[...todayBookings].sort((a, b) => a.slot_start.localeCompare(b.slot_start)).map(booking => <tr key={booking.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs font-bold text-blue-800">{booking.slot_start.slice(0, 5)}</td><td className="pr-3 text-xs font-semibold">{booking.customer_name}<small className="block font-normal text-slate-400">{booking.customer_phone}</small></td><td className="pr-3 text-xs">{booking.reg_number} · {booking.make} {booking.model}</td><td className="pr-3 text-xs">{booking.service_type}</td><td><Status status={statusLabel(booking.status)} /></td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-5 py-8 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><CalendarDays size={19} /></span><p className="mt-3 text-sm font-semibold text-slate-700">No appointments scheduled today</p><p className="mt-1 text-xs text-slate-500">Create a booking to add the first visit to today’s schedule.</p><Link to="/bookings" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800"><Plus size={14} />Create booking</Link></div>}
      {isLoading && <p className="mt-3 text-xs text-slate-400">Loading appointments…</p>}{(error || summaryError) && <p role="alert" className="mt-3 text-xs text-rose-600">Unable to load dashboard data.</p>}
    </Panel>
  </Page>
}

const tones = {
  blue: { accent: 'text-blue-700', border: '#c7d7ff', background: 'linear-gradient(135deg, #e9efff 0%, #ffffff 76%)' },
  violet: { accent: 'text-violet-700', border: '#ddd2ff', background: 'linear-gradient(135deg, #f0ebff 0%, #ffffff 76%)' },
  cyan: { accent: 'text-cyan-700', border: '#bcecf5', background: 'linear-gradient(135deg, #e3faff 0%, #ffffff 76%)' },
  rose: { accent: 'text-rose-700', border: '#ffd0dd', background: 'linear-gradient(135deg, #fff0f4 0%, #ffffff 76%)' },
  amber: { accent: 'text-amber-700', border: '#f7dfb0', background: 'linear-gradient(135deg, #fff7e7 0%, #ffffff 76%)' },
  green: { accent: 'text-emerald-700', border: '#bdebd7', background: 'linear-gradient(135deg, #e9fbf3 0%, #ffffff 76%)' },
  pink: { accent: 'text-pink-700', border: '#f7cdea', background: 'linear-gradient(135deg, #fff0fb 0%, #ffffff 76%)' },
  indigo: { accent: 'text-indigo-700', border: '#cdd4ff', background: 'linear-gradient(135deg, #eef0ff 0%, #ffffff 76%)' },
}

function Metric({ to, tone, label, value, note, icon: Icon = CalendarDays }: { to: string; tone: keyof typeof tones; label: string; value: number | string; note?: string; icon?: typeof CalendarDays }) {
  const colors = tones[tone]
  return <Link to={to} style={{ background: colors.background, borderColor: colors.border }} className="group relative overflow-hidden rounded-2xl border p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-300/40 focus-visible:ring-2 focus-visible:ring-blue-400">
    <span className={`flex items-start justify-between ${colors.accent}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 shadow-sm"><Icon size={19} /></span><ArrowRight size={15} className="translate-x-1 text-slate-400 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span>
    <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>{note && <p className="mt-1.5 text-[11px] text-slate-500">{note}</p>}
  </Link>
}

function ActivityChart({ data }: { data: { day: number; bookings: number; services: number }[] }) {
  const max = Math.max(1, ...data.flatMap(item => [item.bookings, item.services]))
  return <Panel className="mt-6"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-extrabold">This month’s activity</h2><p className="mt-1 text-xs text-slate-500">Bookings and completed services by day.</p></div><div className="flex gap-3 text-[11px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-600" />Bookings</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Services completed</span></div></div><div className="mt-5 flex h-44 items-end gap-1 overflow-x-auto rounded-xl bg-gradient-to-b from-blue-50/60 to-transparent px-2 pt-3">{data.map(item => <div key={item.day} className="group flex min-w-[12px] flex-1 items-end justify-center gap-px" title={`Day ${item.day}: ${item.bookings} bookings, ${item.services} services`}><span className="w-1.5 rounded-t bg-blue-500 transition-colors group-hover:bg-blue-700" style={{ height: `${Math.max(item.bookings ? 5 : 1, item.bookings / max * 100)}%` }} /><span className="w-1.5 rounded-t bg-emerald-400 transition-colors group-hover:bg-emerald-600" style={{ height: `${Math.max(item.services ? 5 : 1, item.services / max * 100)}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>1</span><span>{data.length}</span></div></Panel>
}
