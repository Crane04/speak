import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { GlobeIcon, MessageIcon, PlusIcon } from "./icons";
import Button from "./ui/Button";

function TopLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "text-sm font-display transition-colors",
          isActive ? "text-slate-100" : "text-slate-400 hover:text-slate-200",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

function SideLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all border",
          isActive
            ? "bg-sky-500/15 text-sky-200 border-sky-500/25"
            : "text-slate-400 border-transparent hover:border-white/6 hover:bg-white/2 hover:text-slate-200",
        ].join(" ")
      }
    >
      <span className="text-lg leading-none opacity-80">{icon}</span>
      <span className="font-display text-base">{label}</span>
    </NavLink>
  );
}

export default function AppShell({
  children,
  mainScrollable = true,
}: {
  children: ReactNode;
  mainScrollable?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDrop = location.pathname === "/drop";

  return (
    <div
      className="min-h-screen w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% -20%, rgba(14,165,233,0.08) 0%, rgba(10,10,20,1) 42%, rgba(3,7,18,1) 70%)",
      }}
    >
      {/* Top bar */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/6">
        <div className="flex items-center gap-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-2xl text-slate-100 tracking-wide px-0 py-0"
          >
            wandr
          </Button>
          <nav className="hidden sm:flex items-center gap-6">
            <TopLink to="/" label="Feed" />
            {/* <TopLink to="/admin" label="Admin" /> */}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(isDrop ? "/" : "/drop")}
          >
            {isDrop ? "Back to globe" : "Drop a message"}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[270px] px-5 py-7 border-r border-white/6">
          <div className="flex flex-col w-full">
            <div className="mb-8">
              <div className="font-display text-3xl text-slate-100">wandr</div>
              <div className="text-slate-500 text-sm font-display mt-1">
                anonymous messages, everywhere
              </div>
            </div>

            <div className="space-y-1.5">
              <SideLink
                to="/"
                label="Global Feed"
                icon={<GlobeIcon className="text-slate-300" />}
              />
              <SideLink
                to="/drop"
                label="Drop a message"
                icon={<MessageIcon className="text-slate-300" />}
              />
              {/* <SideLink
                to="/admin"
                label="Admin"
                icon={<ShieldIcon className="text-slate-300" />}
              /> */}
            </div>

            <div className="mt-auto pt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/drop")}
                className="w-full"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <PlusIcon className="text-slate-950" />
                  drop a message
                </span>
              </Button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main
          className={
            mainScrollable ? "flex-1 overflow-y-auto scrollable" : "flex-1 overflow-hidden"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
