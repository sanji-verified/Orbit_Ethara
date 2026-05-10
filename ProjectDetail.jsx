import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Menu, X,
  LogOut, Crown, ChevronRight
} from 'lucide-react';

function Avatar({ name, size = 32, bg = '#22c55e' }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-mono font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'projects', icon: FolderKanban, label: 'Projects', path: '/projects' },
    { id: 'tasks', icon: CheckSquare, label: 'My Tasks', path: '/tasks' },
    ...(isAdmin ? [{ id: 'team', icon: Users, label: 'Team', path: '/team' }] : []),
  ];

  const currentView = navItems.find(n => location.pathname.startsWith(n.path))?.id || 'dashboard';

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#091410] border-r border-dark-border
        flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orbit-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-dark-text">Orbit</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const active = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-orbit-500/10 text-orbit-400'
                    : 'text-dark-muted hover:text-dark-accent hover:bg-dark-surface/50'
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orbit-500" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={user?.name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-dark-text truncate">{user?.name}</div>
              <div className="flex items-center gap-1.5 text-xs text-orbit-500 font-semibold">
                {isAdmin && <Crown className="w-3 h-3" />}
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-muted hover:text-dark-accent hover:bg-dark-surface/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-dark-border">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-dark-surface transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-lg">Orbit</span>
        </div>

        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
