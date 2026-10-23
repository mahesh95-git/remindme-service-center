import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Plus, Search } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useBookingsQuery, useRescheduleBookingMutation, useRescheduleSlotsQuery, useUpdateBookingStatusMutation } from '../store/api'
import type { Booking } from '../store/api'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const statusLabel = (status: Booking['status']) => status === 'CONFIRMED' ? 'Confirmed' : status === 'CANCELLED' ? 'Cancelled' : 'Completed'

export function BookingsPage({ allowCreate = false }: { allowCreate?: boolean }) {
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { currentData: bookings = [], error, isFetching } = useBookingsQuery({ search, date: dateFilter || undefined, status: statusFilter ? statusFilter as Booking['status'] : undefined })
  const [rescheduleBooking, { isLoading: isRescheduling }] = useRescheduleBookingMutation()
  const [updateBookingStatus, { isLoading: isUpdatingStatus }] = useUpdateBookingStatusMutation()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleSlot, setScheduleSlot] = useState('')
  const [scheduleError, setScheduleError] = useState('')
  const [statusError, setStatusError] = useState('')
  const { data: slotData, isLoading: slotsLoading } = useRescheduleSlotsQuery(
    { bookingId: selectedBooking?.id ?? 0, date: scheduleDate },
    { skip: !selectedBooking || !scheduleDate },
  )

  function openReschedule(booking: Booking) {
    setSelectedBooking(booking)
    setScheduleDate(booking.booking_date)
    setScheduleSlot(booking.slot_start.slice(0, 5))
    setScheduleError('')
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
    } catch {
      setStatusError('Could not update the booking. A slot may be full, or the booking may have changed.')
    }
  }

  return <Page title="Bookings" subtitle="Search appointments, update their status, or reschedule a confirmed booking.">
    <div className="mb-4 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search customer, vehicle, phone, booking..." className="w-64 max-w-full text-xs text-slate-700 outline-none" /></label><label className="text-[11px] font-semibold text-slate-500">Date<input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700" /></label><select aria-label="Filter bookings by status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><option value="">All statuses</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select>{(search || dateFilter || statusFilter) && <button type="button" onClick={() => { setSearch(''); setDateFilter(''); setStatusFilter('') }} className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">Clear filters</button>}<div className="flex-1" />{allowCreate && <Link to="/book" className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={15} />Create booking</Link>}</div>
    <Panel><div className="mb-4 flex items-center gap-2"><CalendarClock size={17} className="text-blue-600" /><h2 className="text-sm font-extrabold">Appointment list</h2></div>
      {statusError && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{statusError}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Date and time', 'Customer', 'Vehicle', 'Service', 'Status', 'Actions'].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{bookings.map(booking => <tr key={booking.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs font-bold">{new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString()} · {booking.slot_start.slice(0, 5)}</td><td className="pr-3 text-xs"><span className="font-semibold">{booking.customer_name}</span><small className="block text-slate-400">{booking.booking_code} · {booking.customer_phone}</small></td><td className="pr-3 text-xs">{booking.reg_number} · {booking.make} {booking.model}</td><td className="pr-3 text-xs">{booking.service_type}</td><td className="pr-3"><Status status={statusLabel(booking.status)} /></td><td className="pr-3"><div className="flex items-center gap-1.5">{booking.status === 'CONFIRMED' && <><button type="button" disabled={isUpdatingStatus} onClick={() => void changeBookingStatus(booking, 'COMPLETED')} className="rounded-lg border border-emerald-200 px-2.5 py-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Complete</button><button type="button" disabled={isUpdatingStatus} onClick={() => void changeBookingStatus(booking, 'CANCELLED')} className="rounded-lg border border-rose-200 px-2.5 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Cancel</button><button type="button" onClick={() => openReschedule(booking)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-50">Reschedule</button></>}{booking.status === 'CANCELLED' && <button type="button" disabled={isUpdatingStatus} onClick={() => void changeBookingStatus(booking, 'CONFIRMED')} className="rounded-lg border border-blue-200 px-2.5 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">Reopen</button>}</div></td></tr>)}</tbody></table></div>
      {isFetching && <p className="pt-4 text-xs text-slate-400">Loading bookings…</p>}{error && <p role="alert" className="pt-4 text-xs text-rose-600">Unable to load bookings.</p>}{!isFetching && !error && bookings.length === 0 && <p className="pt-4 text-xs text-slate-400">No bookings found for these filters.</p>}
    </Panel>

    {selectedBooking && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reschedule-title"><Panel className="w-full max-w-lg"><div className="flex items-start justify-between"><div><h2 id="reschedule-title" className="text-base font-extrabold">Reschedule booking</h2><p className="mt-1 text-xs text-slate-500">{selectedBooking.booking_code} · {selectedBooking.customer_name}</p></div><button type="button" onClick={() => setSelectedBooking(null)} aria-label="Close reschedule dialog" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100">✕</button></div>
      <form onSubmit={saveSchedule} className="mt-4"><label className="block text-xs font-bold text-slate-600">New date<input required type="date" min={today()} value={scheduleDate} onChange={event => { setScheduleDate(event.target.value); setScheduleSlot('') }} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" /></label>
        <p className="mt-4 text-xs font-bold text-slate-600">Available service slots</p>{slotsLoading ? <p className="mt-3 text-xs text-slate-400">Loading slots…</p> : <div className="mt-2 grid grid-cols-3 gap-2">{(slotData?.slots ?? []).map(slot => <button key={slot.slot_start} type="button" disabled={!slot.is_available} onClick={() => setScheduleSlot(slot.slot_start)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold ${scheduleSlot === slot.slot_start ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200'} disabled:cursor-not-allowed disabled:opacity-40`}>{slot.slot_start}</button>)}</div>}
        {!slotsLoading && scheduleDate && (slotData?.slots ?? []).every(slot => !slot.is_available) && <p className="mt-2 text-xs text-amber-700">No slots are available on this date.</p>}
        {scheduleError && <p role="alert" className="mt-3 text-xs text-rose-600">{scheduleError}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setSelectedBooking(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button><button disabled={isRescheduling || !scheduleSlot} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isRescheduling ? 'Saving…' : 'Save new time'}</button></div>
      </form>
    </Panel></div>}
  </Page>
}
