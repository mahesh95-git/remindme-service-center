import type { ReactNode } from 'react'
import { motion } from 'motion/react'

export function Page({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}><div className="mb-7 border-b border-slate-200/80 pb-5"><h1 className="text-[26px] font-bold capitalize tracking-tight text-slate-900">{title}</h1><p className="mt-1.5 text-sm leading-6 text-slate-500">{subtitle}</p></div>{children}</motion.div>
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-blue-100/80 bg-[#fbfcff] p-5 shadow-[0_3px_12px_rgba(48,75,145,0.055)] md:p-6 ${className}`}>{children}</section>
}

export function FilterChip({ children }: { children: ReactNode }) {
  return <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700">{children}</button>
}

export function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value?: string; onChange?: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="mt-4 block text-xs font-semibold text-slate-600">{label}<input type={type} value={value} onChange={event => onChange?.(event.target.value)} placeholder={placeholder} className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition-shadow placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
}

export function Status({ status }: { status: string }) {
  const style = status === 'Inactive' ? 'bg-slate-100 text-slate-600' : status === 'In progress' || status === 'Unpaid' ? 'bg-amber-50 text-amber-700' : status === 'Completed' || status === 'Paid' || status === 'Delivered' || status === 'Active' ? 'bg-emerald-50 text-emerald-700' : status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>{status}</span>
}
