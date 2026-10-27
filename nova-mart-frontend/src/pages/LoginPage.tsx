import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/AuthContext';
import { authService } from '../services/authService';
import LanguageDropdown from '../components/LanguageDropdown';
import ThemeToggle from '../components/ThemeToggle';
import logo from '../assets/logo.png';
import { UserCheck, Shield, KeyRound } from 'lucide-react';

const QUICK_ACCOUNTS = [
  {
    role: 'Cashier',
    username: 'cashier',
    password: 'Cashier@123',
    pin: '1111',
    description: 'POS & Till Sales',
  },
  {
    role: 'Cashier 2',
    username: 'cashier2',
    password: 'Cashier@123',
    pin: '2222',
    description: 'Second Cashier',
  },
  {
    role: 'Manager',
    username: 'manager',
    password: 'Manager@123',
    pin: '5678',
    description: 'Overrides & Till Approval',
  },
  {
    role: 'Admin',
    username: 'admin',
    password: 'Admin@123',
    pin: '1234',
    description: 'Full System Control',
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ username, password });
      login(response.token, {
        userId: response.userId,
        fullName: response.fullName,
        username: response.username,
        role: response.role,
      });

      // Cashiers navigate straight to POS workstation, admins/managers to Dashboard
      if (response.role === 'Cashier') {
        navigate('/pos');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const serverMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      if (status === 429) {
        setError(t('login.rateLimit', 'Too many login attempts. Please wait 1 minute before trying again.'));
      } else if (serverMsg) {
        setError(serverMsg);
      } else {
        setError(t('login.error', 'Invalid username or password.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (acc: typeof QUICK_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Brand Hero Panel (Desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-card border-r border-line flex-col justify-between p-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Nova Mart" className="w-10 h-10 rounded-xl object-contain border border-line p-1 bg-surface shadow-2xs" />
            <div>
              <span className="font-extrabold text-lg text-ink-900 block leading-tight">Nova Mart</span>
              <span className="text-xs text-ink-500 font-medium">Enterprise Supermarket POS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageDropdown />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-extrabold leading-tight mb-3 text-ink-900 tracking-tight">
            {t('login.headline', 'Fast barcode scanning, multi-pay & real-time inventory.')}
          </h1>
          <p className="text-ink-600 dark:text-ink-400 max-w-md text-base leading-relaxed">
            {t('login.headlineSub', 'Manage shifts, customer loyalty, barcodes, shelf tags, and suppliers from one unified workstation.')}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-500 pt-6 border-t border-line">
          <span>{t('login.footer', 'Nova Mart POS v2.0 • Sri Lanka')}</span>
          <span className="flex items-center gap-1.5"><Shield size={14} className="text-brand-500" /> Secure Terminal</span>
        </div>
      </div>

      {/* Login Form Viewport */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-1 md:justify-start md:gap-3">
            <h2 className="text-2xl font-bold text-ink-900 tracking-tight">{t('login.title', 'Sign in')}</h2>
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <LanguageDropdown />
            </div>
          </div>
          <p className="text-sm text-ink-500 mb-6">{t('login.enterCredentials', 'Enter your credentials to open the till.')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-400 mb-1.5">
                {t('login.username', 'Username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. cashier or admin"
                className="w-full px-3.5 py-2.5 border border-line rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-400 mb-1.5">
                {t('login.password', 'Password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 border border-line rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-400 leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm shadow-brand-600/20 cursor-pointer"
            >
              {loading ? t('login.signingIn', 'Signing in...') : t('login.signIn', 'Sign in')}
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-line">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <UserCheck size={13} className="text-brand-500" />
                {t('login.quickRoles', 'Select Role / Demo Login')}
              </span>
              <span className="text-[10px] text-ink-400 flex items-center gap-1">
                <KeyRound size={11} /> Click to autofill
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACCOUNTS.map((acc) => {
                const isSelected = username === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleSelectQuickAccount(acc)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 ring-1 ring-brand-500'
                        : 'border-line bg-card hover:border-brand-300 dark:hover:border-brand-700 hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-900">{acc.role}</span>
                      <span className="text-[10px] font-mono text-ink-500">PIN: {acc.pin}</span>
                    </div>
                    <div className="text-[11px] text-brand-600 dark:text-brand-400 font-mono mt-0.5 truncate">
                      {acc.username}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
