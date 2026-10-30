import { useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, CarFront, Search, X } from 'lucide-react'
import { Panel } from '../components/ui'
import { useCreateBookingMutation, useLazyVehicleLookupQuery, useServicesQuery, useSlotsQuery, type Vehicle } from '../store/api'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const errorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const value = error as { data?: { message?: string }; error?: string; message?: string }
    return value.data?.message || value.error || value.message || fallback
  }
  return fallback
}

export function StaffCreateServiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (bookingCode: string) => void }) {
  const [registration, setRegistration] = useState('')
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [date, setDate] = useState(today())
  const [slot, setSlot] = useState('')
  const [service, setService] = useState('')
  const [error, setError] = useState('')
  const [lookupVehicle, { isLoading: isLookingUp }] = useLazyVehicleLookupQuery()
  const { data: services = [], isLoading: servicesLoading } = useServicesQuery()
  const { data: slotData, isFetching: slotsLoading, error: slotsError } = useSlotsQuery(date, { skip: !date || !vehicle })
  const [createBooking, { isLoading: isSaving }] = useCreateBookingMutation()

  useEffect(() => {
    if (!service && services.length) setService(services[0].name)
  }, [service, services])

  async function findVehicle() {
    setError('')
    setVehicle(null)
    setSlot('')
    try {
      const result = await lookupVehicle(registration.trim().toUpperCase()).unwrap()
      setVehicle(result)
    } catch (cause) {
      setError(errorMessage(cause, 'Vehicle not found. Check the registration number.'))
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vehicle || !slot || !service) return
    setError('')
    try {
      const booking = await createBooking({
        reg_number: vehicle.reg_number,
        booking_date: date,
        slot_start: slot,
        contact_name: vehicle.customer_name,
        contact_phone: vehicle.customer_phone,
        contact_email: vehicle.customer_email || '',
        service_type: service,
      }).unwrap()
      onCreated(booking.booking_code)
    } catch (cause) {
      setError(errorMessage(cause, 'Could not create this service request.'))
    }
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-service-title">
    <Panel className="max-h-[92vh] w-full max-w-2xl overflow-y-auto shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Today’s services</p><h2 id="create-service-title" className="mt-1 text-lg font-extrabold">Create service booking</h2><p className="mt-1 text-xs text-slate-500">Find a registered vehicle and choose a service time.</p></div><button type="button" onClick={onClose} aria-label="Close create service form" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <section className="rounded-xl border border-slate-100 p-4"><h3 className="text-xs font-extrabold">Vehicle</h3><div className="mt-3 flex gap-2"><input value={registration} onChange={event => setRegistration(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void findVehicle() } }} placeholder="Maharashtra vehicle registration" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs uppercase outline-none focus:border-blue-400"/><button type="button" disabled={!registration.trim() || isLookingUp} onClick={() => void findVehicle()} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Search size={14}/>{isLookingUp ? 'Searching…' : 'Find'}</button></div>
          {vehicle && <div className="mt-3 flex items-start gap-3 rounded-xl bg-blue-50 p-3"><CarFront size={17} className="mt-0.5 text-blue-700"/><div className="text-xs"><p className="font-bold">{vehicle.reg_number} · {vehicle.make} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ''}</p><p className="mt-1 text-slate-600">{vehicle.customer_name} · {vehicle.customer_phone}</p></div></div>}
        </section>
        {vehicle && <><section className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Service type<select required value={service} onChange={event => setService(event.target.value)} disabled={servicesLoading} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="" disabled>Select service</option>{services.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Appointment date<input required type="date" min={today()} value={date} onChange={event => { setDate(event.target.value); setSlot('') }} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs" /></label></section>
          <section className="rounded-xl border border-slate-100 p-4"><h3 className="flex items-center gap-2 text-xs font-extrabold"><CalendarDays size={14} className="text-blue-600"/>Available time slots</h3>{slotsLoading ? <p className="mt-3 text-xs text-slate-400">Loading available times…</p> : slotData?.slots.length ? <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{slotData.slots.map(item => <button key={item.slot_start} type="button" disabled={!item.is_available} onClick={() => setSlot(item.slot_start)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold ${slot === item.slot_start ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'} disabled:cursor-not-allowed disabled:opacity-40`}>{item.slot_start}</button>)}</div> : <p className="mt-3 text-xs text-slate-400">No time slots are available for this date.</p>}{slotsError && <p role="alert" className="mt-2 text-xs text-rose-600">Unable to load available time slots.</p>}</section></>}
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Close</button><button type="submit" disabled={!vehicle || !slot || !service || isSaving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isSaving ? 'Creating…' : 'Create service'}</button></div>
      </form>
    </Panel>
  </div>
}
