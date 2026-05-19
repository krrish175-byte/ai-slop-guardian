import React, { useState } from "react"; 
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

import { Overview } from "./pages/Overview";
import { Burnout } from "./pages/Burnout";
import { TrustGraph } from "./pages/TrustGraph";
import { MaintainerAnalytics } from "./pages/MaintainerAnalytics";
import { BarChart3 } from "lucide-react";

import {
  Shield,
  LayoutDashboard,
  ListFilter,
  Users,
  Settings,
  Bell,
  Zap,
  Menu, 
} from "lucide-react";

// CHANGED: added props for mobile toggle
const Sidebar = ({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const location = useLocation();

  const menu = [
    { name: "Overview", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Trust Graph", path: "/trust", icon: <Users size={20} /> },
    { name: "Burnout Center", path: "/burnout", icon: <Zap size={20} /> },
    { name: "Live Queue", path: "/queue", icon: <ListFilter size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  { name: "Maintainer Analytics",path: "/maintainer-analytics", icon: <BarChart3 size={20} />,
}
  ];

  return (
    <>
      {/* CHANGED: mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* CHANGED: mobile slide sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50
          w-[260px] h-screen
          border-r border-white/10
          flex flex-col px-5 py-6
          bg-[#020617] 
          transition-transform duration-300 ease-in-out

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/40">
            <Shield size={24} />
          </div>

          <span className="font-black text-lg tracking-tight uppercase italic leading-none">
            Slop Guardian
          </span>
        </div>

        <nav className="flex-1 space-y-3">
          {menu.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}

                // CHANGED: closes sidebar after clicking item on mobile
                onClick={() => setMobileOpen(false)}

                className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-200 ${
                  active
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                    : "text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
                }`}
              >
                {item.icon}

                <span className="font-semibold text-sm leading-none">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 bg-white/5 rounded-2xl flex items-center gap-3 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0"></div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">
              krrish175
            </p>

            <p className="text-[10px] text-slate-500 truncate">
              Admin Account
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {

  // CHANGED: mobile sidebar state
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 lg:flex">

      {/* CHANGED: passed props */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="flex-1 p-8 lg:p-12 max-w-7xl">

        <div className="flex items-center justify-between lg:justify-end mb-10">

          {/* CHANGED: mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-11 w-11 flex items-center justify-center bg-white/5 rounded-xl border border-white/10"
          >
            <Menu size={20} />
          </button>

          <button className="h-11 w-11 flex items-center justify-center relative bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/10">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-secondary rounded-full"></span>
          </button>
        </div>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/trust" element={<TrustGraph />} />
          <Route path="/burnout" element={<Burnout />} />
          <Route path="/queue" element={<Overview />} />
          <Route path="/settings" element={<Overview />} />
          <Route path="/maintainer-analytics" element={<MaintainerAnalytics />}
/>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;