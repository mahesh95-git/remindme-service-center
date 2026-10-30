import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Plus, Receipt, Search, X } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useAssignBookingStaffMutation, useBookingsQuery, useCreateInvoiceMutation, useRecordsQuery, useRescheduleBookingMutation, useRescheduleSlotsQuery, useUpdateBookingStatusMutation } from '../store/api'
import type { Booking } from '../store/api'
import { StaffTodayServices } from './StaffTodayServices'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const dateKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
const statusLabel = (status: Booking['status']) => status === 'COMPLETED' ? 'Completed' : 'Pending'

function AdminBookingsPage({ allowCreate = false, allowMutations = false }: { allowCreate?: boolean; allowMutations?: boolean }) {
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const completedOnly = !allowMutations
  const { currentData: allBookings = [], error, isFetching } = useBookingsQuery({ search, status: completedOnly ? 'COMPLETED' : statusFilter ? statusFilter as Booking['status'] : undefined })
  const { data: staffAccounts = [] } = useRecordsQuery({ path: '/users' }, { skip: allowMutations })
  const [assignBookingStaff, { isLoading: isAssigningStaff }] = useAssignBookingStaffMutation()
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null)
  const [assignmentError, setAssignmentError] = useState('')
  const now = new Date()
  const currentDay = dateKey(now)
  const rangeStart = dateRange === 'today' ? currentDay
    : dateRange === 'month' ? dateKey(new Date(now.getFullYear(), now.getMonth(), 1))
      : dateRange === '15days' ? dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14))
        : dateRange === 'lastMonth' ? dateKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))
          : dateRange === 'custom' ? dateFrom : ''
  const rangeEnd = dateRange === 'today' ? currentDay
    : dateRange === 'lastMonth' ? dateKey(new Date(now.getFullYear(), now.getMonth(), 0))
      : dateRange === 'custom' ? dateTo : dateRange === 'month' || dateRange === '15days' ? currentDay : ''
  const bookings = allBookings.filter(booking => (!rangeStart || booking.booking_date >= rangeStart) && (!rangeEnd || booking.booking_date <= rangeEnd))
  const [rescheduleBooking, { isLoading: isRescheduling }] = useRescheduleBookingMutation()
  const [updateBookingStatus, { isLoading: isUpdatingStatus }] = useUpdateBookingStatusMutation()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleSlot, setScheduleSlot] = useState('')
  const [scheduleError, setScheduleError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null)
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceTax, setInvoiceTax] = useState('0')
  const [invoiceTotal, setInvoiceTotal] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('UNPAID')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'OTHER' | ''>('')
  const [invoiceError, setInvoiceError] = useState('')
  const [completeAfterInvoice, setCompleteAfterInvoice] = useState(false)
  const [createInvoice, { isLoading: isGeneratingInvoice }] = useCreateInvoiceMutation()
  const { data: slotData, isLoading: slotsLoading, error: slotsError } = useRescheduleSlotsQuery(
    { bookingId: selectedBooking?.id ?? 0, date: scheduleDate },
    { skip: !selectedBooking || !scheduleDate },
  )

  function openReschedule(booking: Booking) {
    setSelectedBooking(booking)
    setScheduleDate(booking.booking_date)
    setScheduleSlot(booking.slot_start.slice(0, 5))
    setScheduleError('')
  }

  function openInvoice(booking: Booking) {
    setInvoiceBooking(booking)
    setInvoiceAmount('')
    setInvoiceTax('0')
    setInvoiceTotal('')
    setPaymentStatus('UNPAID')
    setPaymentMethod('')
    setInvoiceError('')
    setCompleteAfterInvoice(false)
  }

  function openCompletionInvoice(booking: Booking) {
    openInvoice(booking)
    setCompleteAfterInvoice(true)
  }

  async function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!invoiceBooking) return
    let invoiceCreated = false
    const amount = Number(invoiceAmount)
    const tax = Number(invoiceTax)
    const total = Number(invoiceTotal)
    if (![amount, tax, total].every(value => Number.isFinite(value) && value >= 0)) {
      setInvoiceError('Enter valid non-negative bill amounts.')
      return
    }
    try {
      await createInvoice({ booking_id: invoiceBooking.id, amount, tax, total, payment_status: paymentStatus, payment_method: paymentMethod || null }).unwrap()
      invoiceCreated = true
      if (completeAfterInvoice) {
        await updateBookingStatus({ bookingId: invoiceBooking.id, status: 'COMPLETED' }).unwrap()
      }
      setInvoiceBooking(null)
      setCompleteAfterInvoice(false)
    } catch (error) {
      const apiError = error as { error?: string; data?: { message?: string } }
      if (invoiceCreated) {
        setInvoiceBooking(null)
        setCompleteAfterInvoice(false)
        setStatusError(apiError.data?.message || apiError.error || 'Invoice generated, but the service could not be completed.')
      } else {
        setInvoiceError(apiError.data?.message || apiError.error || 'Unable to generate invoice.')
      }
    }
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBooking || !scheduleSlot) return
    setScheduleError('')
    try {
      await rescheduleBooking({ bookingId: selectedBooking.id, booking_date: scheduleDate, slot_start: scheduleSlot }).unwrap()
      setSelectedBooking(null)
    } catch {
      setScheduleError('Could not reschedule this booking. The selected slot may have just filled up.')
    }
  }

  async function changeBookingStatus(booking: Booking, status: Booking['status']) {
    const prompt = status === 'COMPLETED'
      ? 'Mark this service as completed? This will add it to the vehicle service history.'
      : status === 'CANCELLED'
        ? 'Cancel this booking?'
        : 'Reopen this booking? Its original slot must still have capacity.'
    if (!window.confirm(prompt)) return
    setStatusError('')
    try {
      await updateBookingStatus({ bookingId: booking.id, status }).unwrap()
    } catch (error) {
      const apiError = error as { error?: string; data?: { message?: string } }
      setStatusError(apiError.data?.message || apiError.error || 'Could not update the booking.')
    }
  }

  async function changeAssignedStaff(staffId: number | null) {
    if (!detailBooking) return
    setAssignmentError('')
    try {
      const assignment = await assignBookingStaff({ bookingId: detailBooking.id, staffId }).unwrap()
      setDetailBooking(current => current ? { ...current, ...assignment } : current)
    } catch (error) {
      const apiError = error as { error?: string; data?: { message?: string } }
      setAssignmentError(apiError.data?.message || apiError.error || 'Unable to update the assigned staff member.')
    }
  }

  const activeStaff = staffAccounts.filter(member => member.isActive === true && member.role !== 'ADMIN')

  return <Page title="Completed services" subtitle={allowMutations ? "Search appointments, update their status, or reschedule a confirmed service request." : "View completed customer services."}>
    <div className="mb-4 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search customer, vehicle, phone, service..." className="w-64 max-w-full text-xs text-slate-700 outline-none" /></label><select aria-label="Filter appointments by date" value={dateRange} onChange={event => setDateRange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value="all">All dates</option><option value="today">Today</option><option value="15days">Last 15 days</option><option value="month">This month</option><option value="lastMonth">Last month</option><option value="custom">Custom date range</option></select>{dateRange === 'custom' && <><input type="date" aria-label="Appointment date from" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700" /><input type="date" aria-label="Appointment date through" value={dateTo} onChange={event => setDateTo(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700" /></>}{!completedOnly && <select aria-label="Filter bookings by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value="">All statuses</option><option value="CONFIRMED">Pending</option><option value="COMPLETED">Completed</option></select>}{(search || dateRange !== 'all' || statusFilter) && <button type="button" onClick={() => { setSearch(''); setDateRange('all'); setDateFrom(''); setDateTo(''); setStatusFilter('') }} className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Clear filters</button>}<div className="flex-1" />{allowCreate && <Link to="/book" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={15} />Create booking</Link>}</div>
    <Panel><div className="mb-4 flex items-center gap-2"><CalendarClock size={17} className="text-blue-600" /><h2 className="text-sm font-extrabold">Completed services</h2></div>
      {statusError && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{statusError}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Date and time', 'Customer', 'Vehicle', 'Service', ...(allowMutations ? ['Actions'] : [])].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{bookings.map(booking => <tr key={booking.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs font-bold">{new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString()} · {booking.slot_start.slice(0, 5)}</td><td className="pr-3 text-xs"><button type="button" onClick={() => { setDetailBooking(booking); setAssignmentError('') }} className="text-left font-semibold text-blue-700 hover:underline">{booking.customer_name}<small className="block font-normal text-slate-400">View appointment · {booking.booking_code}</small></button><small className="block text-slate-400">{booking.customer_phone}</small></td><td className="pr-3 text-xs">{booking.reg_number} · {booking.make} {booking.model}</td><td className="pr-3 text-xs">{booking.service_type}</td>{allowMutations && <td className="pr-3"><div className="flex items-center gap-1.5">{!booking.invoice_id && <button type="button" onClick={() => openInvoice(booking)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-50"><Receipt size={12} />Generate invoice</button>}{booking.invoice_id && <span className="text-[10px] font-semibold text-emerald-700">Invoice generated</span>}{booking.status === 'CONFIRMED' && <><button type="button" disabled={isUpdatingStatus} onClick={() => booking.invoice_id ? void changeBookingStatus(booking, 'COMPLETED') : openCompletionInvoice(booking)} className="rounded-lg border border-emerald-200 px-2.5 py-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">{booking.invoice_id ? 'Complete' : 'Invoice & complete'}</button><button type="button" disabled={isUpdatingStatus} onClick={() => void changeBookingStatus(booking, 'CANCELLED')} className="rounded-lg border border-rose-200 px-2.5 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Cancel</button><button type="button" onClick={() => openReschedule(booking)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-50">Reschedule</button></>}{booking.status === 'CANCELLED' && <button type="button" disabled={isUpdatingStatus} onClick={() => void changeBookingStatus(booking, 'CONFIRMED')} className="rounded-lg border border-blue-200 px-2.5 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">Reopen</button>}</div></td>}</tr>)}</tbody></table></div>
      {isFetching && <p className="pt-4 text-xs text-slate-400">Loading bookings…</p>}{error && <p role="alert" className="pt-4 text-xs text-rose-600">Unable to load bookings.</p>}{!isFetching && !error && bookings.length === 0 && <p className="pt-4 text-xs text-slate-400">No bookings found for these filters.</p>}
    </Panel>

    {detailBooking && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="appointment-details-title"><Panel className="max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Appointment details</p><h2 id="appointment-details-title" className="mt-1 text-lg font-extrabold">{detailBooking.booking_code}</h2></div><button type="button" onClick={() => setDetailBooking(null)} aria-label="Close appointment details" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><section className="rounded-xl border border-slate-100 p-4"><h3 className="text-xs font-extrabold text-slate-800">Customer</h3><p className="mt-2 text-sm font-semibold">{detailBooking.customer_name}</p><p className="mt-1 text-xs text-slate-500">{detailBooking.customer_phone}</p><p className="mt-1 text-xs text-slate-500">{detailBooking.customer_email || 'No email provided'}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">Contact: {detailBooking.contact_name} · {detailBooking.contact_phone}</p></section><section className="rounded-xl border border-slate-100 p-4"><h3 className="text-xs font-extrabold text-slate-800">Vehicle and service</h3><p className="mt-2 text-sm font-semibold">{detailBooking.reg_number} · {detailBooking.vehicle_name}</p><p className="mt-1 text-xs text-slate-500">{detailBooking.service_type}</p><p className="mt-3 text-xs text-slate-600">{new Date(`${detailBooking.booking_date}T00:00:00`).toLocaleDateString()} · {detailBooking.slot_start.slice(0, 5)}–{detailBooking.slot_end?.slice(0, 5)}</p><div className="mt-2"><Status status={statusLabel(detailBooking.status)} /></div></section><section className="rounded-xl border border-slate-100 p-4 sm:col-span-2"><h3 className="text-xs font-extrabold text-slate-800">Staff handling this appointment</h3>{allowMutations ? <p className="mt-2 text-sm">{detailBooking.assigned_staff_name || 'No staff assigned'}</p> : <><select aria-label="Assign staff member to appointment" value={detailBooking.assigned_staff_id ? String(detailBooking.assigned_staff_id) : ''} disabled={isAssigningStaff} onChange={event => void changeAssignedStaff(event.target.value ? Number(event.target.value) : null)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 sm:max-w-sm"><option value="">Unassigned</option>{activeStaff.map(member => <option key={String(member.id)} value={String(member.id)}>{String(member.name ?? '')} · {String(member.role ?? '')}</option>)}</select>{assignmentError && <p role="alert" className="mt-2 text-xs text-rose-600">{assignmentError}</p>}</>}</section><section className="rounded-xl border border-slate-100 p-4 sm:col-span-2"><h3 className="text-xs font-extrabold text-slate-800">Invoice</h3>{detailBooking.invoice_id ? <><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><p className="text-slate-500">Bill number <strong className="ml-1 text-slate-800">#{detailBooking.invoice_id}</strong></p><p className="text-slate-500">Payment status <strong className="ml-1 text-slate-800">{detailBooking.invoice_status || 'Unpaid'}</strong></p>{detailBooking.invoice_amount != null && <p className="text-slate-500">Service amount <strong className="ml-1 text-slate-800">₹{Number(detailBooking.invoice_amount).toLocaleString('en-IN')}</strong></p>}{detailBooking.invoice_tax != null && <p className="text-slate-500">Tax <strong className="ml-1 text-slate-800">₹{Number(detailBooking.invoice_tax).toLocaleString('en-IN')}</strong></p>}<p className="text-slate-500">Payment method <strong className="ml-1 text-slate-800">{detailBooking.invoice_method || 'Not specified'}</strong></p></div><p className="mt-3 border-t border-slate-100 pt-3 text-sm font-extrabold text-slate-900">Bill total: ₹{Number(detailBooking.invoice_total ?? 0).toLocaleString('en-IN')}</p></> : <p className="mt-2 text-xs text-slate-500">No invoice has been generated.</p>}</section></div></Panel></div>}

    {selectedBooking && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reschedule-title"><Panel className="w-full max-w-lg"><div className="flex items-start justify-between"><div><h2 id="reschedule-title" className="text-base font-extrabold">Reschedule booking</h2><p className="mt-1 text-xs text-slate-500">{selectedBooking.booking_code} · {selectedBooking.customer_name}</p></div><button type="button" onClick={() => setSelectedBooking(null)} aria-label="Close reschedule dialog" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100">✕</button></div>
      <form onSubmit={saveSchedule} className="mt-4"><label className="block text-xs font-bold text-slate-600">New date<input required type="date" min={today()} value={scheduleDate} onChange={event => { setScheduleDate(event.target.value); setScheduleSlot('') }} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" /></label>
        <p className="mt-4 text-xs font-bold text-slate-600">Available service slots</p>{slotsLoading ? <p className="mt-3 text-xs text-slate-400">Loading slots…</p> : <div className="mt-2 grid grid-cols-3 gap-2">{(slotData?.slots ?? []).map(slot => <button key={slot.slot_start} type="button" disabled={!slot.is_available} onClick={() => setScheduleSlot(slot.slot_start)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold ${scheduleSlot === slot.slot_start ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200'} disabled:cursor-not-allowed disabled:opacity-40`}>{slot.slot_start}</button>)}</div>}
        {!slotsLoading && scheduleDate && (slotData?.slots ?? []).every(slot => !slot.is_available) && <p className="mt-2 text-xs text-amber-700">No slots are available on this date.</p>}
        {slotsError && <p role="alert" className="mt-3 text-xs text-rose-600">Unable to load slots for this date. Please choose another date or refresh the page.</p>}{scheduleError && <p role="alert" className="mt-3 text-xs text-rose-600">{scheduleError}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setSelectedBooking(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button><button disabled={isRescheduling || !scheduleSlot} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isRescheduling ? 'Saving…' : 'Save new time'}</button></div>
      </form>
    </Panel></div>}
    {invoiceBooking && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="invoice-title"><Panel className="w-full max-w-lg"><div className="flex items-start justify-between"><div><h2 id="invoice-title" className="text-base font-extrabold">Generate invoice</h2><p className="mt-1 text-xs text-slate-500">{invoiceBooking.booking_code} · {invoiceBooking.customer_name} · {invoiceBooking.reg_number}</p></div><button type="button" onClick={() => setInvoiceBooking(null)} aria-label="Close invoice dialog" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100">✕</button></div>
      <form onSubmit={saveInvoice} className="mt-4 space-y-3">
        {completeAfterInvoice && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Generate the invoice to complete this service. The customer will receive an email after completion.</p>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Service amount<input required min="0" step="0.01" type="number" value={invoiceAmount} onChange={event => setInvoiceAmount(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-xs font-bold text-slate-600">Tax<input required min="0" step="0.01" type="number" value={invoiceTax} onChange={event => setInvoiceTax(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-xs font-bold text-slate-600">Bill total<input required min="0" step="0.01" type="number" value={invoiceTotal} onChange={event => setInvoiceTotal(event.target.value)} placeholder="Enter final total" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-xs font-bold text-slate-600">Payment status<select value={paymentStatus} onChange={event => setPaymentStatus(event.target.value as typeof paymentStatus)} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="UNPAID">Unpaid</option><option value="PAID">Paid</option></select></label><label className="text-xs font-bold text-slate-600 sm:col-span-2">Payment type<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as typeof paymentMethod)} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="">Not specified</option><option value="CASH">Cash</option><option value="CARD">Card</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option></select></label></div>
        {invoiceError && <p role="alert" className="text-xs text-rose-600">{invoiceError}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setInvoiceBooking(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button><button disabled={isGeneratingInvoice} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isGeneratingInvoice ? 'Generating…' : 'Generate invoice'}</button></div>
      </form>
    </Panel></div>}
  </Page>
}

export function BookingsPage({ allowCreate = false, allowMutations = false }: { allowCreate?: boolean; allowMutations?: boolean }) {
  if (allowMutations) return <StaffTodayServices allowCreate={allowCreate} />
  return <AdminBookingsPage allowCreate={allowCreate} allowMutations={allowMutations} />
}
