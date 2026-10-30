import { FormEvent, useState } from 'react'
import { Image as ImageIcon, Receipt, Search, Wrench, X } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useLazyVehicleDetailQuery, useLazyVehicleLookupQuery } from '../store/api'
import type { VehicleDetail } from '../store/api'

export default function ServiceHistoryPage() {
  const [registration, setRegistration] = useState('')
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null)
  const [error, setError] = useState('')
  const [invoicePhoto, setInvoicePhoto] = useState<string | null>(null)
  const [lookup, { isFetching: isLookingUp }] = useLazyVehicleLookupQuery()
  const [loadDetail, { isFetching: isLoading }] = useLazyVehicleDetailQuery()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!registration.trim()) return
    setError('')
    setVehicle(null)
    try {
      const result = await lookup(registration.trim()).unwrap()
      setVehicle(await loadDetail(result.id).unwrap())
    } catch {
      setError('Vehicle not found. Check the registration number and try again.')
    }
  }

  return <Page title="Service history & bills" subtitle="Find a vehicle by registration number and view its service history and generated bills.">
    <Panel>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <label className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400"><Search size={15} /><input value={registration} onChange={event => setRegistration(event.target.value.toUpperCase())} placeholder="Enter vehicle number" className="w-full text-xs text-slate-700 outline-none" /></label>
        <button type="submit" disabled={isLookingUp || isLoading || !registration.trim()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isLookingUp || isLoading ? 'Searching…' : 'Search vehicle'}</button>
      </form>
      {error && <p role="alert" className="mt-3 text-xs text-rose-600">{error}</p>}
      {vehicle && <div className="mt-5 space-y-5">
        <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-sm font-extrabold">{vehicle.reg_number} · {vehicle.make} {vehicle.model}</p><p className="mt-1 text-xs text-slate-500">Customer: {vehicle.customer.name} · {vehicle.customer.phone}</p></div>
        <section><div className="mb-3 flex items-center gap-2"><Wrench size={16} className="text-blue-600" /><h2 className="text-xs font-extrabold">Service history</h2></div>{vehicle.service_history.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Date', 'Service', 'Cost', 'Notes'].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{vehicle.service_history.map(item => <tr key={item.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs font-semibold">{new Date(`${item.service_date}T00:00:00`).toLocaleDateString()}</td><td className="pr-3 text-xs">{item.service_type}</td><td className="pr-3 text-xs">₹{item.cost.toLocaleString('en-IN')}</td><td className="pr-3 text-xs text-slate-500">{item.notes || '—'}</td></tr>)}</tbody></table></div> : <p className="text-xs text-slate-400">No service history found.</p>}</section>
        <section><div className="mb-3 flex items-center gap-2"><Receipt size={16} className="text-blue-600" /><h2 className="text-xs font-extrabold">Generated bills</h2></div>{vehicle.bookings.some(booking => booking.invoice) ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b text-[10px] uppercase text-slate-400">{['Bill', 'Booking', 'Service date', 'Service', 'Total', 'Status', 'Invoice photo'].map(label => <th key={label} className="pb-3 pr-3">{label}</th>)}</tr></thead><tbody>{vehicle.bookings.filter(booking => booking.invoice).map(booking => <tr key={booking.id} className="border-b last:border-0"><td className="py-3 pr-3 text-xs font-semibold">#{booking.invoice?.id}</td><td className="pr-3 text-xs">{booking.booking_code}</td><td className="pr-3 text-xs">{booking.booking_date ? new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString() : '—'}</td><td className="pr-3 text-xs">{booking.service_type}</td><td className="pr-3 text-xs font-semibold">₹{booking.invoice?.total.toLocaleString('en-IN')}</td><td className="pr-3"><Status status={booking.invoice?.payment_status === 'PAID' ? 'Paid' : 'Unpaid'} /></td><td className="pr-3">{booking.invoice_photo_url ? <button type="button" onClick={() => setInvoicePhoto(booking.invoice_photo_url)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50"><ImageIcon size={12}/>View photo</button> : <span className="text-[10px] text-slate-400">No photo</span>}</td></tr>)}</tbody></table></div> : <p className="text-xs text-slate-400">No generated bills found.</p>}</section>
      </div>}
    </Panel>
    {invoicePhoto && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-4" role="dialog" aria-modal="true" aria-label="Invoice photo"><Panel className="relative max-h-[92vh] w-full max-w-3xl overflow-auto p-3"><button type="button" onClick={() => setInvoicePhoto(null)} aria-label="Close invoice photo" className="absolute right-4 top-4 z-10 rounded-lg bg-white/90 p-2 text-slate-600 shadow hover:bg-white"><X size={18}/></button><img src={invoicePhoto} alt="Service invoice" className="mx-auto max-h-[85vh] w-auto rounded-lg object-contain" /></Panel></div>}
  </Page>
}
