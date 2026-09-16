import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/customers', label: 'Customers', icon: Users },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-60 bg-brand-800 text-brand-50 flex flex-col">
        <div className="p-5 border-b border-brand-700/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-accent-500 flex items-center justify-center font-bold text-brand-900">
              N
            </div>
            <div>
              <div className="font-bold leading-none">Nova Mart</div>
              <div className="text-xs text-brand-300 mt-0.5">Point of Sale</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent-500 text-brand-900'
                    : 'text-brand-100 hover:bg-brand-700/60'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-brand-300">{user?.role}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-brand-300 hover:text-accent-400">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}