import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { Page, Panel } from '../components/ui'
import { useDuePeriodQuery, useSendDuePeriodRemindersMutation } from '../store/api'

function monthRange() {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: dateKey(now.getFullYear(), now.getMonth(), 1),
    to: dateKey(end.getFullYear(), end.getMonth(), end.getDate()),
  }
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function rangeForPreset(preset: 'today' | 'tomorrow' | '15days' | 'month') {
  const now = new Date()
  const today = dateKey(now.getFullYear(), now.getMonth(), now.getDate())
  if (preset === 'today') return { from: today, to: today }
  if (preset === 'tomorrow') {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const key = dateKey(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    return { from: key, to: key }
  }
  if (preset === '15days') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14)
    return { from: today, to: dateKey(end.getFullYear(), end.getMonth(), end.getDate()) }
  }
  return monthRange()
}

export default function DueServicesPage() {
  const initialRange = monthRange()
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [rangeFilter, setRangeFilter] = useState<'today' | 'tomorrow' | '15days' | 'month' | 'custom'>('month')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SERVICE' | 'INSURANCE' | 'PUC'>('ALL')
  const [message, setMessage] = useState('')
  const dueQuery = useDuePeriodQuery({ from, to }, { skip: from > to })
  const [sendDuePeriodReminders, { isLoading: isSending }] = useSendDuePeriodRemindersMutation()
  const dueItems = (dueQuery.data ?? []).filter(item => typeFilter === 'ALL' || item.due_type === typeFilter)

  function applyRange(value: typeof rangeFilter) {
    setRangeFilter(value)
    if (value !== 'custom') {
      const range = rangeForPreset(value)
      setFrom(range.from)
      setTo(range.to)
    }
  }

  async function sendReminders() {
    if (!dueQuery.data?.length || !window.confirm(`Send reminders to all ${dueQuery.data.length} due customers?`)) return
    setMessage('')
    try {
      const result = await sendDuePeriodReminders({ from, to }).unwrap()
      setMessage(`${result.sent} sent, ${result.skipped} skipped without an email address, ${result.failed} failed.`)
    } catch {
      setMessage('Unable to send reminders. Please try again.')
    }
  }

  return   <Page title="Due services" subtitle="Find customer insurance, PUC, and next-service dates, then remind everyone in the selected period.">
    <Panel>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[11px] font-bold text-slate-600">Due period<select value={rangeFilter} onChange={event => applyRange(event.target.value as typeof rangeFilter)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium"><option value="today">Today</option><option value="tomorrow">Next 1 day</option><option value="15days">Next 15 days</option><option value="month">This month</option><option value="custom">Custom dates</option></select></label>
          {rangeFilter === 'custom' && <><label className="text-[11px] font-bold text-slate-600">From<input type="date" value={from} onChange={event => setFrom(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium" /></label>
          <label className="text-[11px] font-bold text-slate-600">To<input type="date" value={to} onChange={event => setTo(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium" /></label></>}
          <label className="text-[11px] font-bold text-slate-600">Due type<select value={typeFilter} onChange={event => setTypeFilter(event.target.value as typeof typeFilter)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium"><option value="ALL">All due types</option><option value="PUC">PUC expiry</option><option value="INSURANCE">Insurance expiry</option><option value="SERVICE">Next service</option></select></label>
        </div>
        <button type="button" onClick={() => void sendReminders()} disabled={isSending || !dueQuery.data?.length || from > to} className="inline-flex items-center gap-2 rounded-xl bg-[#f07836] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#df672a] disabled:opacity-50"><Send size={14} />{isSending ? 'Sending…' : 'Send all period reminders'}</button>
      </div>
      {from > to && <p role="alert" className="mb-4 text-xs text-rose-600">The start date must be before the end date.</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">{message}</p>}
      {dueQuery.isLoading ? <p className="text-xs text-slate-400">Loading due services…</p> : dueQuery.error ? <p role="alert" className="text-xs text-rose-600">{'data' in dueQuery.error && dueQuery.error.data && typeof dueQuery.error.data === 'object' && 'message' in dueQuery.error.data ? String(dueQuery.error.data.message) : 'Unable to load due services. Please sign in again and retry.'}</p> : dueItems.length ? <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">{['Customer', 'Vehicle', 'Due item', 'Due date', 'Contact'].map(label => <th key={label} className="px-3 pb-3">{label}</th>)}</tr></thead><tbody>{dueItems.map(item => <tr key={`${item.id}-${item.due_type}`} className="border-b border-slate-50 last:border-0"><td className="px-3 py-3 text-xs font-bold text-slate-800">{item.customer_name}</td><td className="px-3 py-3 text-xs text-slate-600">{item.reg_number} · {item.make} {item.model}</td><td className="px-3 py-3 text-xs font-semibold text-slate-700"><span className="inline-flex items-center gap-1"><Mail size={12} className="text-[#f07836]" />{item.due_type === 'SERVICE' ? 'Next service' : `${item.due_type} expiry`}</span></td><td className="px-3 py-3 text-xs text-slate-600">{new Date(`${item.due_date}T00:00:00`).toLocaleDateString()}</td><td className="px-3 py-3 text-xs text-slate-500">{item.customer_email ?? item.customer_phone}</td></tr>)}</tbody></table></div> : <p className="text-xs text-slate-400">No due services found in this period.</p>}
    </Panel>
  </Page>
}
