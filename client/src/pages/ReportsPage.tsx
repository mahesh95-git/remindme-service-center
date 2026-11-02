import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CalendarDays,
  CarFront,
  Clock3,
  FileSpreadsheet,
  FileText,
  Users,
} from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import {
  useBookingsQuery,
  useDashboardSummaryQuery,
  useRecordsQuery,
  useServiceActivityQuery,
  type Booking,
  type ServiceActivity,
} from '../store/api'
import {
  exportBookingsPdf,
  exportBookingsSpreadsheet,
  exportCustomersPdf,
  exportCustomersSpreadsheet,
  exportFullReportPdf,
  exportFullReportSpreadsheet,
  exportTodayServicesPdf,
  exportTodayServicesSpreadsheet,
  exportVehiclesPdf,
  exportVehiclesSpreadsheet,
  type CustomerReportItem,
  type VehicleReportItem,
} from '../lib/reportExport'

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

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const dateStr = value.includes('T') ? value : `${value}T00:00:00`
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
}

const statusLabel = (status: Booking['status']) =>
  status === 'COMPLETED' ? 'Completed' : status === 'CANCELLED' ? 'Cancelled' : 'Pending'

const PAGE_SIZE = 10

export function ReportsPage() {
  const { data: bookings = [], error: bookingsError, isLoading: bookingsLoading } = useBookingsQuery()
  const { data: customersRaw = [], error: customersError, isLoading: customersLoading } = useRecordsQuery({ path: '/customers' })
  const { data: vehiclesRaw = [], error: vehiclesError, isLoading: vehiclesLoading } = useRecordsQuery({ path: '/vehicles' })
  const { data: summary } = useDashboardSummaryQuery()

  const customers = customersRaw as unknown as CustomerReportItem[]
  const vehicles = vehiclesRaw as unknown as VehicleReportItem[]

  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState(monthStartKey(todayKey()))
  const [customTo, setCustomTo] = useState(todayKey())

  // Pagination states for table sections
  const [todayPage, setTodayPage] = useState(1)
  const [bookingsPage, setBookingsPage] = useState(1)
  const [customersPage, setCustomersPage] = useState(1)
  const [vehiclesPage, setVehiclesPage] = useState(1)

  const today = todayKey()
  const earliestBooking = bookings.reduce(
    (earliest, booking) => (booking.booking_date < earliest ? booking.booking_date : earliest),
    today,
  )
  const latestBooking = bookings.reduce(
    (latest, booking) => (booking.booking_date > latest ? booking.booking_date : latest),
    today,
  )

  const from =
    period === 'today'
      ? today
      : period === 'month'
        ? monthStartKey(today)
        : period === '30days'
          ? shiftDate(today, -29)
          : period === 'all'
            ? earliestBooking
            : customFrom

  const to = period === 'all' ? latestBooking : period === 'custom' ? customTo || today : today

  const { data: serviceActivity = [], error: activityError, isLoading: activityLoading } = useServiceActivityQuery({ from, to })

  const periodLabel = useMemo(() => {
    switch (period) {
      case 'today':
        return `Today (${today})`
      case 'month':
        return `This month (${from} to ${to})`
      case '30days':
        return `Last 30 days (${from} to ${to})`
      case 'all':
        return `All time (${from} to ${to})`
      case 'custom':
        return `Custom range (${customFrom} to ${customTo || today})`
    }
  }, [period, today, from, to, customFrom, customTo])

  // Filtered dataset for sections
  const todayServices = useMemo(
    () =>
      bookings
        .filter(booking => booking.booking_date === today)
        .sort((a, b) => a.slot_start.localeCompare(b.slot_start)),
    [bookings, today],
  )

  const periodBookings = useMemo(
    () =>
      bookings
        .filter(booking => booking.booking_date >= from && booking.booking_date <= to)
        .sort((a, b) => b.booking_date.localeCompare(a.booking_date) || a.slot_start.localeCompare(b.slot_start)),
    [bookings, from, to],
  )

  const rangeDays = Math.ceil((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86_400_000)
  const chartData = useMemo(
    () => buildTrend(periodBookings, serviceActivity, rangeDays > 60),
    [periodBookings, serviceActivity, rangeDays],
  )

  const serviceData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const service of serviceActivity) counts.set(service.service_type, (counts.get(service.service_type) ?? 0) + 1)
    return [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [serviceActivity])

  const isLoading = bookingsLoading || activityLoading || customersLoading || vehiclesLoading
  const error = bookingsError || activityError || customersError || vehiclesError

  // Handler for full report export
  const handleExportFullCsv = () => {
    exportFullReportSpreadsheet({
      title: 'Service Center Comprehensive Report',
      periodLabel,
      dateRange: { from, to },
      summary,
      customers,
      vehicles,
      bookings: periodBookings,
      todayServices,
    })
  }

  const handleExportFullPdf = () => {
    exportFullReportPdf({
      title: 'Service Center Comprehensive Report',
      periodLabel,
      dateRange: { from, to },
      summary,
      customers,
      vehicles,
      bookings: periodBookings,
      todayServices,
    })
  }

  // Paged slice computations
  const pagedTodayServices = useMemo(
    () => todayServices.slice((todayPage - 1) * PAGE_SIZE, todayPage * PAGE_SIZE),
    [todayServices, todayPage],
  )
  const pagedBookings = useMemo(
    () => periodBookings.slice((bookingsPage - 1) * PAGE_SIZE, bookingsPage * PAGE_SIZE),
    [periodBookings, bookingsPage],
  )
  const pagedCustomers = useMemo(
    () => customers.slice((customersPage - 1) * PAGE_SIZE, customersPage * PAGE_SIZE),
    [customers, customersPage],
  )
  const pagedVehicles = useMemo(
    () => vehicles.slice((vehiclesPage - 1) * PAGE_SIZE, vehiclesPage * PAGE_SIZE),
    [vehicles, vehiclesPage],
  )

  return (
    <Page
      title="Reports & analytics"
      subtitle="Explore booking activity, service performance, and export center records."
    >
      {/* Top action controls: Full report export */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comprehensive export:</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleExportFullCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
            title="Download full report including all sections in CSV spreadsheet format"
          >
            <FileSpreadsheet size={15} />
            Export full report (CSV)
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleExportFullPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50"
            title="Open printable comprehensive PDF report with all sections"
          >
            <FileText size={15} />
            Export full report (PDF)
          </button>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Period: <span className="font-semibold text-slate-800">{periodLabel}</span>
        </div>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[#e1e3e6] bg-white p-4 shadow-sm">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reporting period</p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['today', 'Today'],
                ['month', 'This month'],
                ['30days', 'Last 30 days'],
                ['all', 'All time'],
                ['custom', 'Custom'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  period === key
                    ? 'bg-[#262b33] text-white'
                    : 'text-slate-600 hover:bg-orange-50 hover:text-[#843712]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[10px] font-semibold text-slate-500">
              From
              <input
                aria-label="Report start date"
                type="date"
                value={customFrom}
                max={customTo || today}
                onChange={event => setCustomFrom(event.target.value)}
                className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-[#262b33] focus:border-[#f07836] focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="text-[10px] font-semibold text-slate-500">
              To
              <input
                aria-label="Report end date"
                type="date"
                value={customTo}
                min={customFrom}
                max={today}
                onChange={event => setCustomTo(event.target.value)}
                className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-[#262b33] focus:border-[#f07836] focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          Unable to load report data. Please refresh and try again.
        </p>
      )}

      {/* Metrics overview summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today’s services</p>
          <p className="mt-1 text-2xl font-extrabold text-[#262b33]">{todayServices.length}</p>
          <p className="mt-1 text-xs text-slate-500">Scheduled for {today}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Period bookings</p>
          <p className="mt-1 text-2xl font-extrabold text-[#262b33]">{periodBookings.length}</p>
          <p className="mt-1 text-xs text-slate-500">In selected period</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registered customers</p>
          <p className="mt-1 text-2xl font-extrabold text-[#262b33]">{customers.length}</p>
          <p className="mt-1 text-xs text-slate-500">Customer profiles</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fleet vehicles</p>
          <p className="mt-1 text-2xl font-extrabold text-[#262b33]">{vehicles.length}</p>
          <p className="mt-1 text-xs text-slate-500">Registered vehicles</p>
        </div>
      </div>

      {/* Charts panel */}
      {isLoading ? (
        <Panel>
          <p className="text-sm text-slate-500">Loading report data…</p>
        </Panel>
      ) : (
        <>
          <div className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
            <Panel>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-[#262b33]">Booking & service activity</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Bookings and completed service records in the selected period.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                  <i className="h-2 w-2 rounded-full bg-[#f07836]" />
                  Bookings <i className="ml-2 h-2 w-2 rounded-full bg-emerald-600" />
                  Completed services
                </span>
              </div>
              {chartData.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="reportBookingsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f07836" stopOpacity={0.26} />
                          <stop offset="100%" stopColor="#f07836" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="reportCompletedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#15803d" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#15803d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e1e3e6" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#626873' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#626873' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ border: '1px solid #e1e3e6', borderRadius: 12, fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="bookings"
                        name="Bookings"
                        stroke="#f07836"
                        strokeWidth={2.5}
                        fill="url(#reportBookingsFill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed"
                        stroke="#15803d"
                        strokeWidth={2.5}
                        fill="url(#reportCompletedFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No bookings in this period yet." />
              )}
            </Panel>
            <Panel>
              <h2 className="text-sm font-extrabold text-[#262b33]">Service mix</h2>
              <p className="mt-1 text-xs text-slate-500">Most requested services in this period.</p>
              {serviceData.length ? (
                <>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={3}
                        >
                          {serviceData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={['#f07836', '#262b33', '#15803d', '#1d4ed8', '#d97706', '#626873'][index % 6]}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ border: '1px solid #e1e3e6', borderRadius: 12, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {serviceData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-slate-600">
                          <i
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: [
                                '#f07836',
                                '#262b33',
                                '#15803d',
                                '#1d4ed8',
                                '#d97706',
                                '#626873',
                              ][index % 6],
                            }}
                          />
                          <span className="truncate">{entry.name}</span>
                        </span>
                        <strong className="text-[#262b33]">{entry.value}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyChart message="Service mix will appear when bookings are added." />
              )}
            </Panel>
          </div>

          {/* =========================================================================
           * SEPARATE SECTIONS FOR TODAY'S SERVICES, BOOKINGS, CUSTOMERS, AND VEHICLES
           * ========================================================================= */}
          <div className="space-y-8">
            {/* 1. TODAY'S SERVICES SECTION */}
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-[#b94f1e]">
                    <Clock3 size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-[#262b33]">Today’s services</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {todayServices.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Service appointments scheduled for today ({today}).</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportTodayServicesSpreadsheet(todayServices)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportTodayServicesPdf(todayServices)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileText size={14} className="text-blue-600" />
                    Export PDF
                  </button>
                </div>
              </div>

              {todayServices.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-3 pb-3">Time</th>
                          <th className="px-3 pb-3">Booking code</th>
                          <th className="px-3 pb-3">Customer</th>
                          <th className="px-3 pb-3">Vehicle</th>
                          <th className="px-3 pb-3">Service</th>
                          <th className="px-3 pb-3">Status</th>
                          <th className="px-3 pb-3">Handled by</th>
                          <th className="px-3 pb-3 text-right">Bill total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedTodayServices.map(b => (
                          <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                            <td className="px-3 py-3.5 font-bold text-blue-700">{b.slot_start?.slice(0, 5) || '—'}</td>
                            <td className="px-3 py-3.5 font-mono text-[11px] font-bold text-[#b94f1e]">{b.booking_code}</td>
                            <td className="px-3 py-3.5">
                              <span className="font-semibold text-slate-800">{b.customer_name}</span>
                              <span className="block text-[11px] text-slate-400">{b.customer_phone}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="font-bold text-slate-700">{b.reg_number}</span>
                              <span className="block text-[11px] text-slate-400">
                                {b.make} {b.model}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-slate-600">{b.service_type}</td>
                            <td className="px-3 py-3.5">
                              <Status status={statusLabel(b.status)} />
                            </td>
                            <td className="px-3 py-3.5 text-slate-600">{b.assigned_staff_name || 'Unassigned'}</td>
                            <td className="px-3 py-3.5 text-right font-semibold text-slate-800">
                              {b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    total={todayServices.length}
                    page={todayPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setTodayPage}
                  />
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                  No service appointments scheduled for today.
                </p>
              )}
            </Panel>

            {/* 2. BOOKINGS SECTION */}
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-blue-700">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-[#262b33]">Bookings report</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {periodBookings.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Appointments in selected period ({periodLabel}).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportBookingsSpreadsheet(periodBookings, periodLabel)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportBookingsPdf(periodBookings, periodLabel)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileText size={14} className="text-blue-600" />
                    Export PDF
                  </button>
                </div>
              </div>

              {periodBookings.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-3 pb-3">Date &amp; time</th>
                          <th className="px-3 pb-3">Booking code</th>
                          <th className="px-3 pb-3">Customer</th>
                          <th className="px-3 pb-3">Vehicle</th>
                          <th className="px-3 pb-3">Service</th>
                          <th className="px-3 pb-3">Status</th>
                          <th className="px-3 pb-3">Staff</th>
                          <th className="px-3 pb-3 text-right">Invoice total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedBookings.map(b => (
                          <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                            <td className="px-3 py-3.5">
                              <span className="font-bold text-slate-800">{formatDate(b.booking_date)}</span>
                              <span className="block text-[11px] text-slate-400">{b.slot_start?.slice(0, 5) || '—'}</span>
                            </td>
                            <td className="px-3 py-3.5 font-mono text-[11px] font-bold text-[#b94f1e]">{b.booking_code}</td>
                            <td className="px-3 py-3.5">
                              <span className="font-semibold text-slate-800">{b.customer_name}</span>
                              <span className="block text-[11px] text-slate-400">{b.customer_phone}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className="font-bold text-slate-700">{b.reg_number}</span>
                              <span className="block text-[11px] text-slate-400">
                                {b.make} {b.model}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-slate-600">{b.service_type}</td>
                            <td className="px-3 py-3.5">
                              <Status status={statusLabel(b.status)} />
                            </td>
                            <td className="px-3 py-3.5 text-slate-600">{b.assigned_staff_name || 'Unassigned'}</td>
                            <td className="px-3 py-3.5 text-right font-semibold text-slate-800">
                              {b.invoice_total != null ? `₹${Number(b.invoice_total).toLocaleString('en-IN')}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    total={periodBookings.length}
                    page={bookingsPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setBookingsPage}
                  />
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                  No bookings found in this period.
                </p>
              )}
            </Panel>

            {/* 3. CUSTOMERS SECTION */}
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-pink-100 text-pink-700">
                    <Users size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-[#262b33]">Customers report</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {customers.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Customer directory with vehicle counts and last visit.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportCustomersSpreadsheet(customers)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportCustomersPdf(customers)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileText size={14} className="text-blue-600" />
                    Export PDF
                  </button>
                </div>
              </div>

              {customers.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-3 pb-3">Customer name</th>
                          <th className="px-3 pb-3">Phone</th>
                          <th className="px-3 pb-3">Email</th>
                          <th className="px-3 pb-3">Address</th>
                          <th className="px-3 pb-3 text-center">Vehicles</th>
                          <th className="px-3 pb-3">Last visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedCustomers.map((c, idx) => (
                          <tr key={String(c.id ?? idx)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                            <td className="px-3 py-3.5 font-bold text-slate-800">{c.name || '—'}</td>
                            <td className="px-3 py-3.5 text-slate-600">{c.phone || '—'}</td>
                            <td className="px-3 py-3.5 text-slate-500">{c.email || '—'}</td>
                            <td className="px-3 py-3.5 text-slate-500">{c.address || '—'}</td>
                            <td className="px-3 py-3.5 text-center font-bold text-blue-700">{c.vehicles_count ?? 0}</td>
                            <td className="px-3 py-3.5 text-slate-600">{formatDate(c.last_visit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    total={customers.length}
                    page={customersPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCustomersPage}
                  />
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                  No customer records found.
                </p>
              )}
            </Panel>

            {/* 4. VEHICLES SECTION */}
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-800">
                    <CarFront size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-extrabold text-[#262b33]">Vehicles report</h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        {vehicles.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Vehicle register with service dates, insurance, and PUC status.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportVehiclesSpreadsheet(vehicles)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => exportVehiclesPdf(vehicles)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FileText size={14} className="text-blue-600" />
                    Export PDF
                  </button>
                </div>
              </div>

              {vehicles.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="px-3 pb-3">Registration</th>
                          <th className="px-3 pb-3">Make &amp; model</th>
                          <th className="px-3 pb-3">Year</th>
                          <th className="px-3 pb-3">Owner</th>
                          <th className="px-3 pb-3">Last service</th>
                          <th className="px-3 pb-3">Next service</th>
                          <th className="px-3 pb-3">Insurance</th>
                          <th className="px-3 pb-3">PUC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedVehicles.map((v, idx) => (
                          <tr key={String(v.id ?? idx)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                            <td className="px-3 py-3.5 font-bold text-blue-700">{v.reg_number || '—'}</td>
                            <td className="px-3 py-3.5 font-medium text-slate-800">
                              {v.make} {v.model}
                            </td>
                            <td className="px-3 py-3.5 text-slate-600">{v.year ?? '—'}</td>
                            <td className="px-3 py-3.5">
                              <span className="font-semibold text-slate-800">{v.customer_name || '—'}</span>
                              <span className="block text-[11px] text-slate-400">{v.customer_phone || ''}</span>
                            </td>
                            <td className="px-3 py-3.5 text-slate-600">{formatDate(v.last_service_date)}</td>
                            <td className="px-3 py-3.5 font-medium text-slate-800">{formatDate(v.next_service_date)}</td>
                            <td className="px-3 py-3.5 text-slate-600">{formatDate(v.insurance_expiry)}</td>
                            <td className="px-3 py-3.5 text-slate-600">{formatDate(v.puc_expiry)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    total={vehicles.length}
                    page={vehiclesPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setVehiclesPage}
                  />
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                  No vehicle records found.
                </p>
              )}
            </Panel>
          </div>
        </>
      )}
    </Page>
  )
}

function buildTrend(bookings: Booking[], services: ServiceActivity[], byMonth: boolean) {
  const buckets = new Map<string, { label: string; bookings: number; completed: number }>()
  const getBucket = (date: string) => {
    const key = byMonth ? date.slice(0, 7) : date
    const item =
      buckets.get(key) ?? {
        label: new Date(`${byMonth ? `${key}-01` : key}T00:00:00`).toLocaleDateString(
          undefined,
          byMonth ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' },
        ),
        bookings: 0,
        completed: 0,
      }
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

function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
      <span>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
