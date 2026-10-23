import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Page, Panel } from '../components/ui'
import { useRegisterVehicleWithCustomerMutation } from '../store/api'

export default function NewVehiclePage() {
  const navigate = useNavigate()
  const [registerVehicle, { isLoading }] = useRegisterVehicleWithCustomerMutation()
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' })
  const [vehicle, setVehicle] = useState({ reg_number: '', make: '', model: '', year: '', purchase_date: '', last_service_date: '', next_service_date: '', service_interval_days: '180', insurance_expiry: '', puc_expiry: '', warranty_expiry: '' })
  const [error, setError] = useState('')
  const updateCustomer = (key: keyof typeof customer, value: string) => setCustomer(current => ({ ...current, [key]: value }))
  const updateVehicle = (key: keyof typeof vehicle, value: string) => setVehicle(current => ({ ...current, [key]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await registerVehicle({
        customer: { name: customer.name.trim(), phone: customer.phone.trim(), email: customer.email.trim(), address: customer.address.trim() },
        vehicle: {
          reg_number: vehicle.reg_number.trim(), make: vehicle.make.trim(), model: vehicle.model.trim(), year: Number(vehicle.year),
          purchase_date: vehicle.purchase_date || undefined, last_service_date: vehicle.last_service_date || undefined,
          next_service_date: vehicle.next_service_date || undefined, service_interval_days: Number(vehicle.service_interval_days),
          insurance_expiry: vehicle.insurance_expiry || undefined, puc_expiry: vehicle.puc_expiry || undefined,
          warranty_expiry: vehicle.warranty_expiry || undefined,
        },
      }).unwrap()
      navigate('/vehicles')
    } catch {
      setError('Could not register this vehicle. Check the details and make sure its registration number is not already in use.')
    }
  }

  const inputClass = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  return <Page title="Add vehicle" subtitle="Create a customer profile and register their vehicle together.">
    <form onSubmit={submit} className="space-y-5">
      <Panel><h2 className="text-sm font-extrabold">Customer details</h2><p className="mt-1 text-xs text-slate-500">Contact information for the vehicle owner.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] font-bold text-slate-600">Full name<input required minLength={2} autoComplete="name" value={customer.name} onChange={event => updateCustomer('name', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Phone<input required minLength={7} autoComplete="tel" value={customer.phone} onChange={event => updateCustomer('phone', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Email (optional)<input type="email" autoComplete="email" value={customer.email} onChange={event => updateCustomer('email', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Address (optional)<input autoComplete="street-address" value={customer.address} onChange={event => updateCustomer('address', event.target.value)} className={inputClass} /></label>
      </div></Panel>

      <Panel><h2 className="text-sm font-extrabold">Vehicle details</h2><p className="mt-1 text-xs text-slate-500">Registration and service information used for reminders.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] font-bold text-slate-600">Registration number<input required minLength={3} value={vehicle.reg_number} onChange={event => updateVehicle('reg_number', event.target.value.toUpperCase())} className={`${inputClass} uppercase`} /></label>
        <label className="text-[11px] font-bold text-slate-600">Make<input required value={vehicle.make} onChange={event => updateVehicle('make', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Model<input required value={vehicle.model} onChange={event => updateVehicle('model', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Year<input required type="number" min={1980} max={2100} value={vehicle.year} onChange={event => updateVehicle('year', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Purchase date (optional)<input type="date" value={vehicle.purchase_date} onChange={event => updateVehicle('purchase_date', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Last service date (optional)<input type="date" value={vehicle.last_service_date} onChange={event => updateVehicle('last_service_date', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Next service due (optional)<input type="date" value={vehicle.next_service_date} onChange={event => updateVehicle('next_service_date', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Service interval (days)<input required type="number" min={30} value={vehicle.service_interval_days} onChange={event => updateVehicle('service_interval_days', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Insurance expiry (optional)<input type="date" value={vehicle.insurance_expiry} onChange={event => updateVehicle('insurance_expiry', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">PUC expiry (optional)<input type="date" value={vehicle.puc_expiry} onChange={event => updateVehicle('puc_expiry', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Warranty expiry (optional)<input type="date" value={vehicle.warranty_expiry} onChange={event => updateVehicle('warranty_expiry', event.target.value)} className={inputClass} /></label>
      </div></Panel>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2"><Link to="/vehicles" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</Link><button disabled={isLoading} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{isLoading ? 'Saving…' : 'Save customer and vehicle'}</button></div>
    </form>
  </Page>
}
