import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Page, Panel } from '../components/ui'
import { useUpdateVehicleMutation, useVehicleDetailQuery } from '../store/api'

type VehicleForm = {
  reg_number: string
  make: string
  model: string
  year: string
  purchase_date: string
  last_service_date: string
  next_service_date: string
  service_interval_days: string
  insurance_expiry: string
  puc_expiry: string
  warranty_expiry: string
}

const emptyForm: VehicleForm = {
  reg_number: '', make: '', model: '', year: '', purchase_date: '', last_service_date: '', next_service_date: '',
  service_interval_days: '180', insurance_expiry: '', puc_expiry: '', warranty_expiry: '',
}

export default function EditVehiclePage() {
  const { id } = useParams()
  const vehicleId = Number(id)
  const validId = Number.isInteger(vehicleId) && vehicleId > 0
  const navigate = useNavigate()
  const { data: vehicle, error: loadError, isLoading } = useVehicleDetailQuery(vehicleId, { skip: !validId })
  const [updateVehicle, { isLoading: isSaving }] = useUpdateVehicleMutation()
  const [form, setForm] = useState<VehicleForm>(emptyForm)
  const [error, setError] = useState('')
  const set = (key: keyof VehicleForm, value: string) => setForm(current => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!vehicle) return
    setForm({
      reg_number: vehicle.reg_number,
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year ?? ''),
      purchase_date: vehicle.purchase_date ?? '',
      last_service_date: vehicle.last_service_date ?? '',
      next_service_date: vehicle.next_service_date ?? '',
      service_interval_days: String(vehicle.service_interval_days),
      insurance_expiry: vehicle.insurance_expiry ?? '',
      puc_expiry: vehicle.puc_expiry ?? '',
      warranty_expiry: vehicle.warranty_expiry ?? '',
    })
  }, [vehicle])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await updateVehicle({
        id: vehicleId,
        body: {
          reg_number: form.reg_number.trim(), make: form.make.trim(), model: form.model.trim(), year: Number(form.year),
          purchase_date: form.purchase_date || null,
          last_service_date: form.last_service_date || null,
          ...(form.next_service_date ? { next_service_date: form.next_service_date } : form.last_service_date ? {} : { next_service_date: null }),
          service_interval_days: Number(form.service_interval_days),
          insurance_expiry: form.insurance_expiry || null,
          puc_expiry: form.puc_expiry || null,
          warranty_expiry: form.warranty_expiry || null,
        },
      }).unwrap()
      navigate(`/vehicles/${vehicleId}`)
    } catch {
      setError('Could not update this vehicle. Check the details and registration number, then try again.')
    }
  }

  const inputClass = 'mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  if (isLoading) return <Page title="Edit vehicle" subtitle="Loading vehicle details…"><Panel><p className="text-xs text-slate-400">Loading vehicle details…</p></Panel></Page>
  if (loadError || !vehicle) return <Page title="Vehicle not found" subtitle="This vehicle record is unavailable."><Link to="/vehicles" className="text-xs font-bold text-blue-700 hover:underline">Back to vehicles</Link></Page>

  return <Page title="Edit vehicle" subtitle={`Update service and document dates for ${vehicle.reg_number}.`}>
    <form onSubmit={submit} className="space-y-5">
      <Panel><h2 className="text-sm font-extrabold">Vehicle information</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] font-bold text-slate-600">Registration number<input required minLength={3} value={form.reg_number} onChange={event => set('reg_number', event.target.value.toUpperCase())} className={`${inputClass} uppercase`} /></label>
        <label className="text-[11px] font-bold text-slate-600">Make<input required value={form.make} onChange={event => set('make', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Model<input required value={form.model} onChange={event => set('model', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Year<input required type="number" min={1980} max={2100} value={form.year} onChange={event => set('year', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Purchase date<input type="date" value={form.purchase_date} onChange={event => set('purchase_date', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Service interval (days)<input required type="number" min={30} value={form.service_interval_days} onChange={event => set('service_interval_days', event.target.value)} className={inputClass} /></label>
      </div></Panel>

      <Panel><h2 className="text-sm font-extrabold">Service dates</h2><p className="mt-1 text-xs text-slate-500">The next service date can be entered directly or recalculated from the last service date and interval.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-[11px] font-bold text-slate-600">Last service date<input type="date" value={form.last_service_date} onChange={event => set('last_service_date', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Next service due<input type="date" value={form.next_service_date} onChange={event => set('next_service_date', event.target.value)} className={inputClass} /></label>
      </div></Panel>

      <Panel><h2 className="text-sm font-extrabold">Document expiry dates</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-[11px] font-bold text-slate-600">Insurance expiry<input type="date" value={form.insurance_expiry} onChange={event => set('insurance_expiry', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">PUC expiry<input type="date" value={form.puc_expiry} onChange={event => set('puc_expiry', event.target.value)} className={inputClass} /></label>
        <label className="text-[11px] font-bold text-slate-600">Warranty expiry<input type="date" value={form.warranty_expiry} onChange={event => set('warranty_expiry', event.target.value)} className={inputClass} /></label>
      </div></Panel>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2"><Link to={`/vehicles/${vehicleId}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</Link><button disabled={isSaving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{isSaving ? 'Saving…' : 'Save vehicle details'}</button></div>
    </form>
  </Page>
}
