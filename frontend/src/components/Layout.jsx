import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Truck, ClipboardList, BarChart3, Users, Wrench, UserCog, Fuel, LogOut, Menu } from 'lucide-react'
import FeedbackButton from './FeedbackButton'
import { isOwner } from '../lib/auth'

const allNav = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',   ownerOnly: true  },
  { to: '/loads',      icon: ClipboardList,   label: 'Loads',       ownerOnly: true  },
  { to: '/my-loads',   icon: ClipboardList,   label: 'My Loads',    ownerOnly: false, driverOnly: true },
  { to: '/trucks',     icon: Truck,           label: 'Fleet',       ownerOnly: true  },
  { to: '/drivers',    icon: Users,           label: 'Drivers',     ownerOnly: true  },
  { to: '/maintenance',icon: Wrench,          label: 'Maintenance', ownerOnly: true  },
  { to: '/reports',    icon: BarChart3,       label: 'Reports',     ownerOnly: true  },
  { to: '/team',       icon: UserCog,         label: 'Team',        ownerOnly: true  },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const logout = () => { localStorage.removeItem('hc_token'); navigate('/login') }

  const owner = isOwner()
  const nav = allNav.filter(n => {
    if (n.driverOnly && owner) return false   // owner-operators see My Loads via /my-loads but not in sidebar
    if (n.ownerOnly  && !owner) return false
    return true
  })

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-[#1f2937]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center text-lg">🚛</div>
          <div>
            <div className="font-bold text-white text-sm">PAYLOAD</div>
            <div className="text-[10px] text-slate-500">Fleet HQ</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? 'bg-amber-500 text-black font-semibold' : 'text-slate-400 hover:bg-[#1f2937] hover:text-white'}`}
            onClick={() => setOpen(false)}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-[#1f2937]">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-red-900/30 hover:text-red-400 w-full transition-all">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 bg-[#111827] border-r border-[#1f2937] flex-shrink-0"><SidebarContent /></aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-[#111827] border-r border-[#1f2937]"><SidebarContent /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#111827] border-b border-[#1f2937]">
          <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white"><Menu size={20} /></button>
          <span className="font-bold text-sm">🚛 PAYLOAD</span>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6"><Outlet /><FeedbackButton /></main>
      </div>
    </div>
  )
}
