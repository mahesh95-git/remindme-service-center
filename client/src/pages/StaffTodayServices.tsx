import { useEffect, useState, type ChangeEvent } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Plus, Search, Upload, X } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useBookingsQuery, useCompleteBookingMutation, useInvoiceUploadSignatureMutation, useVehicleDetailQuery } from '../store/api'
import type { Booking } from '../store/api'
import { StaffCreateServiceModal } from './StaffCreateServiceModal'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const dateAfterDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function StaffTodayServices({ allowCreate = false }: { allowCreate?: boolean }) {
  const [search, setSearch] = useState('')
  const { currentData: bookings = [], isFetching, error } = useBookingsQuery({ date: today(), search })
  const [selected, setSelected] = useState<Booking | null>(null)
  const [invoicePhoto, setInvoicePhoto] = useState<File | null>(null)
  const [totalBill, setTotalBill] = useState('')
  const [nextServiceDate, setNextServiceDate] = useState('')
  const [message, setMessage] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [completeBooking, { isLoading: isCompleting }] = useCompleteBookingMutation()
  const [getUploadSignature] = useInvoiceUploadSignatureMutation()
  const { data: vehicle, isFetching: vehicleLoading } = useVehicleDetailQuery(selected?.vehicle_id ?? 0, { skip: !selected })

  useEffect(() => {
    if (vehicle) setNextServiceDate(dateAfterDays(vehicle.service_interval_days || 180))
  }, [vehicle?.id, vehicle?.service_interval_days])

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setMessage('')
    if (file && !file.type.startsWith('image/')) { setMessage('Choose an image file for the invoice.'); setInvoicePhoto(null); return }
    if (file && file.size > 10 * 1024 * 1024) { setMessage('Invoice photo must be 10 MB or smaller.'); setInvoicePhoto(null); return }
    setInvoicePhoto(file)
  }

  async function finishService() {
    if (!selected || !invoicePhoto) { setMessage('Add an invoice photo before completing this service.'); return }
    if (!totalBill || !Number.isFinite(Number(totalBill)) || Number(totalBill) < 0) { setMessage('Enter a valid total bill amount.'); return }
    setMessage('')
    try {
      const signature = await getUploadSignature().unwrap()
      const form = new FormData()
      form.append('file', invoicePhoto)
      form.append('api_key', signature.api_key)
      form.append('timestamp', String(signature.timestamp))
      form.append('folder', signature.folder)
      form.append('signature', signature.signature)
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloud_name)}/image/upload`, { method: 'POST', body: form })
      const uploaded = await uploadResponse.json() as { secure_url?: string; error?: { message?: string } }
      if (!uploadResponse.ok || !uploaded.secure_url) throw new Error(uploaded.error?.message || 'Invoice photo upload failed.')
      const result = await completeBooking({ bookingId: selected.id, invoicePhotoUrl: uploaded.secure_url, nextServiceDate, totalBill: Number(totalBill) }).unwrap()
      setSelected(null)
      setInvoicePhoto(null)
      setTotalBill('')
      setMessage(result.email_sent ? 'Service completed and customer email sent.' : `Service completed. Customer email was not sent${result.email_error ? `: ${result.email_error}` : '.'}`)
    } catch (error) {
      const apiError = error as { data?: { message?: string }; error?: string; message?: string }
      setMessage(apiError.data?.message || apiError.error || apiError.message || 'Could not complete the service.')
    }
  }

  return <Page title="Today’s services" subtitle="View today’s appointments and record each completed service.">
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600"><CalendarDays size={15} className="text-blue-600" />{new Date(`${today()}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, vehicle, phone…" className="w-64 max-w-full text-xs text-slate-700 outline-none" /></label>
      <div className="flex-1" />
      {allowCreate && <button type="button" onClick={() => { setMessage(''); setCreateOpen(true) }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={15} />Create new service</button>}
    </div>
    {message && !selected && <p role="status" className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">{message}</p>}
    <Panel>
      <div className="mb-4 flex items-center gap-2"><Clock3 size={17} className="text-blue-600"/><h2 className="text-sm font-extrabold">Today’s appointments <span className="ml-1 text-slate-400">{bookings.length}</span></h2></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Time', 'Customer', 'Vehicle', 'Service', 'Status'].map(x => <th key={x} className="pb-3 pr-4">{x}</th>)}</tr></thead><tbody>{bookings.map(b => <tr key={b.id} className="border-b last:border-0"><td className="py-3 pr-4 text-xs font-bold">{b.slot_start.slice(0, 5)}</td><td className="pr-4 text-xs"><button type="button" onClick={() => { setSelected(b); setInvoicePhoto(null); setTotalBill(''); setNextServiceDate(''); setMessage('') }} className="text-left font-semibold text-blue-700 hover:underline">{b.customer_name}</button><small className="block text-slate-400">{b.customer_phone}</small></td><td className="pr-4 text-xs">{b.reg_number}<small className="block text-slate-400">{b.make} {b.model}</small></td><td className="pr-4 text-xs">{b.service_type}</td><td className="pr-4"><Status status={b.status === 'COMPLETED' ? 'Completed' : b.status === 'CANCELLED' ? 'Cancelled' : 'Pending'} />{b.status === 'COMPLETED' && <small className="mt-1 block font-semibold text-emerald-700">Invoice paid</small>}</td></tr>)}</tbody></table></div>
      {isFetching && <p className="pt-4 text-xs text-slate-400">Loading today’s services…</p>}{error && <p role="alert" className="pt-4 text-xs text-rose-600">Unable to load today’s services.</p>}{!isFetching && !error && !bookings.length && <p className="pt-4 text-xs text-slate-400">No services are scheduled for today.</p>}
    </Panel>
    {selected && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="today-service-title"><Panel className="max-h-[92vh] w-full max-w-3xl overflow-y-auto shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Service appointment</p><h2 id="today-service-title" className="mt-1 text-lg font-extrabold">{selected.booking_code}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><section className="rounded-xl border border-slate-100 p-4"><h3 className="text-xs font-extrabold">Customer</h3><p className="mt-2 text-sm font-semibold">{selected.customer_name}</p><p className="mt-1 text-xs text-slate-500">{selected.customer_phone}</p></section><section className="rounded-xl border border-slate-100 p-4"><h3 className="text-xs font-extrabold">Appointment</h3><p className="mt-2 text-sm font-semibold">{selected.service_type}</p><p className="mt-1 text-xs text-slate-500">{selected.booking_date} · {selected.slot_start.slice(0,5)}–{selected.slot_end?.slice(0,5)}</p><p className="mt-1 text-xs text-slate-500">Handled by: {selected.assigned_staff_name || 'Not assigned'}</p></section>
      <section className="rounded-xl border border-slate-100 p-4 sm:col-span-2"><h3 className="text-xs font-extrabold">Vehicle details</h3>{vehicleLoading ? <p className="mt-2 text-xs text-slate-400">Loading vehicle…</p> : vehicle && <><div className="mt-2 grid gap-2 text-xs sm:grid-cols-3"><p>Registration: <b>{vehicle.reg_number}</b></p><p>Make / model: <b>{vehicle.make} {vehicle.model}</b></p><p>Year: <b>{vehicle.year ?? 'Not recorded'}</b></p><p>Last service: <b>{vehicle.last_service_date || 'Not recorded'}</b></p><p>Next service: <b>{vehicle.next_service_date || 'Not scheduled'}</b></p><p>Insurance expiry: <b>{vehicle.insurance_expiry || 'Not recorded'}</b></p><p>PUC expiry: <b>{vehicle.puc_expiry || 'Not recorded'}</b></p><p>Warranty expiry: <b>{vehicle.warranty_expiry || 'Not recorded'}</b></p></div><h4 className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-bold">Service history</h4>{vehicle.service_history.length ? <div className="mt-2 space-y-2">{vehicle.service_history.map(row => <p key={row.id} className="flex justify-between gap-3 text-xs"><span>{row.service_type}</span><span className="text-slate-500">{row.service_date?.slice(0,10) || '—'} · ₹{Number(row.cost).toLocaleString('en-IN')}</span></p>)}</div> : <p className="mt-2 text-xs text-slate-400">No previous service records.</p>}</>}</section></div>
      {selected.status === 'CONFIRMED' ? <div className="mt-5 rounded-xl border border-slate-100 p-4"><h3 className="text-xs font-extrabold">Complete service</h3><p className="mt-1 text-xs text-slate-500">Enter the final bill. The completion date updates the vehicle’s previous service date. Set its next service date and add an invoice photo; the customer gets the amount and photo link by email.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="block text-xs font-semibold text-slate-600">Total bill (₹)<input required type="number" min="0" step="0.01" value={totalBill} onChange={event => setTotalBill(event.target.value)} placeholder="Enter total amount" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="block text-xs font-semibold text-slate-600">Next service date<input required type="date" min={today()} value={nextServiceDate} onChange={event => setNextServiceDate(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label></div><label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Upload size={15}/>{invoicePhoto ? invoicePhoto.name : 'Choose invoice photo'}<input type="file" accept="image/*" onChange={selectPhoto} className="sr-only" /></label>{message && <p role="alert" className="mt-2 text-xs text-rose-600">{message}</p>}<button type="button" disabled={isCompleting || !nextServiceDate || totalBill === ''} onClick={() => void finishService()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={15}/>{isCompleting ? 'Completing…' : 'Complete service'}</button></div> : <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">This service is {selected.status.toLowerCase()}.</p>}
      </Panel></div>}
    {createOpen && <StaffCreateServiceModal onClose={() => setCreateOpen(false)} onCreated={bookingCode => { setCreateOpen(false); setMessage(`Service booking ${bookingCode} created.`) }} />}
  </Page>
}
