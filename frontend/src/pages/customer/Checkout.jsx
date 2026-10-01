import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { farmers, markets, products } from '../../data/platformData';

const defaultSlots = ['09:00–09:30', '09:30–10:00', '10:00–10:30'];
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const matchesDay = (days, day) => !days?.length || days.some(value => value.toLowerCase().includes(day.toLowerCase()));

export default function Checkout() {
  const { cart, user, placeOrder, catalogVersion } = useApp();
  const navigate = useNavigate();
  const items = cart.map(item => ({ ...item, product: products.find(p => p.id === item.productId) })).filter(item => item.product);
  const possibleMarkets = markets.filter(market => items.length && items.every(item => item.product.marketIds.includes(market.id)));
  const [marketId, setMarketId] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!possibleMarkets.some(m => m.id === marketId)) setMarketId(possibleMarkets[0]?.id || '');
  }, [catalogVersion, cart, marketId]);

  const market = possibleMarkets.find(m => m.id === marketId);
  const owners = [...new Set(items.map(item => item.product.farmerId))].map(id => farmers.find(f => f.id === id)).filter(Boolean);
  const slots = owners.length === [...new Set(items.map(item => item.product.farmerId))].length
    ? owners.reduce((common, farmer) => common.filter(slot => (farmer.pickupSlots?.length ? farmer.pickupSlots : defaultSlots).includes(slot)), owners[0]?.pickupSlots?.length ? owners[0].pickupSlots : defaultSlots)
    : [];
  const availableDates = [];
  for (let offset = 1; offset <= 28; offset++) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (market?.days?.some(value => /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/i.test(value)) && matchesDay(market.days, day) && owners.every(f => matchesDay(f.days, day)))
      availableDates.push({ value: localDate(date), label: `${day}, ${date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}` });
  }

  useEffect(() => {
    if (!availableDates.some(date => date.value === pickupDate)) setPickupDate(availableDates[0]?.value || '');
    if (!slots.includes(pickupSlot)) setPickupSlot(slots[0] || '');
  }, [marketId, catalogVersion, cart, pickupDate, pickupSlot]);

  if (!cart.length) return <Navigate to="/cart" replace />;
  const total = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) { window.location.href = '/panels/login.html'; return; }
    if (user.role !== 'customer') { setError('Sign in as a customer to reserve stock.'); return; }
    if (!marketId || !pickupDate || !pickupSlot) { setError('Choose a shared market, date and pickup slot.'); return; }
    setError('');
    try {
      await placeOrder({ marketId: market._id || marketId, pickupDate, pickupSlot, notes });
      navigate('/customer/orders');
    } catch (err) { setError(err.message); }
  }

  return <div className="page container">
    <div className="page-intro"><div className="eyebrow">CHECKOUT</div><h1>Choose your pickup</h1><p>Reserve your stock now and pay the farmer when you collect it.</p></div>
    <form className="checkout-layout" onSubmit={handleSubmit}>
      <div className="card padded form-grid checkout-form-card">
        <div className="form-section-title"><span className="section-kicker">Collection</span><h2>Pickup details</h2></div>
        <label><span className="label-with-icon"><MapPin size={16} /> Market</span>
          <select value={marketId} onChange={e => setMarketId(e.target.value)} required>
            {possibleMarkets.map(m => <option value={m.id} key={m.id}>{m.name} · {m.address}</option>)}
          </select>
        </label>
        <label><span className="label-with-icon"><CalendarDays size={16} /> Pickup date</span>
          <select value={pickupDate} onChange={e => setPickupDate(e.target.value)} required>
            {availableDates.map(date => <option value={date.value} key={date.value}>{date.label}</option>)}
          </select>
        </label>
        <label><span className="label-with-icon"><Clock size={16} /> Pickup slot</span>
          <select value={pickupSlot} onChange={e => setPickupSlot(e.target.value)} required>
            {slots.map(slot => <option key={slot}>{slot}</option>)}
          </select>
        </label>
        <label>Order notes<textarea rows="4" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional pickup notes" /></label>
        {!possibleMarkets.length && <div className="warning-note">These products do not share a pickup market. Order them separately.</div>}
        {possibleMarkets.length > 0 && !availableDates.length && <div className="warning-note">No shared market day is available. Check the farmer schedule.</div>}
        {owners.length > 0 && !slots.length && <div className="warning-note">These farmers do not share a pickup slot. Order separately.</div>}
      </div>
      <aside className="summary card padded sticky-summary">
        <div className="form-section-title"><span className="section-kicker">Summary</span><h2>Your reservation</h2></div>
        {items.map(item => <p key={item.productId}><span>{item.qty} × {item.product.name}</span><strong>Rs {(item.product.price * item.qty).toLocaleString()}</strong></p>)}
        <hr /><p className="total"><span>Total value</span><strong>Rs {total.toLocaleString()}</strong></p>
        <div className="pay-note">Payment<strong>At pickup</strong></div>
        {!user && <div className="warning-note">Sign in as a customer to place your reservation.</div>}
        {error && <div className="error-note">{error}</div>}
        <button className="btn btn-primary full" disabled={!marketId || !pickupDate || !pickupSlot || items.length !== cart.length}>Place pre-order</button>
      </aside>
    </form>
  </div>;
}
