import { useState, type ReactNode } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel, Page, Status } from '../../components/ui'
import { useDeleteCustomerMutation, useDeleteVehicleMutation, useRecordsQuery, useUpdateCustomerMutation, useUpdateVehicleMutation } from '../../store/api'

export type RecordKind = 'customers' | 'vehicles' | 'staff'
const config: Record<RecordKind, { title: string; subtitle: string; headers: string[]; path: string }> = {
  customers: { title: 'Customers', subtitle: 'Customer profiles, contact information and service history.', headers: ['Customer', 'Phone', 'Email', 'Address', 'Vehicles', 'Last visit'], path: '/customers' },
  vehicles: { title: 'Vehicles', subtitle: 'Track registrations, owners, documents and next service dates.', headers: ['Registration', 'Vehicle', 'Owner', 'Next service', 'Year', 'Details'], path: '/vehicles' },
  staff: { title: 'Staff management', subtitle: 'Manage service center accounts and roles.', headers: ['Team member', 'Email', 'Role', 'Status'], path: '/users' },
}
type Row = Record<string, string | number | boolean | null | undefined>
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : '—'

export function RecordsPage({ kind, action }: { kind: RecordKind; action?: ReactNode }) {
  const c = config[kind]
  const [search, setSearch] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const querySearch = kind === 'customers' || kind === 'vehicles' ? search : undefined
  const { data: rows = [], error, isLoading } = useRecordsQuery({ path: c.path, search: querySearch })
  const [deleteCustomer, customerDelete] = useDeleteCustomerMutation()
  const [updateCustomer, customerUpdate] = useUpdateCustomerMutation()
  const [deleteVehicle, vehicleDelete] = useDeleteVehicleMutation()
  const [updateVehicle, vehicleUpdate] = useUpdateVehicleMutation()
  const isDeleting = customerDelete.isLoading || vehicleDelete.isLoading

  const updateCustomerField = async (row: Row, field: 'name' | 'phone' | 'email' | 'address', value: string) => {
    const id = Number(row.id)
    if (!Number.isInteger(id) || id <= 0 || value === String(row[field] ?? '')) return
    try {
      await updateCustomer({ id, body: { [field]: value } }).unwrap()
      setActionMessage('Customer details updated.')
    } catch {
      setActionMessage('Unable to update customer details.')
    }
  }

  const updateVehicleDate = async (row: Row, field: 'insurance_expiry' | 'puc_expiry' | 'warranty_expiry' | 'next_service_date', value: string) => {
    const id = Number(row.id)
    if (!Number.isInteger(id) || id <= 0) return
    try {
      await updateVehicle({ id, body: { [field]: value || null } }).unwrap()
      setActionMessage('Vehicle date updated.')
    } catch {
      setActionMessage('Unable to update vehicle date.')
    }
  }

  const values = (row: Row): string[] => kind === 'customers'
    ? [String(row.name ?? ''), String(row.phone ?? ''), String(row.email || '—'), String(row.address || '—'), String(row.vehicles_count ?? ''), date(row.last_visit as string | undefined)]
    : kind === 'vehicles'
      ? [String(row.reg_number ?? ''), `${row.make} ${row.model}`, String(row.customer_name || '—'), date(row.next_service_date as string | undefined), String(row.year ?? ''), 'View details']
      : [String(row.name ?? ''), String(row.email ?? ''), String(row.role ?? ''), row.is_active ? 'Active' : 'Inactive']

  const remove = async (row: Row) => {
    const id = Number(row.id)
    if (!Number.isInteger(id) || id <= 0) return
    if (kind === 'customers') {
      const count = Number(row.vehicles_count ?? 0)
      if (count > 0) {
        setActionMessage('Remove this customer’s vehicles before deleting the customer.')
        return
      }
      if (!window.confirm(`Delete customer ${String(row.name ?? '')}? This cannot be undone.`)) return
      try {
        await deleteCustomer(id).unwrap()
        setActionMessage('Customer deleted.')
      } catch (err) {
        setActionMessage(err instanceof Error ? err.message : 'Unable to delete customer.')
      }
    } else if (kind === 'vehicles') {
      if (!window.confirm(`Delete vehicle ${String(row.reg_number ?? '')}? Its bookings, reminders, and service history will also be removed.`)) return
      try {
        await deleteVehicle(id).unwrap()
        setActionMessage('Vehicle deleted.')
      } catch (err) {
        setActionMessage(err instanceof Error ? err.message : 'Unable to delete vehicle.')
      }
    }
  }

  const canDelete = kind === 'customers' || kind === 'vehicles'
  return <Page title={c.title} subtitle={c.subtitle}>
    <div className="mb-4 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${c.title.toLowerCase()}...`} className="w-44 text-xs text-slate-700 outline-none" /></label><div className="flex-1" />{action}</div>
    {actionMessage && <p role="status" className="mb-3 text-xs text-slate-600">{actionMessage}</p>}
    <Panel><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.headers.map(header => <th key={header} className="px-3 pb-3">{header}</th>)}{kind === 'vehicles' && <><th className="px-3 pb-3">Insurance expiry</th><th className="px-3 pb-3">PUC expiry</th><th className="px-3 pb-3">Warranty expiry</th><th className="px-3 pb-3">Next service due</th></>}{canDelete && <th className="px-3 pb-3">Actions</th>}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)} className={`border-b border-slate-50 last:border-0 ${kind === 'vehicles' ? 'hover:bg-blue-50/50' : ''}`}>{values(row).map((cell, column) => <td key={column} className="px-3 py-4 text-xs text-slate-600">{kind === 'vehicles' && column === 5 ? <Link to={`/vehicles/${row.id}`} className="font-semibold text-blue-700 hover:underline">View details</Link> : kind === 'customers' && column < 4 ? <input type={column === 2 ? 'email' : 'text'} defaultValue={column === 2 && cell === '—' ? '' : cell} disabled={customerUpdate.isLoading} onBlur={event => { const fields = ['name', 'phone', 'email', 'address'] as const; void updateCustomerField(row, fields[column], event.currentTarget.value) }} className="w-40 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-700" /> : column === 0 ? kind === 'vehicles' ? <Link to={`/vehicles/${row.id}`} className="font-bold text-blue-700 hover:underline" aria-label={`View details for ${String(row.reg_number ?? '')}`}>{cell}</Link> : <span className="font-bold text-slate-800">{cell}</span> : ['Active', 'Inactive', 'PAID', 'UNPAID'].includes(cell) ? <Status status={cell === 'PAID' ? 'Paid' : cell === 'UNPAID' ? 'Unpaid' : cell} /> : cell}</td>)}{kind === 'vehicles' && (['insurance_expiry', 'puc_expiry', 'warranty_expiry', 'next_service_date'] as const).map(field => <td key={field} className="px-3 py-3"><input type="date" defaultValue={String(row[field] ?? '')} disabled={vehicleUpdate.isLoading} onBlur={event => { if (event.currentTarget.value !== String(row[field] ?? '')) void updateVehicleDate(row, field, event.currentTarget.value) }} className="w-36 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-700" /></td>)}{canDelete && <td className="px-3 py-4"><button type="button" disabled={isDeleting || (kind === 'customers' && Number(row.vehicles_count ?? 0) > 0)} onClick={() => void remove(row)} title={kind === 'customers' && Number(row.vehicles_count ?? 0) > 0 ? 'Remove linked vehicles first' : `Delete ${kind === 'customers' ? 'customer' : 'vehicle'}`} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={13} />Delete</button></td>}</tr>)}</tbody></table></div>
      {isLoading && <p className="pt-4 text-xs text-slate-400">Loading records…</p>}{error && <p role="alert" className="pt-4 text-xs text-rose-600">Unable to load records.</p>}{!isLoading && !error && rows.length === 0 && <p className="pt-4 text-xs text-slate-400">No {c.title.toLowerCase()} found.</p>}
    </Panel>
  </Page>
}
