import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/AuthContext';
import { authService } from '../services/authService';
import LanguageDropdown from '../components/LanguageDropdown';
import ThemeToggle from '../components/ThemeToggle';
import logo from '../assets/logo.png';

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
      navigate('/');
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <div className="hidden md:flex md:w-1/2 bg-brand-50 flex-col justify-between p-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Nova Mart" className="w-10 h-10 rounded-xl object-contain" />
            <span className="font-bold text-lg text-ink-900">Nova Mart</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageDropdown />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-3 text-ink-900">
            {t('login.headline')}
          </h1>
          <p className="text-ink-700 max-w-sm">
            {t('login.headlineSub')}
          </p>
        </div>
        <p className="text-sm text-ink-500">{t('login.footer')}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-1 md:justify-start md:gap-3">
            <h2 className="text-2xl font-bold text-ink-900">{t('login.title')}</h2>
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <LanguageDropdown />
            </div>
          </div>
          <p className="text-sm text-ink-500 mb-6">{t('login.enterCredentials')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">{t('login.username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}