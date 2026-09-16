import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { authService } from '../services/authService';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      <div className="hidden md:flex md:w-1/2 bg-brand-800 text-brand-50 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-accent-500 flex items-center justify-center font-bold text-brand-900">
            N
          </div>
          <span className="font-bold text-lg">Nova Mart</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-3">
            Ring up sales faster,<br />track stock better.
          </h1>
          <p className="text-brand-200 max-w-sm">
            One counter, one system — checkout, inventory, and reporting for your shop floor.
          </p>
        </div>
        <p className="text-sm text-brand-400">Nova Mart POS</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-ink-900 mb-1">Sign in</h2>
          <p className="text-sm text-ink-500 mb-6">Enter your credentials to open the till.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}