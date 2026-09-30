import {
  Banknote,
  MapPinned,
  Package,
  ShoppingBag,
  Sprout,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect,useState } from 'react';
import { api } from '../../services/api';

import StatCard from '../../components/common/StatCard';
import { useApp } from '../../context/AppContext';
import {
  farmers,
  markets,
  products,
} from '../../data/platformData';

export default function AdminDashboard() {
  const { orders } = useApp();
  const [report,setReport]=useState(null);
  const [pending,setPending]=useState(0);
  useEffect(()=>{
    api('/admin/reports').then(setReport).catch(console.error);
    api('/admin/users?role=farmer').then(rows=>setPending(rows.filter(row=>row.status==='pending').length)).catch(console.error);
  },[]);

  const completedValue = orders
    .filter((order) => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">PLATFORM OVERVIEW</div>
          <h1>Admin dashboard</h1>
          <p>
            Monitor markets, registrations and pickup reservations.
          </p>
        </div>

        <Link
          className="btn btn-primary"
          to="/admin/announcements"
        >
          Publish announcement
        </Link>
      </div>

      <div className="stats-grid five">
        <StatCard
          icon={Sprout}
          label="Producer profiles"
          value={report?.farmers??farmers.length}
        />
        <StatCard
          icon={Users}
          label="Customer accounts"
          value={report?.customers??0}
        />
        <StatCard
          icon={MapPinned}
          label="Pakistan markets"
          value={report?.markets??markets.length}
        />
        <StatCard
          icon={Package}
          label="Public products"
          value={products.length}
        />
        <StatCard
          icon={ShoppingBag}
          label="Local reservations"
          value={report?.orders??orders.length}
        />
      </div>

      <div className="dash-grid">
        <section className="card padded">
          <span className="section-kicker">Catalogue</span>
          <h2>Market coverage</h2>

          <div className="info-list">
            {markets.slice(0, 3).map(market => <p key={market.id}><strong>{market.name}</strong><span>{market.farmers} approved farmers</span></p>)}
            <p>
              <strong>Product listings represented</strong>
              <span>{products.length}</span>
            </p>
            <p>
              <strong>Published-price currency</strong>
              <span>PKR</span>
            </p>
          </div>
        </section>

        <aside className="card padded">
          <span className="section-kicker">Operations</span>
          <h2>Reservations & approvals</h2>

          <div className="info-list">
            <p>
              <strong>Reservations</strong>
              <span>{orders.length}</span>
            </p>
            <p>
              <strong>Completed order value</strong>
              <span>
                Rs {(report?.revenue ?? completedValue).toLocaleString()}
              </span>
            </p>
            <p>
              <strong>Pending farmer approvals</strong>
              <span>{pending}</span>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
