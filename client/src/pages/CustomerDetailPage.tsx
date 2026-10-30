import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CarFront, Mail, Pencil, Phone, Plus, UserRound, Wrench, X } from 'lucide-react'
import { Page, Panel } from '../components/ui'
import { useCreateVehicleMutation, useCustomerDetailQuery, useUpdateCustomerMutation } from '../store/api'
import { useAppSelector } from '../store/hooks'

const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : '—'
const inputClass = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
const vehicleMakes = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'Renault', 'Volkswagen', 'Skoda', 'MG', 'Nissan', 'Jeep', 'Citroën', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Lexus', 'BYD', 'Isuzu', 'Force Motors', 'Other']
type CustomerForm = { name: string; phone: string; email: string; address: string }
type VehicleForm = { reg_number: string; make: string; model: string; service_interval_days: string; last_service_date: string; next_service_date: string; insurance_expiry: string; puc_expiry: string; warranty_expiry: string }
const emptyVehicle: VehicleForm = { reg_number: '', make: '', model: '', service_interval_days: '180', last_service_date: '', next_service_date: '', insurance_expiry: '', puc_expiry: '', warranty_expiry: '' }

export default function CustomerDetailPage() {
  const { id } = useParams()
  const customerId = Number(id)
  const validId = Number.isInteger(customerId) && customerId > 0
  const isAdmin = useAppSelector(state => state.auth.role === 'ADMIN')
  const { data: customer, error: loadError, isLoading } = useCustomerDetailQuery(customerId, { skip: !validId })
  const [updateCustomer, { isLoading: isSavingCustomer }] = useUpdateCustomerMutation()
  const [createVehicle, { isLoading: isSavingVehicle }] = useCreateVehicleMutation()
  const [customerForm, setCustomerForm] = useState<CustomerForm>({ name: '', phone: '', email: '', address: '' })
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [customMake, setCustomMake] = useState('')
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)
  const [isAddingVehicle, setIsAddingVehicle] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!customer) return
    setCustomerForm({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '' })
  }, [customer])

  if (isLoading) return <Page title="Customer details" subtitle="Loading customer information…"><Panel><p className="text-xs text-slate-400">Loading customer details…</p></Panel></Page>
  if (loadError || !customer) return <Page title="Customer not found" subtitle="This customer record is unavailable."><Link to="/customers" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600"><ArrowLeft size={15} />Back to customers</Link></Page>
  const customerRecord = customer

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateCustomer({ id: customerRecord.id, body: { name: customerForm.name.trim(), phone: customerForm.phone.trim(), email: customerForm.email.trim(), address: customerForm.address.trim() } }).unwrap()
      setIsEditingCustomer(false)
      setSuccessMessage('Customer details updated.')
    } catch (cause) {
      const apiError = cause as { error?: string; data?: { message?: string } }
      setErrorMessage(apiError.data?.message || apiError.error || 'Unable to update customer details.')
    }
  }

  async function saveVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await createVehicle({
        customer_id: customerRecord.id,
        reg_number: vehicleForm.reg_number.trim(),
        make: (vehicleForm.make === 'Other' ? customMake : vehicleForm.make).trim(),
        model: vehicleForm.model.trim(),
        service_interval_days: Number(vehicleForm.service_interval_days),
        last_service_date: vehicleForm.last_service_date || undefined,
        next_service_date: vehicleForm.next_service_date || undefined,
        insurance_expiry: vehicleForm.insurance_expiry || undefined,
        puc_expiry: vehicleForm.puc_expiry || undefined,
        warranty_expiry: vehicleForm.warranty_expiry || undefined,
      }).unwrap()
      setVehicleForm(emptyVehicle)
      setCustomMake('')
      setIsAddingVehicle(false)
      setSuccessMessage('Vehicle added to this customer.')
    } catch (cause) {
      const apiError = cause as { error?: string; data?: { message?: string } }
      setErrorMessage(apiError.data?.message || apiError.error || 'Unable to add this vehicle. Check that its registration number is not already in use.')
    }
  }

  const setCustomerField = (field: keyof CustomerForm, value: string) => setCustomerForm(current => ({ ...current, [field]: value }))
  const setVehicleField = (field: keyof VehicleForm, value: string) => setVehicleForm(current => ({ ...current, [field]: value }))

  return <Page title={customer.name} subtitle="Customer profile, vehicles, and service history">
    <Link to="/customers" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline"><ArrowLeft size={15} />Back to customers</Link>
    {successMessage && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">{successMessage}</p>}
    {errorMessage && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">{errorMessage}</p>}
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Panel>
        <div className="mb-4 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><UserRound size={18} className="text-blue-600" /><h2 className="text-sm font-extrabold">Customer information</h2></div>{!isAdmin && !isEditingCustomer && <button type="button" onClick={() => { setErrorMessage(''); setIsEditingCustomer(true) }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"><Pencil size={13} />Edit</button>}</div>
        {isEditingCustomer ? <form onSubmit={saveCustomer} className="space-y-3"><label className="block text-[11px] font-bold text-slate-600">Full name<input required minLength={2} value={customerForm.name} onChange={event => setCustomerField('name', event.target.value)} className={inputClass} /></label><label className="block text-[11px] font-bold text-slate-600">Phone<input required minLength={7} value={customerForm.phone} onChange={event => setCustomerField('phone', event.target.value)} className={inputClass} /></label><label className="block text-[11px] font-bold text-slate-600">Email<input type="email" value={customerForm.email} onChange={event => setCustomerField('email', event.target.value)} className={inputClass} /></label><label className="block text-[11px] font-bold text-slate-600">Address<input value={customerForm.address} onChange={event => setCustomerField('address', event.target.value)} className={inputClass} /></label><div className="flex justify-end gap-2 pt-1"><button type="button" onClick={() => { setIsEditingCustomer(false); setCustomerForm({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '' }) }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">Cancel</button><button disabled={isSavingCustomer} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isSavingCustomer ? 'Saving…' : 'Save changes'}</button></div></form> : <><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><Info label="Name" value={customer.name} /><Info label="Phone" value={customer.phone} /><Info label="Email" value={customer.email || '—'} /><Info label="Address" value={customer.address || '—'} /><Info label="Registered vehicles" value={String(customer.vehicles_count)} /></dl><div className="mt-4 flex gap-2">{customer.phone && <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700"><Phone size={13} />Call</a>}{customer.email && <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700"><Mail size={13} />Email</a>}</div></>}
      </Panel>
      <div className="space-y-4">
        <Panel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><CarFront size={18} className="text-blue-600" /><h2 className="text-sm font-extrabold">Customer vehicles</h2></div>{!isAdmin && <button type="button" onClick={() => { setErrorMessage(''); setIsAddingVehicle(open => !open) }} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><Plus size={14} />Add vehicle</button>}</div>
          {customer.vehicles.length ? <div className="space-y-3">{customer.vehicles.map(vehicle => <div key={vehicle.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><Link to={`/vehicles/${vehicle.id}`} className="font-bold text-blue-700 hover:underline">{vehicle.regNumber}</Link><p className="mt-1 text-xs text-slate-500">{vehicle.make} {vehicle.model}{vehicle.year ? ` · ${vehicle.year}` : ''}</p></div><span className="text-xs text-slate-500">Next service: {formatDate(vehicle.nextServiceDate)}</span></div><div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3"><span>Insurance: {formatDate(vehicle.insuranceExpiry)}</span><span>PUC: {formatDate(vehicle.pucExpiry)}</span><span>Warranty: {formatDate(vehicle.warrantyExpiry)}</span></div><div className="mt-3 border-t border-slate-100 pt-3"><p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700"><Wrench size={13} />Service history</p>{vehicle.serviceHistory.length ? <div className="space-y-1.5">{vehicle.serviceHistory.map(history => <p key={history.id} className="text-xs text-slate-500">{formatDate(history.serviceDate)} · {history.serviceType} · ₹{history.cost.toLocaleString('en-IN')}{history.notes ? ` · ${history.notes}` : ''}</p>)}</div> : <p className="text-xs text-slate-400">No service history recorded.</p>}</div></div>)}</div> : !isAddingVehicle && <p className="text-xs text-slate-400">No vehicles registered for this customer.</p>}
        </Panel>
        {isAddingVehicle && <Panel><div className="flex items-center justify-between gap-2"><div><h2 className="text-sm font-extrabold">Add a vehicle</h2><p className="mt-1 text-xs text-slate-500">Register another vehicle for {customer.name}.</p></div><button type="button" onClick={() => setIsAddingVehicle(false)} aria-label="Close add vehicle form" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={17} /></button></div><form onSubmit={saveVehicle} className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-bold text-slate-600">Registration number<input required minLength={3} value={vehicleForm.reg_number} onChange={event => setVehicleField('reg_number', event.target.value.toUpperCase())} className={`${inputClass} uppercase`} /></label><label className="text-[11px] font-bold text-slate-600">Make<select required value={vehicleForm.make} onChange={event => { setVehicleField('make', event.target.value); setCustomMake('') }} className={inputClass}><option value="">Select make</option>{vehicleMakes.map(make => <option key={make} value={make}>{make}</option>)}</select></label>{vehicleForm.make === 'Other' && <label className="text-[11px] font-bold text-slate-600">Enter make<input required value={customMake} onChange={event => setCustomMake(event.target.value)} className={inputClass} /></label>}<label className="text-[11px] font-bold text-slate-600">Model<input required value={vehicleForm.model} onChange={event => setVehicleField('model', event.target.value)} className={inputClass} /></label><label className="text-[11px] font-bold text-slate-600">Service interval (days)<input required type="number" min={30} value={vehicleForm.service_interval_days} onChange={event => setVehicleField('service_interval_days', event.target.value)} className={inputClass} /></label><label className="text-[11px] font-bold text-slate-600">Last service date<input type="date" value={vehicleForm.last_service_date} onChange={event => setVehicleField('last_service_date', event.target.value)} className={inputClass} /></label><label className="text-[11px] font-bold text-slate-600">Next service due<input type="date" value={vehicleForm.next_service_date} onChange={event => setVehicleField('next_service_date', event.target.value)} className={inputClass} /></label><label className="text-[11px] font-bold text-slate-600">Insurance expiry<input type="date" value={vehicleForm.insurance_expiry} onChange={event => setVehicleField('insurance_expiry', event.target.value)} className={inputClass} /></label><label className="text-[11px] font-bold text-slate-600">PUC expiry<input type="date" value={vehicleForm.puc_expiry} onChange={event => setVehicleField('puc_expiry', event.target.value)} className={inputClass} /></label><label className="text-[11px] font-bold text-slate-600">Warranty expiry<input type="date" value={vehicleForm.warranty_expiry} onChange={event => setVehicleField('warranty_expiry', event.target.value)} className={inputClass} /></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setIsAddingVehicle(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">Cancel</button><button disabled={isSavingVehicle} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isSavingVehicle ? 'Saving…' : 'Save vehicle'}</button></div></form></Panel>}
      </div>
    </div>
  </Page>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] font-semibold text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-700">{value}</dd></div>
}
