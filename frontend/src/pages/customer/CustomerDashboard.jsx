import {
  Heart,
  PackageCheck,
  ShoppingBag,
  Timer,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  farmers,
  markets,
} from '../../data/platformData';

export default function CustomerDashboard() {
  const {
    orders,
    favorites,
    notifications,
    announcements,
    setNotifications,
  } = useApp();

  const activeOrders = orders.filter(
    (order) =>
      !['completed', 'cancelled'].includes(order.status)
  );

  const readyOrders = orders.filter(
    (order) => order.status === 'ready'
  );

  const nextPickup = activeOrders[0]?.pickupSlot || '—';

  async function markNotificationsRead() {
    await Promise.all(notifications.filter(note => !note.read).map(note => api(`/notifications/${note._id}/read`, { method: 'PATCH' })));
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">CUSTOMER DASHBOARD</div>
          <h1>Your market week</h1>
          <p>
            Track reservations, pickup status and saved producers.
          </p>
        </div>

        <Link to="/products" className="btn btn-primary">
          Browse weekly stock
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={ShoppingBag}
          label="Active orders"
          value={activeOrders.length}
        />
        <StatCard
          icon={PackageCheck}
          label="Ready for pickup"
          value={readyOrders.length}
        />
        <StatCard
          icon={Heart}
          label="Saved farmers"
          value={favorites.farmers.length}
        />
        <StatCard
          icon={Timer}
          label="Next pickup"
          value={nextPickup}
        />
      </div>

      <div className="dash-grid">
        <section className="card padded">
          <div className="row-between">
            <div>
              <span className="section-kicker">Recent activity</span>
              <h2>Recent orders</h2>
            </div>

            <Link
              className="text-link"
              to="/customer/orders"
            >
              View all
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Farmer</th>
                  <th>Market</th>
                  <th>Pickup</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.slice(0, 5).map((order) => {
                  const farmer = farmers.find(
                    (item) => item.id === order.farmerId
                  );

                  const market = markets.find(
                    (item) => item.id === order.marketId
                  );

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.id}</strong>
                      </td>
                      <td>{farmer?.business}</td>
                      <td>{market?.name}</td>
                      <td>
                        {order.pickupDate}
                        <br />
                        <small>{order.pickupSlot}</small>
                      </td>
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
          <div className="row-between">
            <div>
              <span className="section-kicker">Updates</span>
              <h2>Notifications</h2>
            </div>

            <button
              className="link-btn"
              onClick={markNotificationsRead}
            >
              Mark read
            </button>
          </div>

          <div className="notification-list">
            {notifications.slice(0, 4).map((notification) => (
              <div
                className={notification.read ? '' : 'unread'}
                key={notification._id}
              >
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
              </div>
            ))}
          </div>
          <h3>Market announcements</h3>
          {announcements.slice(0, 3).map(item => <p key={item._id}><strong>{item.title}</strong><br />{item.message}</p>)}
        </aside>
      </div>
    </>
  );
}
