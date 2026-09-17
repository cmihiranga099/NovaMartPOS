import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut, Tag, Layers, History } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/sales-history', label: 'Sales History', icon: History },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/categories', label: 'Categories', icon: Layers },
  { path: '/brands', label: 'Brands', icon: Tag },
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
      <aside className="w-60 bg-white border-r border-line flex flex-col">
        <div className="p-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-extrabold text-white text-lg">
              N
            </div>
            <div>
              <div className="font-bold leading-none text-ink-900">Nova Mart</div>
              <div className="text-xs text-ink-500 mt-1">Point of Sale</div>
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
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-700 hover:bg-brand-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-line flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-ink-900">{user?.fullName}</p>
            <p className="text-xs text-ink-500">{user?.role}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-ink-500 hover:text-brand-600">
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