import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  FolderTree,
  Tag,
  Truck,
  Users,
  Package,
  Sparkles,
  History,
  BarChart3,
  ClipboardList,
  LogOut,
  Barcode,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';
import LowStockAlert from '../components/LowStockAlert';
import LanguageDropdown from '../components/LanguageDropdown';
import ThemeToggle from '../components/ThemeToggle';

const navItems = [
  { path: '/', key: 'dashboard', icon: LayoutDashboard },
  { path: '/pos', key: 'pos', icon: ShoppingCart },
  { path: '/barcodes', key: 'barcodeGenerator', icon: Barcode },
  { path: '/categories', key: 'categories', icon: FolderTree },
  { path: '/brands', key: 'brands', icon: Tag },
  { path: '/suppliers', key: 'suppliers', icon: Truck },
  { path: '/customers', key: 'customers', icon: Users },
  { path: '/products', key: 'products', icon: Package },
  { path: '/promotions', key: 'promotions', icon: Sparkles },
  { path: '/sales', key: 'salesHistory', icon: History },
  { path: '/reports', key: 'reports', icon: BarChart3, roles: ['Admin', 'Manager'] },
  { path: '/purchase-orders', key: 'purchaseOrders', icon: ClipboardList, roles: ['Admin', 'Manager'] },
] as const;

export default function MainLayout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) => !('roles' in item) || hasRole(...item.roles));

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface text-ink-900 transition-colors">
      {/* =====================================================================
          MOBILE TOP NAVBAR (< md screens)
          ===================================================================== */}
      <header className="md:hidden sticky top-0 z-30 h-16 px-4 bg-card border-b border-line flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 rounded-xl text-ink-700 hover:text-ink-900 hover:bg-surface border border-transparent hover:border-line transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Nova Mart" className="w-8 h-8 rounded-lg object-contain border border-line p-0.5 bg-surface" />
            <span className="font-extrabold text-base tracking-tight text-ink-900">Nova Mart</span>
          </div>
        </div>

        {/* Mobile quick actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageDropdown />
          <LowStockAlert />
        </div>
      </header>

      {/* =====================================================================
          MOBILE SLIDE-OVER DRAWER OVERLAY (< md screens)
          ===================================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-card border-r border-line shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-line flex items-center justify-between bg-surface/40">
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="Nova Mart" className="w-9 h-9 rounded-xl object-contain border border-line p-1 bg-surface" />
                <div>
                  <div className="font-bold text-sm leading-none text-ink-900">Nova Mart</div>
                  <div className="text-[11px] text-ink-500 mt-1">{t('nav.tagline')}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-ink-500 hover:text-ink-900 hover:bg-surface transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {visibleNavItems.map(({ path, key, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-500 text-white font-bold shadow-xs'
                        : 'text-ink-700 hover:bg-brand-50'
                    }`}
                  >
                    <Icon size={18} />
                    {t(`nav.${key}`)}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer User Footer */}
            <div className="p-4 border-t border-line flex items-center gap-3 bg-surface/40">
              <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold border border-brand-200 shadow-2xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-ink-900">{user?.fullName}</p>
                <p className="text-xs text-ink-500">{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                title={t('common.logout')}
                className="p-2 text-ink-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DESKTOP SIDEBAR (>= md screens)
          ===================================================================== */}
      <aside className="hidden md:flex w-64 bg-card border-r border-line flex-col shrink-0 h-screen sticky top-0">
        <div className="p-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Nova Mart" className="w-10 h-10 rounded-xl object-contain border border-line p-1 bg-surface shadow-2xs" />
            <div>
              <div className="font-extrabold text-base leading-none text-ink-900">Nova Mart</div>
              <div className="text-xs text-ink-500 mt-1">{t('nav.tagline')}</div>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <LanguageDropdown />
            <ThemeToggle />
            <LowStockAlert />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map(({ path, key, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-500 text-white font-bold shadow-xs'
                    : 'text-ink-700 hover:bg-brand-50 hover:text-ink-900'
                }`}
              >
                <Icon size={18} />
                {t(`nav.${key}`)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-line flex items-center gap-3 bg-surface/30">
          <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-sm font-bold border border-brand-200 shadow-2xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-ink-900">{user?.fullName}</p>
            <p className="text-xs text-ink-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title={t('common.logout')}
            className="p-1.5 text-ink-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN CONTENT VIEWPORT
          ===================================================================== */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-hidden overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
