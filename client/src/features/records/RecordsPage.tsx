import { useState, type ReactNode } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Panel, Page, Status } from '../../components/ui'
import { useDeleteCustomerMutation, useRecordsQuery } from '../../store/api'
import { useAppSelector } from '../../store/hooks'

export type RecordKind = 'customers' | 'vehicles' | 'staff'
const config: Record<RecordKind, { title: string; subtitle: string; headers: string[]; path: string }> = {
  customers: { title: 'Customers', subtitle: 'Customer profiles, contact information and service history.', headers: ['Customer', 'Phone', 'Email', 'Address', 'Vehicles', 'Last visit'], path: '/customers' },
  vehicles: { title: 'Vehicles', subtitle: 'Select a registration to view service history and update vehicle details.', headers: ['Registration', 'Vehicle', 'Owner', 'Next service', 'Year'], path: '/vehicles' },
  staff: { title: 'Staff management', subtitle: 'Manage service center accounts and roles.', headers: ['Team member', 'Email', 'Role', 'Status'], path: '/users' },
}
type Row = Record<string, string | number | boolean | null | undefined>
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : '—'
const localDateKey = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`

export function RecordsPage({ kind, action }: { kind: RecordKind; action?: ReactNode }) {
  const isReadOnly = useAppSelector(state => state.auth.role === 'ADMIN')
  const c = config[kind]
  const [search, setSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const querySearch = kind === 'customers' || kind === 'vehicles' ? search : undefined
  const { data: rows = [], error, isLoading } = useRecordsQuery({ path: c.path, search: querySearch })
  const [deleteCustomer, customerDelete] = useDeleteCustomerMutation()
  const isDeleting = customerDelete.isLoading
  const isAdminVehicleList = kind === 'vehicles' && isReadOnly
  const isCustomerList = kind === 'customers'
  const hasDateFilters = isAdminVehicleList || isCustomerList
  const now = new Date()
  const today = localDateKey(now)
  const rangeStart = dateRange === 'today' ? today
    : dateRange === 'month' ? localDateKey(new Date(now.getFullYear(), now.getMonth(), 1))
      : dateRange === '15days' ? localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14))
        : dateRange === 'lastMonth' ? localDateKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))
          : dateRange === 'custom' ? dateFrom : ''
  const rangeEnd = dateRange === 'today' ? today
    : dateRange === 'lastMonth' ? localDateKey(new Date(now.getFullYear(), now.getMonth(), 0))
      : dateRange === 'custom' ? dateTo : dateRange === '15days' || dateRange === 'month' ? today : ''
  const filteredRows = hasDateFilters ? rows.filter(row => {
    const customerMatches = !isAdminVehicleList || String(row.customer_name ?? '').toLowerCase().includes(customerFilter.toLowerCase().trim())
    const registeredAt = isCustomerList ? row.created_at : row.customer_created_at
    const registered = registeredAt ? localDateKey(new Date(String(registeredAt))) : ''
    const dateMatches = (!rangeStart || (registered && registered >= rangeStart)) && (!rangeEnd || (registered && registered <= rangeEnd))
    return customerMatches && dateMatches
  }) : rows

  const values = (row: Row): string[] => kind === 'customers'
    ? [String(row.name ?? ''), String(row.phone ?? ''), String(row.email || '—'), String(row.address || '—'), String(row.vehicles_count ?? ''), date(row.last_visit as string | undefined)]
    : kind === 'vehicles'
      ? [String(row.reg_number ?? ''), `${row.make} ${row.model}`, String(row.customer_name || '—'), date(row.next_service_date as string | undefined), String(row.year ?? '')]
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
    }
  }

  const canDelete = kind === 'customers' && isReadOnly
  return <Page title={c.title} subtitle={c.subtitle}>
    <div className="mb-4 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={isAdminVehicleList ? 'Search registration, make or model...' : `Search ${c.title.toLowerCase()}...`} className="w-44 text-xs text-slate-700 outline-none" /></label>{hasDateFilters && <>{isAdminVehicleList && <input value={customerFilter} onChange={event => setCustomerFilter(event.target.value)} placeholder="Filter by customer..." aria-label="Filter vehicles by customer name" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none" />}<select value={dateRange} onChange={event => setDateRange(event.target.value)} aria-label={isCustomerList ? 'Filter customers by registration date' : 'Filter by customer registration date'} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700"><option value="all">{isCustomerList ? 'All dates' : 'All customer dates'}</option><option value="today">Today</option><option value="15days">Last 15 days</option><option value="month">This month</option><option value="lastMonth">Last month</option><option value="custom">Custom date range</option></select>{dateRange === 'custom' && <><input type="date" aria-label="Registered from" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700" /><input type="date" aria-label="Registered through" value={dateTo} onChange={event => setDateTo(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700" /></>}</>}<div className="flex-1" />{!isReadOnly && action}</div>
    {actionMessage && <p role="status" className="mb-3 text-xs text-slate-600">{actionMessage}</p>}
    <Panel><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.headers.map(header => <th key={header} className="px-3 pb-3">{header}</th>)}{kind === 'vehicles' && <><th className="px-3 pb-3">Insurance expiry</th><th className="px-3 pb-3">PUC expiry</th><th className="px-3 pb-3">Warranty expiry</th></>}{canDelete && <th className="px-3 pb-3">Actions</th>}</tr></thead><tbody>{filteredRows.map((row, index) => <tr key={String(row.id ?? index)} className={`border-b border-slate-50 last:border-0 ${kind === 'vehicles' ? 'hover:bg-blue-50/50' : ''}`}>{values(row).map((cell, column) => <td key={column} className="px-3 py-4 text-xs text-slate-600">{column === 0 ? kind === 'vehicles' ? <Link to={`/vehicles/${row.id}`} className="font-bold text-blue-700 hover:underline" aria-label={`View details for ${String(row.reg_number ?? '')}`}>{cell}</Link> : kind === 'customers' ? <Link to={`/customers/${row.id}`} className="font-bold text-blue-700 hover:underline" aria-label={`View details for ${String(row.name ?? '')}`}>{cell}</Link> : <span className="font-bold text-slate-800">{cell}</span> : ['Active', 'Inactive', 'PAID', 'UNPAID'].includes(cell) ? <Status status={cell === 'PAID' ? 'Paid' : cell === 'UNPAID' ? 'Unpaid' : cell} /> : cell}</td>)}{kind === 'vehicles' && (['insurance_expiry', 'puc_expiry', 'warranty_expiry'] as const).map(field => <td key={field} className="px-3 py-4 text-xs text-slate-600">{date(row[field] as string | undefined)}</td>)}{canDelete && <td className="px-3 py-4"><button type="button" disabled={isDeleting || Number(row.vehicles_count ?? 0) > 0} onClick={() => void remove(row)} title={Number(row.vehicles_count ?? 0) > 0 ? 'Remove linked vehicles first' : 'Delete customer'} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={13} />Delete</button></td>}</tr>)}</tbody></table></div>
      {isLoading && <p className="pt-4 text-xs text-slate-400">Loading records…</p>}{error && <p role="alert" className="pt-4 text-xs text-rose-600">Unable to load records.</p>}{!isLoading && !error && filteredRows.length === 0 && <p className="pt-4 text-xs text-slate-400">No {c.title.toLowerCase()} found.</p>}
    </Panel>
  </Page>
}
