import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react'
import { PublicShell } from './PublicBooking'
import { useResetPasswordMutation } from '../store/api'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const token = params.get('token') ?? ''

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    try {
      await resetPassword({ token, password }).unwrap()
      setMessage('Your password has been reset. You can now sign in.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reset your password.')
    }
  }

  return <PublicShell>
    <div className="mx-auto mt-10 max-w-md rounded-[28px] border border-blue-100 bg-[#fbfcff] p-7 shadow-[0_24px_70px_rgba(35,65,145,0.13)] sm:p-10">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><ShieldCheck size={25} /></span>
      <h1 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">Create a new password</h1>
      {message ? <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-700">{message}</p> : !token ? <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">This password reset link is invalid or has expired.</p> : <form onSubmit={submit} className="mt-7 space-y-5">
        <label className="block text-xs font-semibold text-slate-700">New password<span className="relative mt-2 block"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70" /></span></label>
        <label className="block text-xs font-semibold text-slate-700">Confirm password<span className="relative mt-2 block"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/70" /></span></label>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium text-rose-700">{error}</p>}
        <button disabled={isLoading} type="submit" className="w-full rounded-xl bg-blue-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{isLoading ? 'Resetting…' : 'Reset password'}</button>
      </form>}
      <Link to="/login" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-blue-700"><ArrowLeft size={15} />Back to sign in</Link>
    </div>
  </PublicShell>
}
