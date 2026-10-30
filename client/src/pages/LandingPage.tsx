import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, BarChart3, BellRing, CalendarCheck2, CarFront, Check, ChevronRight, CircleCheck, Menu, ShieldCheck, Sparkles, X } from 'lucide-react'
import { useState } from 'react'

const features = [
  { icon: CalendarCheck2, title: 'Service requests, without the back and forth', text: 'Keep every appointment, slot, and status clear for your whole team.' },
  { icon: CarFront, title: 'A complete view of every vehicle', text: 'Connect customers to service history, reminders, and upcoming work.' },
  { icon: BellRing, title: 'Reminders that run themselves', text: 'Stay ahead of service, insurance, PUC, and warranty due dates.' },
]

const stats = [
  { value: '01', label: 'workspace for your team' },
  { value: '24/7', label: 'customer service request access' },
  { value: '360°', label: 'view of every vehicle' },
]

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#172033]">
    <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
      <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-950">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1f2d4d] text-white shadow-lg shadow-slate-300/40"><CarFront size={18} /></span>
        remindme<span className="text-[#4d73e8]">.</span>
      </Link>
      <div className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
        <a href="#features" className="transition hover:text-slate-950">Features</a>
        <a href="#workflow" className="transition hover:text-slate-950">How it works</a>
        <a href="#contact" className="transition hover:text-slate-950">Contact</a>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950">Sign in</Link>
        <Link to="/book" className="rounded-xl bg-[#1f2d4d] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-300/50 transition hover:-translate-y-0.5 hover:bg-[#293b60]">Book a service</Link>
      </div>
      <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(value => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
      {menuOpen && <div className="absolute right-5 top-16 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl md:hidden"><a href="#features" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Features</a><a href="#workflow" onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">How it works</a><Link to="/login" className="mt-1 block rounded-xl bg-[#1f2d4d] px-3 py-2.5 text-center text-sm font-bold text-white">Sign in</Link></div>}
    </nav>

    <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-10 lg:pb-28 lg:pt-20">
      <div className="pointer-events-none absolute -right-36 -top-20 h-[30rem] w-[30rem] rounded-full bg-[#dfe8ff] opacity-70 blur-3xl" />
      <div className="relative grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e0fa] bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.13em] text-[#4d73e8] shadow-sm"><Sparkles size={13} /> Built for better service days</span>
          <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#172033] sm:text-6xl">Run your service center with <span className="text-[#4d73e8]">clarity.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-500 sm:text-lg">Remindme brings bookings, customers, vehicles, and timely service reminders into one calm, connected workspace.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Link to="/login" className="group inline-flex items-center gap-2 rounded-xl bg-[#1f2d4d] px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-300/50 transition hover:-translate-y-0.5 hover:bg-[#293b60]">Open your workspace <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link><Link to="/book" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-[#b8c8f2] hover:bg-[#f5f8ff]">Book a service</Link></div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500"><span className="flex items-center gap-1.5"><CircleCheck size={15} className="text-emerald-500" /> Simple to set up</span><span className="flex items-center gap-1.5"><CircleCheck size={15} className="text-emerald-500" /> Made for busy teams</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .12 }} className="relative">
          <div className="absolute -left-7 top-16 hidden rounded-2xl border border-white bg-white p-3 shadow-xl shadow-slate-200/80 sm:block"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Check size={16} /></span><span><b className="block text-xs text-slate-800">All caught up</b><small className="text-[10px] text-slate-400">Reminders are on track</small></span></div></div>
          <div className="relative rounded-[26px] border border-[#dce4f4] bg-white p-3 shadow-[0_30px_90px_rgba(47,67,110,.16)] sm:p-5"><div className="rounded-[19px] bg-[#f7f9fd] p-4 sm:p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#4d73e8]">Overview</p><p className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">Good morning, team</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-500 shadow-sm"><BarChart3 size={17} /></span></div><div className="mt-5 grid grid-cols-3 gap-2.5"><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-semibold text-slate-400">Bookings</p><p className="mt-1 text-xl font-extrabold text-slate-900">24</p><span className="text-[10px] font-bold text-emerald-600">+12.5%</span></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-semibold text-slate-400">Vehicles</p><p className="mt-1 text-xl font-extrabold text-slate-900">186</p><span className="text-[10px] font-bold text-slate-400">This month</span></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-semibold text-slate-400">Completed</p><p className="mt-1 text-xl font-extrabold text-slate-900">92%</p><span className="text-[10px] font-bold text-emerald-600">On track</span></div></div><div className="mt-4 rounded-xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-700">Service activity</p><span className="text-[10px] font-semibold text-slate-400">This month</span></div><div className="mt-4 flex h-28 items-end gap-2"><div className="h-[34%] flex-1 rounded-t-md bg-[#d9e3ff]" /><div className="h-[48%] flex-1 rounded-t-md bg-[#bacbff]" /><div className="h-[42%] flex-1 rounded-t-md bg-[#9db5ff]" /><div className="h-[67%] flex-1 rounded-t-md bg-[#7897fa]" /><div className="h-[58%] flex-1 rounded-t-md bg-[#5e81ef]" /><div className="h-[84%] flex-1 rounded-t-md bg-[#4d73e8]" /><div className="h-[73%] flex-1 rounded-t-md bg-[#3158c9]" /></div></div></div></div>
          <div className="absolute -bottom-5 -right-4 rounded-2xl border border-white bg-[#1f2d4d] px-4 py-3 text-white shadow-xl shadow-slate-300/60"><p className="text-[10px] font-semibold text-slate-300">Next appointment</p><p className="mt-1 text-sm font-bold">10:30 AM · Bay 02</p></div>
        </motion.div>
      </div>
    </section>

    <section className="border-y border-slate-200/80 bg-white/70">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8 lg:px-10">{stats.map((stat, index) => <motion.div key={stat.value} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="flex items-center gap-3 sm:justify-center sm:border-r sm:border-slate-200 last:sm:border-0"><strong className="text-2xl font-extrabold tracking-tight text-[#1f2d4d]">{stat.value}</strong><span className="max-w-[120px] text-xs font-semibold leading-4 text-slate-500">{stat.label}</span></motion.div>)}</div>
    </section>

    <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#4d73e8]">Everything in one place</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.03em] text-slate-900 sm:text-4xl">Less admin. More time for great service.</h2><p className="mt-4 text-base leading-7 text-slate-500">A focused toolkit that helps your team stay organized without adding another complicated system to learn.</p></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">{features.map((feature, index) => { const Icon = feature.icon; return <motion.article key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * .1 }} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-[#c5d3f5] hover:shadow-xl hover:shadow-slate-200/50"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-[#4d73e8] transition group-hover:bg-[#1f2d4d] group-hover:text-white"><Icon size={20} /></span><h3 className="mt-5 text-base font-extrabold text-slate-900">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{feature.text}</p><Link to="/login" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#4d73e8]">Explore workspace <ChevronRight size={14} /></Link></motion.article> })}</div>
    </section>

    <section id="workflow" className="mx-5 mb-10 overflow-hidden rounded-[28px] bg-[#1f2d4d] px-6 py-12 text-white sm:mx-8 sm:px-12 lg:mx-auto lg:max-w-7xl lg:px-16"><div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#aebfff]">Ready when you are</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.03em] sm:text-4xl">Give your service center a calmer way to work.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Start with the essentials today and build a better experience for your team and customers.</p></div><Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#1f2d4d] transition hover:-translate-y-0.5 hover:bg-[#eef3ff]">Get started <ArrowRight size={16} /></Link></div></section>
    <footer id="contact" className="mx-auto flex max-w-7xl flex-col gap-3 px-5 pb-8 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span>© {new Date().getFullYear()} remindme. Service, simplified.</span><span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Built for trusted service teams</span></footer>
  </main>
}
