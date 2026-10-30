import { FormEvent, useState } from 'react'
import { Page, Panel, Status } from '../components/ui'
import { useRecordsQuery, useRemindersQuery, useRunRemindersMutation, useSendCustomReminderMutation } from '../store/api'
import { useAppSelector } from '../store/hooks'

type Reminder = {
  id: number
  type: string
  due_date: string
  channel: string
  status: string
  customer_name: string
  reg_number: string
  make: string
  model: string
  error_message?: string
}

type VehicleOption = {
  id: number
  reg_number: string
  make: string
  model: string
  customer_name: string
  customer_email?: string | null
  customer_phone?: string | null
}

export function RemindersPage() {
  const { data, error, isLoading } = useRemindersQuery()
  const { data: vehicleRows } = useRecordsQuery({ path: '/vehicles' })
  const [runReminders, { isLoading: isRunning, error: runError }] = useRunRemindersMutation()
  const [sendCustomReminder, { isLoading: isSending, error: sendError }] = useSendCustomReminderMutation()
  const role = useAppSelector(state => state.auth.role)
  const [runMessage, setRunMessage] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [reminderType, setReminderType] = useState<'SERVICE' | 'INSURANCE' | 'PUC' | 'WARRANTY'>('SERVICE')
  const [channel, setChannel] = useState<'EMAIL' | 'SMS' | 'WHATSAPP'>('EMAIL')
  const [message, setMessage] = useState('')
  const items = (data?.items ?? []) as Reminder[]
  const vehicles = (vehicleRows ?? []) as VehicleOption[]

  const runNow = async () => {
    if (!window.confirm('Run the reminder job now? It may send emails to all eligible customers.')) return
    setRunMessage('')
    try {
      const summary = await runReminders().unwrap()
      setRunMessage(`Job finished: ${summary.totalSent} sent, ${summary.totalCreated} created, ${summary.totalSkipped} skipped, ${summary.totalFailed} failed.`)
    } catch {
      setRunMessage('')
    }
  }

  const sendCustom = async (event: FormEvent) => {
    event.preventDefault()
    if (!vehicleId || !message.trim()) return
    setSendMessage('')
    try {
      const result = await sendCustomReminder({
        vehicleId: Number(vehicleId),
        reminderType,
        channel,
        message: message.trim(),
      }).unwrap()
      setSendMessage(`Reminder sent via ${result.channel.toLowerCase()} to ${result.recipient}.`)
      setMessage('')
    } catch {
      setSendMessage('')
    }
  }

  return <Page title="Reminders" subtitle="Review reminders and contact customers when they need a personal follow-up.">
    {role !== 'ADMIN' && <Panel className="mb-5">
      <div className="mb-4">
        <h2 className="text-sm font-extrabold">Send a custom reminder</h2>
        <p className="mt-1 text-xs text-slate-500">Choose a vehicle, write your own message, and send it immediately.</p>
      </div>
      <form onSubmit={sendCustom} className="grid gap-3 md:grid-cols-2">
        <label className="text-xs font-bold text-slate-600">Vehicle
          <select required value={vehicleId} onChange={event => setVehicleId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal">
            <option value="">Select a vehicle</option>
            {vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.reg_number} · {vehicle.customer_name} · {vehicle.make} {vehicle.model}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600">Reminder type
          <select value={reminderType} onChange={event => setReminderType(event.target.value as typeof reminderType)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal">
            <option value="SERVICE">Service</option><option value="INSURANCE">Insurance</option><option value="PUC">PUC</option><option value="WARRANTY">Warranty</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600">Delivery channel
          <select value={channel} onChange={event => setChannel(event.target.value as typeof channel)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal">
            <option value="EMAIL">Email</option><option value="SMS">SMS</option><option value="WHATSAPP">WhatsApp</option>
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600 md:col-span-2">Your message
          <textarea required minLength={1} maxLength={2000} value={message} onChange={event => setMessage(event.target.value)} rows={3} placeholder="Write the reminder message for the customer..." className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-400" />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button type="submit" disabled={isSending || !vehicles.length} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isSending ? 'Sending…' : 'Send custom reminder'}</button>
          {sendMessage && <p className="text-xs text-emerald-600">{sendMessage}</p>}
          {sendError && <p role="alert" className="text-xs text-rose-600">Unable to send the custom reminder. Check the recipient contact details and try again.</p>}
        </div>
      </form>
    </Panel>}

    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs text-slate-500">Automatic reminders run daily at the configured time.</p>{runMessage && <p className="mt-1 text-xs text-emerald-600">{runMessage}</p>}{runError && <p role="alert" className="mt-1 text-xs text-rose-600">The reminder job could not be completed.</p>}</div>
      {role === 'ADMIN' && <button type="button" onClick={runNow} disabled={isRunning} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{isRunning ? 'Running…' : 'Run reminder job now'}</button>}
    </div>
    <div className="grid gap-4 md:grid-cols-2">{items.map(reminder => <Panel key={reminder.id}><div className="flex items-start justify-between"><div><p className="text-xs font-bold">{reminder.type} reminder</p><p className="mt-1 text-xs text-slate-500">{reminder.customer_name} · {reminder.reg_number} · {reminder.make} {reminder.model}</p><p className="mt-2 text-xs text-slate-500">Due {new Date(reminder.due_date).toLocaleDateString()} · {reminder.channel}</p></div><Status status={reminder.status} /></div>{reminder.error_message && <p className="mt-3 text-xs text-rose-600">{reminder.error_message}</p>}</Panel>)}</div>
    {isLoading ? <p className="text-xs text-slate-400">Loading reminders…</p> : error ? <p role="alert" className="text-xs text-rose-600">Unable to load reminders.</p> : items.length === 0 ? <p className="mt-4 text-xs text-slate-400">No reminders found.</p> : null}
  </Page>
}
