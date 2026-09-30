import { X } from 'lucide-react';
import { useState } from 'react';
import { imageProps } from '../../../../JS/images.js';

import StatusBadge from '../../components/common/StatusBadge';
import { useApp } from '../../context/AppContext';
import { products } from '../../data/platformData';

export default function FarmerOrders() {
  const [error, setError] = useState('');
  const {
    orders,
    setOrderStatus,
    user,
  } = useApp();

  const farmerOrders = orders.filter(
    (order) => order.farmerId === (user?.legacyId || user?.id)
  );
  const stages = ['placed', 'accepted', 'packing', 'packed', 'ready', 'completed'];
  const next = { placed: ['accepted', 'Accept'], accepted: ['packing', 'Start packing'], packing: ['packed', 'Mark packed'], packed: ['ready', 'Ready for pickup'], out_for_delivery: ['ready', 'Ready for pickup'], ready: ['completed', 'Complete pickup'] };
  async function update(id, status) {
    try { await setOrderStatus(id, status); setError(''); }
    catch (failure) { setError(failure.message); }
  }

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">PRE-ORDERS</div>
          <h1>Orders</h1>
          <p>
            Accept reservations, prepare collections and complete pickups.
          </p>
        </div>
      </div>

      <div className="order-cards">
        {error && <div className="error-note">{error}</div>}
        {farmerOrders.map((order) => (
          <article
            className="card padded order-card"
            key={order.id}
          >
            <div className="row-between top">
              <div>
                <span className="muted small">{order.id}</span>
                <h3>{order.customer}</h3>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="order-items">
              {order.items.map((item) => {
                const product = products.find(
                  (entry) => entry.id === item.productId
                );

                return (
                  <span key={item.productId} className="order-product-line">
                    <img {...imageProps(item.image, item.name)} alt={item.name} />
                    {item.qty} {item.unit} × {product?.name || item.name}
                  </span>
                );
              })}
            </div>

            <div className="order-stage-list">{stages.map((stage, index) => <span className={stages.indexOf(order.status === 'out_for_delivery' ? 'packed' : order.status) >= index ? 'done' : ''} key={stage}>{stage === 'ready' ? 'ready for pickup' : stage}</span>)}</div>

            <div className="order-meta">
              <span>
                <small>Pickup date</small>
                {order.pickupDate}
              </span>
              <span>
                <small>Pickup slot</small>
                {order.pickupSlot}
              </span>
              <span>
                <small>Value</small>
                Rs {order.total.toLocaleString()}
              </span>
            </div>

            <div className="order-actions">
              {next[order.status] && <button className="btn btn-primary" onClick={() => update(order.id, next[order.status][0])}>{next[order.status][1]}</button>}
              {order.status === 'placed' && (
                  <button
                    className="btn btn-danger-outline"
                    onClick={() =>
                      update(order.id, 'declined')
                    }
                  >
                    <X size={16} />
                    Decline
                  </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
