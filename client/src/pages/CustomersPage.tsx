import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Panel } from '../components/ui'
import { useRegisterVehicleWithCustomerMutation } from '../store/api'
import { RecordsPage } from '../features/records/RecordsPage'

type CustomerInput = { name: string; phone: string; email: string; address: string }
type VehicleInput = { reg_number: string; make: string; model: string; last_service_date: string; next_service_date: string; service_interval_days: string; insurance_expiry: string; puc_expiry: string; warranty_expiry: string }

const emptyCustomer: CustomerInput = { name: '', phone: '', email: '', address: '' }
const emptyVehicle: VehicleInput = { reg_number: '', make: '', model: '', last_service_date: '', next_service_date: '', service_interval_days: '180', insurance_expiry: '', puc_expiry: '', warranty_expiry: '' }
const vehicleMakes = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'Renault', 'Volkswagen', 'Skoda', 'MG', 'Nissan', 'Jeep', 'Citroën', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Lexus', 'BYD', 'Isuzu', 'Force Motors', 'Other']
const inputClass = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

function AddCustomerWithVehicle() {
  const [isOpen, setIsOpen] = useState(false)
  const [customer, setCustomer] = useState(emptyCustomer)
  const [vehicle, setVehicle] = useState(emptyVehicle)
  const [customMake, setCustomMake] = useState('')
  const [error, setError] = useState('')
  const [registerVehicle, { isLoading }] = useRegisterVehicleWithCustomerMutation()

  const updateCustomer = (field: keyof CustomerInput, value: string) => setCustomer(current => ({ ...current, [field]: value }))
  const updateVehicle = (field: keyof VehicleInput, value: string) => setVehicle(current => ({ ...current, [field]: value }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await registerVehicle({
        customer: { name: customer.name.trim(), phone: customer.phone.trim(), email: customer.email.trim(), address: customer.address.trim() },
        vehicle: {
          reg_number: vehicle.reg_number.trim(), make: (vehicle.make === 'Other' ? customMake : vehicle.make).trim(), model: vehicle.model.trim(),
          last_service_date: vehicle.last_service_date || undefined,
          next_service_date: vehicle.next_service_date || undefined, service_interval_days: Number(vehicle.service_interval_days),
          insurance_expiry: vehicle.insurance_expiry || undefined, puc_expiry: vehicle.puc_expiry || undefined,
          warranty_expiry: vehicle.warranty_expiry || undefined,
        },
      }).unwrap()
      setCustomer(emptyCustomer)
      setVehicle(emptyVehicle)
      setCustomMake('')
      setIsOpen(false)
    } catch (cause) {
      const apiError = cause as { error?: string; data?: { message?: string } }
      setError(apiError.data?.message || apiError.error || 'Unable to add this customer and vehicle. Check the details and try again.')
    }
  }

  return <>
    <button type="button" onClick={() => { setError(''); setIsOpen(true) }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"><Plus size={15} />Add customer &amp; vehicle</button>
    {isOpen && <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="add-customer-title">
      <Panel className="my-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h2 id="add-customer-title" className="text-lg font-extrabold">Add customer and vehicle</h2><p className="mt-1 text-xs text-slate-500">Save the customer profile and their first vehicle together.</p></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Close add customer form" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <section className="rounded-2xl border border-slate-100 p-4"><h3 className="text-sm font-extrabold">Customer details</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[11px] font-bold text-slate-600">Full name<input required minLength={2} autoComplete="name" value={customer.name} onChange={event => updateCustomer('name', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Phone<input required minLength={7} autoComplete="tel" value={customer.phone} onChange={event => updateCustomer('phone', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Email (optional)<input type="email" autoComplete="email" value={customer.email} onChange={event => updateCustomer('email', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Address (optional)<input autoComplete="street-address" value={customer.address} onChange={event => updateCustomer('address', event.target.value)} className={inputClass} /></label>
          </div></section>
          <section className="rounded-2xl border border-slate-100 p-4"><h3 className="text-sm font-extrabold">Vehicle details</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[11px] font-bold text-slate-600">Registration number<input required minLength={3} value={vehicle.reg_number} onChange={event => updateVehicle('reg_number', event.target.value.toUpperCase())} className={`${inputClass} uppercase`} /></label>
            <label className="text-[11px] font-bold text-slate-600">Make<select required value={vehicle.make} onChange={event => { updateVehicle('make', event.target.value); setCustomMake('') }} className={inputClass}><option value="">Select make</option>{vehicleMakes.map(make => <option key={make} value={make}>{make}</option>)}</select></label>
            {vehicle.make === 'Other' && <label className="text-[11px] font-bold text-slate-600">Enter make<input required value={customMake} onChange={event => setCustomMake(event.target.value)} className={inputClass} /></label>}
            <label className="text-[11px] font-bold text-slate-600">Model<input required value={vehicle.model} onChange={event => updateVehicle('model', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Last service date (optional)<input type="date" value={vehicle.last_service_date} onChange={event => updateVehicle('last_service_date', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Next service due (optional)<input type="date" value={vehicle.next_service_date} onChange={event => updateVehicle('next_service_date', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Service interval (days)<input required type="number" min={30} value={vehicle.service_interval_days} onChange={event => updateVehicle('service_interval_days', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Insurance expiry<input type="date" value={vehicle.insurance_expiry} onChange={event => updateVehicle('insurance_expiry', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">PUC expiry<input type="date" value={vehicle.puc_expiry} onChange={event => updateVehicle('puc_expiry', event.target.value)} className={inputClass} /></label>
            <label className="text-[11px] font-bold text-slate-600">Warranty expiry<input type="date" value={vehicle.warranty_expiry} onChange={event => updateVehicle('warranty_expiry', event.target.value)} className={inputClass} /></label>
          </div></section>
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button><button disabled={isLoading} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{isLoading ? 'Saving…' : 'Save customer and vehicle'}</button></div>
        </form>
      </Panel>
    </div>}
  </>
}

export default function CustomersPage() {
  return <RecordsPage kind="customers" action={<AddCustomerWithVehicle />} />
}
