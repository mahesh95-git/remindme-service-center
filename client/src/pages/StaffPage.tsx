import { useState, type FormEvent } from 'react'
import { Pause, Play, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { Page, Panel, Status } from '../components/ui'
import { useCreateStaffMutation, useDeleteStaffMutation, useRecordsQuery, useUpdateStaffMutation } from '../store/api'

type StaffRole = 'ADMIN' | 'RECEPTIONIST'

export default function StaffPage() {
  const { data: staff = [], error, isLoading } = useRecordsQuery({ path: '/users' })
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation()
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation()
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<StaffRole>('RECEPTIONIST')
  const [formError, setFormError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const visibleStaff = staff.filter(member => `${member.name ?? ''} ${member.email ?? ''} ${member.role ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    try {
      await createStaff({ name: name.trim(), email: email.trim(), password, role }).unwrap()
      setName('')
      setEmail('')
      setPassword('')
      setRole('RECEPTIONIST')
      setIsFormOpen(false)
    } catch {
      setFormError('Unable to add this staff member. Check that the email is unique and try again.')
    }
  }

  async function handleDelete(member: Record<string, string | number | boolean | null | undefined>) {
    const id = Number(member.id)
    if (!Number.isInteger(id) || id <= 0) return
    const name = String(member.name ?? 'this staff account')
    if (!window.confirm(`Permanently remove ${name}? They will lose access to the workspace.`)) return
    setActionMessage('')
    try {
      await deleteStaff(id).unwrap()
      setActionMessage(`${name} was removed.`)
    } catch (cause) {
      setActionMessage(cause instanceof Error ? cause.message : 'Unable to remove this account. The last active administrator and your own account cannot be removed.')
    }
  }

  async function handleSuspend(member: Record<string, string | number | boolean | null | undefined>) {
    const id = Number(member.id)
    if (!Number.isInteger(id) || id <= 0) return
    const active = Boolean(member.isActive ?? member.is_active)
    const name = String(member.name ?? 'this staff account')
    if (!window.confirm(`${active ? 'Suspend' : 'Reactivate'} ${name}?`)) return
    setActionMessage('')
    try {
      await updateStaff({ id, body: { isActive: !active } }).unwrap()
      setActionMessage(`${name} was ${active ? 'suspended' : 'reactivated'}.`)
    } catch (cause) {
      setActionMessage(cause instanceof Error ? cause.message : `Unable to ${active ? 'suspend' : 'reactivate'} this account.`)
    }
  }

  return <Page title="Staff management" subtitle="Add and manage accounts for people who run your service center.">
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400 transition focus-within:border-[#f07836] focus-within:ring-4 focus-within:ring-orange-100"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search staff..." className="w-44 text-xs text-slate-700 outline-none placeholder:text-slate-400" /></label>
      <span className="rounded-full bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">{staff.length} {staff.length === 1 ? 'team member' : 'team members'}</span>
      <div className="flex-1" />
      <button type="button" onClick={() => { setFormError(''); setIsFormOpen(open => !open) }} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"><Plus size={15} />Add staff</button>
    </div>

    {isFormOpen && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-4" role="dialog" aria-modal="true" aria-labelledby="new-staff-title">
      <Panel className="w-full max-w-2xl shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="new-staff-title" className="text-base font-extrabold">New staff account</h2><p className="mt-1 text-xs text-slate-500">Create sign-in credentials and choose the account’s access level.</p></div>
          <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Close new staff form" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-[11px] font-bold text-slate-600">Full name<input required minLength={2} value={name} onChange={event => setName(event.target.value)} autoComplete="name" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-blue-400" /></label>
          <label className="text-[11px] font-bold text-slate-600">Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-blue-400" /></label>
          <label className="text-[11px] font-bold text-slate-600">Temporary password<input required minLength={4} type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-blue-400" /></label>
          <label className="text-[11px] font-bold text-slate-600">Role<select value={role} onChange={event => setRole(event.target.value as StaffRole)} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-blue-400"><option value="RECEPTIONIST">Staff</option><option value="ADMIN">Administrator</option></select></label>
          {formError && <p role="alert" className="text-xs text-rose-600 sm:col-span-2">{formError}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button><button disabled={isCreating} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{isCreating ? 'Adding…' : 'Create account'}</button></div>
        </form>
      </Panel>
    </div>}

    {actionMessage && <p role="status" className="mb-3 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-800">{actionMessage}</p>}
    <Panel><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">{['Team member', 'Email', 'Role', 'Status', 'Actions'].map(label => <th key={label} className="px-3 pb-3">{label}</th>)}</tr></thead><tbody>{visibleStaff.map((member, index) => { const active = Boolean(member.isActive ?? member.is_active); return <tr key={String(member.id ?? index)} className="border-b border-slate-50 last:border-0"><td className="px-3 py-4 text-xs font-bold text-slate-800">{String(member.name ?? '')}</td><td className="px-3 py-4 text-xs text-slate-600">{String(member.email ?? '')}</td><td className="px-3 py-4 text-xs text-slate-600">{member.role === 'ADMIN' ? 'Administrator' : 'Staff'}</td><td className="px-3 py-4"><Status status={active ? 'Active' : 'Inactive'} /></td><td className="px-3 py-4"><div className="flex flex-wrap gap-1.5"><button type="button" disabled={isUpdating} onClick={() => void handleSuspend(member)} className={`inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-2 text-xs font-semibold transition disabled:opacity-50 ${active ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>{active ? <Pause size={13} /> : <Play size={13} />}{active ? 'Suspend' : 'Reactivate'}</button><button type="button" disabled={isDeleting} onClick={() => void handleDelete(member)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 size={13} />Remove</button></div></td></tr>})}</tbody></table></div>
      {isLoading && <p className="pt-4 text-xs text-slate-400">Loading staff…</p>}{error && <p role="alert" className="pt-4 text-xs text-rose-600">Unable to load staff accounts.</p>}{!isLoading && !error && visibleStaff.length === 0 && <div className="flex items-center gap-2 pt-4 text-xs text-slate-400"><Users size={15} />No staff accounts found.</div>}
    </Panel>
  </Page>
}
