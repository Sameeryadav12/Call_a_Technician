import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useState } from 'react';

const linkBase = 'flex items-center gap-3 px-3 py-2 rounded-xl transition';
const linkActive = 'bg-white/10 border border-surf';
const linkIdle   = 'hover:bg-white/5';

export default function Sidebar({ open, onClose }){
  const { logout } = useAuth();

  const LinkItem = ({ to, icon, label }) => (
    <NavLink
      to={to}
      className={({isActive}) =>
        `${linkBase} ${isActive?linkActive:linkIdle}`
      }
      onClick={onClose}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* overlay for mobile */}
      {open && <div onClick={onClose} className="lg:hidden fixed inset-0 bg-black/50 z-30" />}
      <aside className={`fixed z-40 lg:z-10 lg:static top-0 left-0 h-full w-72 p-4
                         surface border-r border-surf transform transition
                         ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-2 pt-1 pb-4">
          <div className="w-9 h-9 rounded-xl grid place-items-center bg-brand-royal">🔧</div>
          <div className="text-lg font-extrabold">Call a Technician</div>
        </div>

        <nav className="flex flex-col gap-1">
          <LinkItem to="/app" icon="🏠" label="Dashboard" />
          <LinkItem to="/incoming-jobs" icon="📥" label="Incoming Jobs" />
          <LinkItem to="/app?tab=jobs" icon="🛠️" label="Jobs" />
          <LinkItem to="/invoices" icon="🧾" label="Invoices" />
          <LinkItem to="/techs" icon="👨‍🔧" label="Technicians" />
          <LinkItem to="/calendar" icon="📅" label="Calendar" />
          <LinkItem to="/settings" icon="⚙️" label="Settings" />
        </nav>

        <div className="mt-auto pt-6">
          <button onClick={logout} className="w-full btn-ghost">
            <span>🚪</span> Log out
          </button>
        </div>
      </aside>
    </>
  );
}
