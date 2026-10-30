import { Link } from 'react-router-dom'
import { Activity, ArrowRight, CalendarDays, CarFront, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Panel } from '../components/ui'
import { useDashboardSummaryQuery } from '../store/api'

export function DashboardPage() {
  const summaryQuery = useDashboardSummaryQuery()
  const summary = summaryQuery.data
  const stats = summary ? [
    { label: 'Service requests today', value: summary.bookingsToday.total, note: `${summary.bookingsToday.confirmed} confirmed · ${summary.bookingsToday.completed} completed`, icon: CalendarDays, to: '/bookings', color: '#3158e8', border: '#c7d7ff', background: 'linear-gradient(135deg,#e8efff,#fff 78%)' },
    { label: 'Active customers', value: summary.activeCustomers, note: 'Customer profiles', icon: Users, to: '/customers', color: '#d34870', border: '#ffd0dd', background: 'linear-gradient(135deg,#fff0f4,#fff 78%)' },
    { label: 'Registered vehicles', value: summary.registeredVehicles, note: 'In your service center', icon: CarFront, to: '/vehicles', color: '#c17912', border: '#f7dfb0', background: 'linear-gradient(135deg,#fff7e7,#fff 78%)' },
    { label: 'Services completed', value: summary.servicesCompletedMonth, note: 'This month', icon: Activity, to: '/bookings', color: '#16865e', border: '#bdebd7', background: 'linear-gradient(135deg,#e9fbf3,#fff 78%)' },
  ] : []
  return <div>
    {summaryQuery.isLoading ? <Panel><p className="text-sm text-slate-500">Loading your service overview…</p></Panel> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, note, icon: Icon, to, color, border, background }) => <Link key={label} to={to} style={{ background, borderColor: border }} className="group rounded-2xl border p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-300/40"><span className="flex items-start justify-between" style={{ color }}><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 shadow-sm"><Icon size={19} /></span><ArrowRight size={15} className="translate-x-1 text-slate-400 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" /></span><p className="mt-4 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1.5 text-[11px] text-slate-500">{note}</p></Link>)}</div>}
    {summary && <DashboardCharts data={summary.monthlyBookingTrend} />}
  </div>
}

function DashboardCharts({ data }: { data: { day: number; bookings: number; services: number }[] }) {
  const chartData = data.map(item => ({ ...item, label: `${item.day}` }))

  return <div className="mt-6">
    <Panel>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-extrabold">Service activity</h2><p className="mt-1 text-xs text-slate-500">Service requests and completed services this month.</p></div>
        <div className="flex gap-3 text-[11px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-600" />Bookings</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Services</span></div>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke="#e8eefb" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ border: '1px solid #dbe5fb', borderRadius: 10, fontSize: 12 }} labelFormatter={label => `Day ${label}`} />
            <Bar dataKey="bookings" name="Service requests" fill="#3158e8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="services" name="Services" fill="#16a36d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  </div>
}
