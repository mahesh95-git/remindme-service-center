import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import {
  ClipboardList,
  CalendarDays,
  CarFront,
  Gauge,
  LogOut,
  Menu,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";

const groups = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", to: "/", icon: Gauge },
      { label: "Customers", to: "/customers", icon: Users },
      { label: "Vehicles", to: "/vehicles", icon: CarFront },
      { label: "Completed services", to: "/bookings", icon: CalendarDays },
      { label: "Service history", to: "/service-history", icon: Wrench },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Due services", to: "/due-services", icon: ClipboardList },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Staff", to: "/staff", icon: Users },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

export function WorkspaceLayout({
  role,
  onSignOut,
}: {
  role: string;
  onSignOut: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#262b33]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-[#343941] bg-[#262b33] px-5 py-6 text-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-10 flex items-center justify-between px-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f07836] text-[#262b33] shadow-md shadow-black/20">
              <CarFront size={20} />
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-white">
              remindme<span className="text-[#f07836]">.</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-7 overflow-y-auto">
          {groups.map((group) => {
            const items = group.items.filter(
              (item) =>
                (role === "ADMIN" &&
                  !["Service history", "Due services", "Settings"].includes(item.label)) ||
                (role === "RECEPTIONIST" &&
                    !["Staff", "Settings"].includes(item.label)),
            );
            return items.length ? (
              <div key={group.title}>
                <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {items.map(({ label, to, icon: Icon }) => (
                    <NavLink
                      key={label}
                      to={to}
                      end={to === "/"}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors ${isActive ? "bg-[#f07836] text-[#262b33] shadow-sm shadow-black/10" : "text-slate-300 hover:bg-white/10 hover:text-white"}`
                      }
                    >
                      <Icon size={17} strokeWidth={1.9} />
                      {role === "RECEPTIONIST" && label === "Completed services" ? "Today’s services" : label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : null;
          })}
        </nav>
      </aside>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <main className="lg:pl-[252px]">
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-[#3b414a] bg-[#262b33] px-5 text-white shadow-sm md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <p className="text-lg font-bold tracking-tight text-white sm:text-xl">
              {role === "ADMIN" ? "Admin Dashboard" : "Staff Dashboard"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSignOut();
                navigate("/login");
              }}
              title="Sign out"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/10"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fbd3bc] text-xs font-bold text-[#262b33]">
                {role.slice(0, 2)}
              </span>
              <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold text-white">
                  Service center team
                </span>
                  <span className="block text-[10px] text-slate-300">
                  {role === "ADMIN" ? "Owner / Administrator" : "Staff"}
                </span>
              </span>
              <LogOut size={15} className="text-slate-300" />
              
            </button>
           
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-5 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
