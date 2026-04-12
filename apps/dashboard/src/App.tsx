import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Overview } from "./pages/Overview";
import { Shield, LayoutDashboard, ListFilter, Users, Settings, Bell } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const menu = [
    { name: "Overview", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "PR Queue", path: "/queue", icon: <ListFilter size={20} /> },
    { name: "Contributors", path: "/users", icon: <Users size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 h-screen border-r border-white/10 flex flex-col p-6 sticky top-0">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/40">
          <Shield size={24} />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase italic">Slop Guardian</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menu.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              {item.icon}
              <span className="font-bold text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-white/5 rounded-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700"></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">krrish175</p>
          <p className="text-[10px] text-slate-500 truncate">Admin Account</p>
        </div>
      </div>
    </aside>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-bg-dark">
      <Sidebar />
      <main className="flex-1 p-12 max-w-7xl">
        <div className="flex justify-end mb-8">
          <button className="p-2 relative glass rounded-full text-slate-400 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-brand-secondary rounded-full border-2 border-bg-dark"></span>
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
          <Route path="/queue" element={<Overview />} /> {/* Placeholder */}
          <Route path="/users" element={<Overview />} /> {/* Placeholder */}
          <Route path="/settings" element={<Overview />} /> {/* Placeholder */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
