import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Page, Panel } from '../components/ui'
import { useBookingsQuery, useServiceActivityQuery, type Booking, type ServiceActivity } from '../store/api'

type Period = 'today' | 'month' | '30days' | 'all' | 'custom'
const todayKey = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}
const monthStartKey = (date: string) => `${date.slice(0, 7)}-01`
const shiftDate = (date: string, offset: number) => {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + offset)
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function ReportsPage() {
  const { data: bookings = [], error: bookingsError, isLoading: bookingsLoading } = useBookingsQuery()
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState(monthStartKey(todayKey()))
  const [customTo, setCustomTo] = useState(todayKey())
  const today = todayKey()
  const earliestBooking = bookings.reduce((earliest, booking) => booking.booking_date < earliest ? booking.booking_date : earliest, today)
  const latestBooking = bookings.reduce((latest, booking) => booking.booking_date > latest ? booking.booking_date : latest, today)
  const from = period === 'today' ? today
    : period === 'month' ? monthStartKey(today)
      : period === '30days' ? shiftDate(today, -29)
        : period === 'all' ? earliestBooking : customFrom
  const to = period === 'all' ? latestBooking : period === 'custom' ? (customTo || today) : today
  const { data: serviceActivity = [], error: activityError, isLoading: activityLoading } = useServiceActivityQuery({ from, to })

  const periodBookings = useMemo(() => bookings.filter(booking => booking.booking_date >= from && booking.booking_date <= to), [bookings, from, to])
  const rangeDays = Math.ceil((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86_400_000)
  const chartData = useMemo(() => buildTrend(periodBookings, serviceActivity, rangeDays > 60), [periodBookings, serviceActivity, rangeDays])
  const serviceData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const service of serviceActivity) counts.set(service.service_type, (counts.get(service.service_type) ?? 0) + 1)
    return [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [serviceActivity])

  const isLoading = bookingsLoading || activityLoading
  const error = bookingsError || activityError

  return <Page title="Reports & analytics" subtitle="Explore booking activity, service performance, and your customer base.">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[#e1e3e6] bg-white p-4 shadow-sm">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reporting period</p>
        <div className="flex flex-wrap gap-1.5">
          {([['today', 'Today'], ['month', 'This month'], ['30days', 'Last 30 days'], ['all', 'All time'], ['custom', 'Custom']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setPeriod(key)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${period === key ? 'bg-[#262b33] text-white' : 'text-slate-600 hover:bg-orange-50 hover:text-[#843712]'}`}>{label}</button>)}
        </div>
      </div>
      {period === 'custom' && <div className="flex flex-wrap items-end gap-2">
        <label className="text-[10px] font-semibold text-slate-500">From<input aria-label="Report start date" type="date" value={customFrom} max={customTo || today} onChange={event => setCustomFrom(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-[#262b33] focus:border-[#f07836] focus:outline-none focus:ring-2 focus:ring-orange-100" /></label>
        <label className="text-[10px] font-semibold text-slate-500">To<input aria-label="Report end date" type="date" value={customTo} min={customFrom} max={today} onChange={event => setCustomTo(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-[#262b33] focus:border-[#f07836] focus:outline-none focus:ring-2 focus:ring-orange-100" /></label>
      </div>}
    </div>

    {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">Unable to load report data. Please refresh and try again.</p>}
    {isLoading ? <Panel><p className="text-sm text-slate-500">Loading report data…</p></Panel> : <>
      <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <Panel>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-sm font-extrabold text-[#262b33]">Booking & service activity</h2><p className="mt-1 text-xs text-slate-500">Bookings and completed service records in the selected period.</p></div><span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500"><i className="h-2 w-2 rounded-full bg-[#f07836]" />Bookings <i className="ml-2 h-2 w-2 rounded-full bg-emerald-600" />Completed services</span></div>
          {chartData.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="reportBookingsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f07836" stopOpacity={0.26} /><stop offset="100%" stopColor="#f07836" stopOpacity={0} /></linearGradient><linearGradient id="reportCompletedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#15803d" stopOpacity={0.2} /><stop offset="100%" stopColor="#15803d" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e1e3e6" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#626873' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#626873' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: '1px solid #e1e3e6', borderRadius: 12, fontSize: 12 }} /><Area type="monotone" dataKey="bookings" name="Bookings" stroke="#f07836" strokeWidth={2.5} fill="url(#reportBookingsFill)" /><Area type="monotone" dataKey="completed" name="Completed" stroke="#15803d" strokeWidth={2.5} fill="url(#reportCompletedFill)" /></AreaChart></ResponsiveContainer></div> : <EmptyChart message="No bookings in this period yet." />}
        </Panel>
        <Panel>
          <h2 className="text-sm font-extrabold text-[#262b33]">Service mix</h2><p className="mt-1 text-xs text-slate-500">Most requested services in this period.</p>
          {serviceData.length ? <><div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={serviceData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>{serviceData.map((entry, index) => <Cell key={entry.name} fill={['#f07836', '#262b33', '#15803d', '#1d4ed8', '#d97706', '#626873'][index % 6]} />)}</Pie><Tooltip contentStyle={{ border: '1px solid #e1e3e6', borderRadius: 12, fontSize: 12 }} /></PieChart></ResponsiveContainer></div><div className="space-y-2">{serviceData.map((entry, index) => <div key={entry.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-slate-600"><i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ['#f07836', '#262b33', '#15803d', '#1d4ed8', '#d97706', '#626873'][index % 6] }} /><span className="truncate">{entry.name}</span></span><strong className="text-[#262b33]">{entry.value}</strong></div>)}</div></> : <EmptyChart message="Service mix will appear when bookings are added." />}
        </Panel>
      </div>

    </>}
  </Page>
}

function buildTrend(bookings: Booking[], services: ServiceActivity[], byMonth: boolean) {
  const buckets = new Map<string, { label: string; bookings: number; completed: number }>()
  const getBucket = (date: string) => {
    const key = byMonth ? date.slice(0, 7) : date
    const item = buckets.get(key) ?? { label: new Date(`${byMonth ? `${key}-01` : key}T00:00:00`).toLocaleDateString(undefined, byMonth ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' }), bookings: 0, completed: 0 }
    buckets.set(key, item)
    return item
  }
  for (const booking of bookings) getBucket(booking.booking_date).bookings += 1
  for (const service of services) getBucket(service.service_date).completed += 1
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value)
}


function EmptyChart({ message }: { message: string }) {
  return <div className="grid h-56 place-items-center text-center text-xs text-slate-500">{message}</div>
}
