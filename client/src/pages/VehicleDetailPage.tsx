import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CarFront, Clock3, FileText, Pencil, Save, Trash2, UserRound, Wrench } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useDeleteVehicleMutation, useUpdateVehicleMutation, useVehicleDetailQuery } from '../store/api'

const formatDate = (value: string | null) => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : '—'
const titleCase = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())

export default function VehicleDetailPage({ readOnly = false }: { readOnly?: boolean }) {
  const { id } = useParams()
  const vehicleId = Number(id)
  const validId = Number.isInteger(vehicleId) && vehicleId > 0
  const navigate = useNavigate()
  const { data: vehicle, error, isLoading } = useVehicleDetailQuery(vehicleId, { skip: !validId })
  const [deleteVehicle, { isLoading: isDeleting, error: deleteError }] = useDeleteVehicleMutation()
  const [updateVehicle, { isLoading: isSavingDates }] = useUpdateVehicleMutation()
  const [dateMessage, setDateMessage] = useState('')
  const [dates, setDates] = useState({ insurance_expiry: '', puc_expiry: '', warranty_expiry: '', last_service_date: '', next_service_date: '', service_interval_days: '180' })

  useEffect(() => {
    if (!vehicle) return
    setDates({ insurance_expiry: vehicle.insurance_expiry || '', puc_expiry: vehicle.puc_expiry || '', warranty_expiry: vehicle.warranty_expiry || '', last_service_date: vehicle.last_service_date || '', next_service_date: vehicle.next_service_date || '', service_interval_days: String(vehicle.service_interval_days) })
  }, [vehicle])

  if (isLoading) return <Page title="Vehicle details" subtitle="Loading vehicle record…"><Panel><p className="text-xs text-slate-400">Loading vehicle details…</p></Panel></Page>
  if (error || !vehicle) return <Page title="Vehicle not found" subtitle="This vehicle record is unavailable."><Link to="/vehicles" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600"><ArrowLeft size={15} />Back to vehicles</Link></Page>
  const vehicleRecord = vehicle

  async function saveDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDateMessage('')
    try {
      await updateVehicle({ id: vehicleRecord.id, body: { ...dates, service_interval_days: Number(dates.service_interval_days), insurance_expiry: dates.insurance_expiry || null, puc_expiry: dates.puc_expiry || null, warranty_expiry: dates.warranty_expiry || null, last_service_date: dates.last_service_date || null, next_service_date: dates.next_service_date || null } }).unwrap()
      setDateMessage('Vehicle dates updated.')
    } catch {
      setDateMessage('Unable to update vehicle dates.')
    }
  }

  const setDateField = (field: keyof typeof dates, value: string) => setDates(current => ({ ...current, [field]: value }))

  return <Page title={vehicle.reg_number} subtitle={`${vehicle.make} ${vehicle.model}${vehicle.year ? ` · ${vehicle.year}` : ''}`}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link to="/vehicles" className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline"><ArrowLeft size={15} />Back to vehicles</Link>{!readOnly && <div className="flex flex-wrap gap-2"><Link to={`/vehicles/${vehicle.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white"><Pencil size={14} />Edit vehicle details</Link><button type="button" disabled={isDeleting} onClick={async () => { if (window.confirm(`Delete vehicle ${vehicle.reg_number}? Its bookings, reminders, and service history will also be removed.`)) { try { await deleteVehicle(vehicle.id).unwrap(); navigate('/vehicles') } catch { /* Error is shown below. */ } } }} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={14} />{isDeleting ? 'Deleting…' : 'Delete vehicle'}</button></div>}</div>
    {deleteError && <p role="alert" className="mb-4 text-xs text-rose-600">Unable to delete vehicle. Please try again.</p>}
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel><div className="mb-4 flex items-center gap-2"><CarFront size={18} className="text-blue-600" /><h2 className="text-sm font-extrabold">Vehicle information</h2></div><dl className="grid gap-4 sm:grid-cols-2">{[
        ['Registration', vehicle.reg_number], ['Make', vehicle.make], ['Model', vehicle.model], ['Year', vehicle.year ? String(vehicle.year) : 'Not provided'],
        ['Purchase date', formatDate(vehicle.purchase_date)],
      ].map(([label, value]) => <Info key={label} label={label} value={value} />)}</dl></Panel>

      <Panel><div className="mb-4 flex items-center gap-2"><UserRound size={18} className="text-blue-600" /><h2 className="text-sm font-extrabold">Customer details</h2></div><dl className="grid gap-4 sm:grid-cols-2"><Info label="Name" value={vehicle.customer.name} /><Info label="Phone" value={vehicle.customer.phone} /><Info label="Email" value={vehicle.customer.email || '—'} /><Info label="Address" value={vehicle.customer.address || '—'} /></dl><div className="mt-4 flex gap-2">{vehicle.customer.phone && <a href={`tel:${vehicle.customer.phone}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700">Call customer</a>}{vehicle.customer.email && <a href={`mailto:${vehicle.customer.email}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700">Email customer</a>}</div></Panel>
    </div>

    <Panel className="mt-4"><div className="mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600" /><h2 className="text-sm font-extrabold">Service and document dates</h2></div>{readOnly ? <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Info label="Last service" value={formatDate(vehicle.last_service_date)} /><Info label="Next service due" value={formatDate(vehicle.next_service_date)} /><Info label="Insurance expiry" value={formatDate(vehicle.insurance_expiry)} /><Info label="PUC expiry" value={formatDate(vehicle.puc_expiry)} /><Info label="Warranty expiry" value={formatDate(vehicle.warranty_expiry)} /><Info label="Service interval" value={`${vehicle.service_interval_days} days`} /></dl> : <form onSubmit={saveDates} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className="text-[11px] font-bold text-slate-600">Last service date<input type="date" value={dates.last_service_date} onChange={event => setDateField('last_service_date', event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-[11px] font-bold text-slate-600">Next service due<input type="date" value={dates.next_service_date} onChange={event => setDateField('next_service_date', event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-[11px] font-bold text-slate-600">Service interval (days)<input required type="number" min={30} value={dates.service_interval_days} onChange={event => setDateField('service_interval_days', event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-[11px] font-bold text-slate-600">Insurance expiry<input type="date" value={dates.insurance_expiry} onChange={event => setDateField('insurance_expiry', event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-[11px] font-bold text-slate-600">PUC expiry<input type="date" value={dates.puc_expiry} onChange={event => setDateField('puc_expiry', event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><label className="text-[11px] font-bold text-slate-600">Warranty expiry<input type="date" value={dates.warranty_expiry} onChange={event => setDateField('warranty_expiry', event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label><div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-3">{dateMessage && <p role="status" className={`text-xs ${dateMessage.startsWith('Unable') ? 'text-rose-600' : 'text-emerald-700'}`}>{dateMessage}</p>}<button disabled={isSavingDates} className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Save size={14} />{isSavingDates ? 'Saving…' : 'Save dates'}</button></div></form>}</Panel>

    <Panel className="mt-4"><div className="mb-4 flex items-center gap-2"><Wrench size={18} className="text-blue-600" /><h2 className="text-sm font-extrabold">Service history</h2></div>{vehicle.service_history.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Service date', 'Service', 'Cost', 'Notes'].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{vehicle.service_history.map(item => <tr key={item.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs font-semibold">{formatDate(item.service_date)}</td><td className="pr-3 text-xs">{item.service_type}</td><td className="pr-3 text-xs">₹{item.cost.toLocaleString('en-IN')}</td><td className="pr-3 text-xs text-slate-500">{item.notes || '—'}</td></tr>)}</tbody></table></div> : <p className="text-xs text-slate-400">No service history recorded.</p>}</Panel>

    <Panel className="mt-4"><div className="mb-4 flex items-center gap-2"><Clock3 size={18} className="text-blue-600" /><h2 className="text-sm font-extrabold">Bookings</h2></div>{vehicle.bookings.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Date and time', 'Booking', 'Service', 'Status'].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{vehicle.bookings.map(booking => <tr key={booking.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs">{formatDate(booking.booking_date)} · {booking.slot_start.slice(0, 5)}</td><td className="pr-3 text-xs font-semibold">{booking.booking_code}</td><td className="pr-3 text-xs">{booking.service_type}</td><td className="pr-3"><Status status={titleCase(booking.status)} /></td></tr>)}</tbody></table></div> : <p className="text-xs text-slate-400">No bookings recorded.</p>}</Panel>

  </Page>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 break-words text-xs font-semibold text-slate-700">{value}</dd></div>
}
