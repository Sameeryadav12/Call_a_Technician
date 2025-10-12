import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Shell({ children }){
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  // close the drawer when route changes
  useEffect(()=>{ setOpen(false); }, [loc.pathname, loc.search]);

  // theme toggle
  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.toggle('theme-light');
  };

  return (
    <div className="min-h-full flex">
      <Sidebar open={open} onClose={()=>setOpen(false)} />

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 surface border-b border-surf">
          <div className="container-app h-16 flex items-center gap-3">
            <button className="lg:hidden btn-ghost" onClick={()=>setOpen(true)}>☰</button>

            <div className="relative flex-1">
              <input className="input pl-10" placeholder="Search jobs by title, invoice, status..." />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔎</span>
            </div>

            <button className="btn-ghost" onClick={toggleTheme}>🟣 Theme</button>
            <button className="btn-primary" onClick={()=>nav('/app?new=1')}>➕ New Job</button>
            <button className="btn-ghost">⬇️ Export</button>
            <button className="btn-ghost">⬆️ Import</button>
          </div>
        </header>

        <main className="container-app py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
