import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Receipt, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { reportService } from '../services/reportService';
import { saleService } from '../services/saleService';
import { useAuth } from '../store/AuthContext';

const PIE_COLORS = ['#fe6c0d', '#123f34', '#85868c', '#e85a00'];
const TREND_DAYS = 14;

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
  const { data: sales = [] } = useQuery({ queryKey: ['sales'], queryFn: saleService.getAll });

  const { trend, paymentBreakdown, weekRevenue, monthRevenue, avgOrderValue } = useMemo(() => {
    const now = new Date();
    const dayBuckets = new Map<string, number>();
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      dayBuckets.set(d.toISOString().slice(0, 10), 0);
    }

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    const monthAgoStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const paymentTotals = new Map<string, number>();
    let weekTotal = 0;
    let monthTotal = 0;

    for (const sale of sales) {
      const saleDate = new Date(sale.createdAt);
      const dayKey = saleDate.toISOString().slice(0, 10);
      if (dayBuckets.has(dayKey)) {
        dayBuckets.set(dayKey, (dayBuckets.get(dayKey) ?? 0) + sale.grandTotal);
      }
      if (saleDate >= weekAgo) weekTotal += sale.grandTotal;
      if (saleDate >= monthAgoStart) monthTotal += sale.grandTotal;

      const method = sale.paymentMethod || 'Other';
      paymentTotals.set(method, (paymentTotals.get(method) ?? 0) + sale.grandTotal);
    }

    const trendData = Array.from(dayBuckets.entries()).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('en-LK', { day: '2-digit', month: 'short' }),
      revenue: Number(revenue.toFixed(2)),
    }));

    const paymentData = Array.from(paymentTotals.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));

    return {
      trend: trendData,
      paymentBreakdown: paymentData,
      weekRevenue: weekTotal,
      monthRevenue: monthTotal,
      avgOrderValue: sales.length > 0 ? sales.reduce((s, x) => s + x.grandTotal, 0) / sales.length : 0,
    };
  }, [sales]);

  const topProductsChart = topProducts
    .slice(0, 6)
    .map((p) => ({ name: p.productName, revenue: Number(p.totalRevenue.toFixed(2)) }))
    .reverse();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.fullName?.split(' ')[0]}</h1>
      <p className="text-ink-500 mb-6">Here's how Nova Mart is doing today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Today's Sales" value={`Rs. ${(daily?.totalSales ?? 0).toFixed(2)}`} />
        <StatCard icon={Receipt} label="Transactions" value={String(daily?.transactionCount ?? 0)} tone="accent" />
        <StatCard icon={TrendingUp} label="Today's Profit" value={`Rs. ${(daily?.totalProfit ?? 0).toFixed(2)}`} />
        <StatCard icon={AlertTriangle} label="Low Stock Items" value={String(lowStock.length)} tone="accent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-ink-500">Last 7 Days Revenue</p>
          <p className="text-lg font-bold mt-1">Rs. {weekRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-ink-500">This Month Revenue</p>
          <p className="text-lg font-bold mt-1">Rs. {monthRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-ink-500">Average Order Value</p>
          <p className="text-lg font-bold mt-1">Rs. {avgOrderValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <h2 className="font-bold mb-4">Revenue Trend (Last {TREND_DAYS} Days)</h2>
          {sales.length === 0 ? (
            <p className="text-ink-500 text-sm">No sales recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fe6c0d" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#fe6c0d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece7e2" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#85868c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#85868c' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #ece7e2', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#fe6c0d" strokeWidth={2} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-bold mb-4">Sales by Payment Method</h2>
          {paymentBreakdown.length === 0 ? (
            <p className="text-ink-500 text-sm">No sales recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {paymentBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rs. ${value.toFixed(2)}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-bold mb-4">Top Products This Month</h2>
          {topProductsChart.length === 0 ? (
            <p className="text-ink-500 text-sm">No sales recorded yet this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, topProductsChart.length * 38)}>
              <BarChart data={topProductsChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ece7e2" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#85868c' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#2f3032' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Revenue']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#fe6c0d" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
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