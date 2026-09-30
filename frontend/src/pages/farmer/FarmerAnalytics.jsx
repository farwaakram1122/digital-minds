import { Banknote, BarChart3, ShoppingBag, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import StatCard from '../../components/common/StatCard';
import { api } from '../../services/api';

export default function FarmerAnalytics() {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/farmer/insights').then(setInsights).catch(err => setError(err.message)); }, []);
  const best = insights?.bestSelling || [];
  const max = Math.max(1, ...best.map(item => item.quantity));

  return <>
    <div className="dash-heading"><div><div className="eyebrow">INSIGHTS</div><h1>Analytics</h1><p>Completed sales, reservations and best-selling products.</p></div></div>
    {error && <div className="error-note">{error}</div>}
    <div className="stats-grid">
      <StatCard icon={ShoppingBag} label="Total orders" value={insights?.totalOrders ?? 0} />
      <StatCard icon={BarChart3} label="Pending orders" value={insights?.pendingOrders ?? 0} />
      <StatCard icon={Banknote} label="Completed value" value={`Rs ${(insights?.revenue || 0).toLocaleString()}`} />
      <StatCard icon={TrendingUp} label="Best seller" value={best[0]?.name || '—'} />
    </div>
    <section className="card padded"><span className="section-kicker">Product performance</span><h2>Best-selling products</h2>
      {best.length ? <div className="metric-bars">{best.map(item => <div key={item.name}><p><span>{item.name}</span><strong>{item.quantity} sold · Rs {item.value.toLocaleString()}</strong></p><div><i style={{ width: `${item.quantity / max * 100}%` }} /></div></div>)}</div> : <p>No completed orders yet.</p>}
    </section>
  </>;
}
