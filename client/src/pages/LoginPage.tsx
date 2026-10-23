import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { PublicShell } from './PublicBooking'
import { useLoginMutation } from '../store/api'
import { useAppDispatch } from '../store/hooks'
import { setCredentials } from '../store/authSlice'

export function LoginPage() {
  const dispatch = useAppDispatch()
  const [login, { isLoading: busy }] = useLoginMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(''); try { const result = await login({ email, password }).unwrap(); dispatch(setCredentials({ token: result.token, role: result.user.role })) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.') } }
  return <PublicShell>
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[28px] border border-blue-100 bg-[#fbfcff] shadow-[0_24px_70px_rgba(35,65,145,0.13)] md:mt-10 md:min-h-[510px] md:grid-cols-[0.9fr_1.1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#3156df] via-[#3b64ee] to-[#547cf7] p-7 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border-[38px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full border-[42px] border-white/10" />
        <div className="relative"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/15 shadow-inner"><ShieldCheck size={25} /></span><p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-blue-100">Remindme team portal</p><h1 className="mt-3 max-w-xs text-3xl font-bold leading-tight tracking-tight sm:text-[34px]">A better day at the service center starts here.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">Sign in to manage bookings, customers, vehicles, and service reminders in one place.</p></div>
        <div className="relative mt-10 space-y-3 border-t border-white/20 pt-5 text-xs font-medium text-blue-50"><p className="flex items-center gap-2"><Check size={15} className="text-cyan-200" />Your service center workspace</p><p className="flex items-center gap-2"><Check size={15} className="text-cyan-200" />Bookings and vehicle records at a glance</p></div>
      </section>
      <section className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
        <div className="mb-8"><span className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Welcome back</span><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Sign in to your workspace</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter your team credentials to continue.</p></div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-xs font-semibold text-slate-700">Work email<span className="relative mt-2 block"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@remindme.in" className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70" /></span></label>
          <label className="block text-xs font-semibold text-slate-700">Password<span className="relative mt-2 block"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70" /></span></label>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">{error}</p>}
          <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in to dashboard'} <ArrowRight size={17} /></button>
        </form>
        <p className="mt-7 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">Need to book a service? <Link to="/book" className="font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">Book an appointment</Link></p>
      </section>
    </div>
  </PublicShell>
}
