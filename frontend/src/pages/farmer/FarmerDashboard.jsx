import {
  Banknote,
  Clock3,
  PackageCheck,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useApp } from '../../context/AppContext';
import { products } from '../../data/platformData';

export default function FarmerDashboard() {
  const { orders, user, announcements } = useApp();

  const farmerOrders = orders.filter(
    (order) => order.farmerId === (user?.legacyId || user?.id)
  );

  const completedRevenue = farmerOrders
    .filter((order) => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = farmerOrders.filter(
    (order) => order.status === 'placed'
  );

  const readyOrders = farmerOrders.filter(
    (order) => order.status === 'ready'
  );
  const ownProducts = products.filter(product => product.farmerId === (user?.legacyId || user?.id));
  const prepared = farmerOrders.filter(order => ['packed', 'out_for_delivery', 'ready', 'completed'].includes(order.status)).length;
  const preparation = farmerOrders.length ? Math.round(prepared / farmerOrders.length * 100) : 0;

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">FARMER DASHBOARD</div>
          <h1>{user?.business || 'Farmer dashboard'}</h1>
          <p>
            Weekly stock, reservations and pickup preparation.
          </p>
        </div>

        <Link
          className="btn btn-primary"
          to="/farmer/products"
        >
          Manage products
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={ShoppingBag}
          label="Total orders"
          value={farmerOrders.length}
        />
        <StatCard
          icon={Clock3}
          label="Pending"
          value={pendingOrders.length}
        />
        <StatCard
          icon={PackageCheck}
          label="Ready"
          value={readyOrders.length}
        />
        <StatCard
          icon={Banknote}
          label="Completed value"
          value={`Rs ${completedRevenue.toLocaleString()}`}
        />
      </div>

      <div className="dash-grid">
        <section className="card padded">
          <div className="row-between">
            <div>
              <span className="section-kicker">This week</span>
              <h2>Incoming reservations</h2>
            </div>
            <Link
              to="/farmer/orders"
              className="text-link"
            >
              Manage orders
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Pickup</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {farmerOrders.map((order) => {
                  const productNames = order.items
                    .map((item) => item.name || products.find(product => product.id === item.productId)?.name)
                    .join(', ');

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.id}</strong>
                      </td>
                      <td>{order.customer}</td>
                      <td>{productNames}</td>
                      <td>{order.pickupSlot}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card padded">
          <span className="section-kicker">Preparation</span>
          <h2>Weekly readiness</h2>

          <div className="progress-list">
            <p>
              <span>Product stock published</span>
              <strong>{ownProducts.length} listed</strong>
            </p>
            <div>
              <i style={{ width: ownProducts.length ? '100%' : '0%' }} />
            </div>

            <p>
              <span>Pickup slots configured</span>
              <strong>{user?.pickupSlots?.length || 0} windows</strong>
            </p>
            <div>
              <i style={{ width: user?.pickupSlots?.length ? '100%' : '0%' }} />
            </div>

            <p>
              <span>Orders prepared</span>
              <strong>{preparation}%</strong>
            </p>
            <div>
              <i style={{ width: `${preparation}%` }} />
            </div>
          </div>
          <h3>Market announcements</h3>
          {announcements.slice(0, 3).map(item => <p key={item._id}><strong>{item.title}</strong><br />{item.message}</p>)}
        </aside>
      </div>
    </>
  );
}
