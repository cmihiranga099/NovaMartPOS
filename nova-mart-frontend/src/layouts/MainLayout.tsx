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
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';
import LowStockAlert from '../components/LowStockAlert';
import LanguageDropdown from '../components/LanguageDropdown';

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
  const { t, i18n } = useTranslation();

  const visibleNavItems = navItems.filter((item) => !('roles' in item) || hasRole(...item.roles));

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  const cycleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'si' : i18n.language === 'si' ? 'ta' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-60 bg-white border-r border-line flex flex-col">
        <div className="p-5 border-b border-line">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Nova Mart" className="w-9 h-9 rounded-xl object-contain" />
            <div>
              <div className="font-bold leading-none text-ink-900">Nova Mart</div>
              <div className="text-xs text-ink-500 mt-1">{t('nav.tagline')}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={cycleLanguage}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-line text-xs font-semibold text-ink-700 hover:bg-surface transition-colors cursor-pointer"
              title="Cycle language (EN / සිං / தமிழ்)"
            >
              <span className={i18n.language === 'en' ? 'text-brand-600 font-bold' : ''}>EN</span>
              <span className="text-ink-400">/</span>
              <span className={i18n.language === 'si' ? 'text-brand-600 font-bold' : ''}>සිං</span>
              <span className="text-ink-400">/</span>
              <span className={i18n.language === 'ta' ? 'text-brand-600 font-bold' : ''}>தம</span>
            </button>
            <LanguageDropdown />
            <LowStockAlert />
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleNavItems.map(({ path, key, icon: Icon }) => {
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
                {t(`nav.${key}`)}
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
          <button onClick={logout} title={t('common.logout')} className="text-ink-500 hover:text-brand-600 cursor-pointer">
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
