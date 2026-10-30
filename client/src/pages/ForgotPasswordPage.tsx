import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { PublicShell } from './PublicBooking'
import { useForgotPasswordMutation } from '../store/api'

export function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      const result = await forgotPassword({ email }).unwrap()
      setMessage(result.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send the reset email.')
    }
  }

  return <PublicShell>
    <div className="mx-auto mt-10 max-w-md rounded-[28px] border border-blue-100 bg-[#fbfcff] p-7 shadow-[0_24px_70px_rgba(35,65,145,0.13)] sm:p-10">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><ShieldCheck size={25} /></span>
      <h1 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Enter your work email and we’ll send you a secure password reset link.</p>
      {message ? <p role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700">{message}</p> : <form onSubmit={submit} className="mt-7 space-y-5">
        <label className="block text-xs font-semibold text-slate-700">Work email<span className="relative mt-2 block"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@remindme.in" className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-3 text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70" /></span></label>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <button disabled={isLoading} type="submit" className="w-full rounded-xl bg-blue-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{isLoading ? 'Sending…' : 'Send reset link'}</button>
      </form>}
      <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-blue-700"><ArrowLeft size={15} />Back to sign in</Link>
    </div>
  </PublicShell>
}
