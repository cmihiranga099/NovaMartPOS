import { useQuery } from '@tanstack/react-query';
import { DollarSign, Receipt, TrendingUp, AlertTriangle } from 'lucide-react';
import { reportService } from '../services/reportService';
import { useAuth } from '../store/AuthContext';

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'brand',
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  tone?: 'brand' | 'accent';
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center ${
          tone === 'brand' ? 'bg-brand-50 text-brand-600' : 'bg-accent-100 text-accent-600'
        }`}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-ink-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const { data: daily } = useQuery({ queryKey: ['daily-sales'], queryFn: reportService.getDailySales });
  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-products', monthStart, todayStr],
    queryFn: () => reportService.getTopProducts(monthStart, todayStr),
  });
  const { data: lowStock = [] } = useQuery({ queryKey: ['low-stock'], queryFn: reportService.getLowStock });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
      <p className="text-ink-500 mb-6">Here's how Nova Mart is doing today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Today's Sales" value={`Rs. ${(daily?.totalSales ?? 0).toFixed(2)}`} />
        <StatCard icon={Receipt} label="Transactions" value={String(daily?.transactionCount ?? 0)} tone="accent" />
        <StatCard icon={TrendingUp} label="Today's Profit" value={`Rs. ${(daily?.totalProfit ?? 0).toFixed(2)}`} />
        <StatCard icon={AlertTriangle} label="Low Stock Items" value={String(lowStock.length)} tone="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-bold mb-4">Top Products This Month</h2>
          {topProducts.length === 0 ? (
            <p className="text-ink-500 text-sm">No sales recorded yet this month.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{p.productName}</span>
                  </div>
                  <span className="text-sm text-ink-500">{p.quantitySold} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-bold mb-4">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-ink-500 text-sm">All products are sufficiently stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-sm text-red-600 font-medium">{p.stockQuantity} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}