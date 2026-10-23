import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  Bell,
  CalendarDays,
  CarFront,
  ChevronDown,
  CircleHelp,
  Gauge,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";

const groups = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", to: "/", icon: Gauge },
      { label: "Bookings", to: "/bookings", icon: CalendarDays },
      { label: "Customers", to: "/customers", icon: Users },
      { label: "Vehicles", to: "/vehicles", icon: CarFront },
    ],
  },
  {
    title: "Operations",
    items: [{ label: "Reminders", to: "/reminders", icon: Bell }],
  },
  {
    title: "Administration",
    items: [
      { label: "Staff", to: "/staff", icon: Users },
      { label: "Reports", to: "/reports", icon: Activity },
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
  const location = useLocation();
  const navigate = useNavigate();
  const title =
    location.pathname === "/"
      ? "Service center overview"
      : location.pathname.slice(1).replaceAll("-", " ");
  return (
    <div className="min-h-screen bg-[#f2f5fc] text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-blue-100 bg-[#edf2ff] px-5 py-6 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-10 flex items-center justify-between px-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-200">
              <CarFront size={20} />
            </span>
            <span className="text-[17px] font-extrabold tracking-tight">
              remindme<span className="text-blue-600">.</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-7 overflow-y-auto">
          {groups.map((group) => {
            const items = group.items.filter(
              (item) =>
                role === "ADMIN" ||
                (role === "RECEPTIONIST" &&
                  !["Staff", "Reports", "Settings"].includes(item.label)),
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
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors ${isActive ? "bg-blue-100 text-blue-800 shadow-sm shadow-blue-100" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`
                      }
                    >
                      <Icon size={17} strokeWidth={1.9} />
                      {label}
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
        <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-blue-100 bg-[#f9faff]/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-blue-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-blue-100 bg-white/75 px-3 py-2 text-slate-400 sm:flex">
              <Search size={15} />
              <input
                placeholder={`Search ${title}...`}
                className="w-48 bg-transparent text-xs outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSignOut();
                navigate("/login");
              }}
              title="Sign out"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-blue-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                {role.slice(0, 2)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-bold text-slate-700">
                  Service center team
                </span>
                <span className="block text-[10px] text-slate-400">
                  {role === "ADMIN" ? "Owner / Administrator" : "Receptionist"}
                </span>
              </span>
              <LogOut size={15} className="text-slate-400" />
              
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
