import {
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useState } from 'react';

import { api } from '../../services/api';
import { farmers } from '../../data/platformData';
import { useApp } from '../../context/AppContext';

// Fill these public details in frontend/.env before the final build.
const teamEmail = import.meta.env.VITE_TEAM_EMAIL;
const teamPhone = import.meta.env.VITE_TEAM_PHONE;
const teamAddress = import.meta.env.VITE_TEAM_ADDRESS;

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { user, orders } = useApp();
  const [target, setTarget] = useState('admin');
  const [orderId, setOrderId] = useState('');
  const [farmerId, setFarmerId] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    try {
      await api('/contact', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      form.reset();
      setSent(true);
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="page container">
      <div className="split-hero compact-hero">
        <div>
          <div className="eyebrow">CONTACT</div>
          <h1>
            Questions about markets, pickup or farmer registration?
          </h1>
          <p className="lead">
            Ask the platform team or a farmer. Your reply appears in the panel and by email when SMTP is configured.
          </p>

          <div className="contact-list">
            <span>
              <Mail size={18} />
              {teamEmail ? <a href={`mailto:${teamEmail}`}>{teamEmail}</a> : 'Use the contact form to reach our team'}
            </span>
            <span>
              <Phone size={18} />
              {teamPhone ? <a href={`tel:${teamPhone}`}>{teamPhone}</a> : 'Team phone will be published here'}
            </span>
            <span>
              <MapPin size={18} />
              {teamAddress || 'Team office address will be published here'}
            </span>
          </div>
        </div>

        <img
          src="https://images.pexels.com/photos/36698092/pexels-photo-36698092.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Fresh produce stall at a Pakistan market"
        />
      </div>

      <div className="contact-grid">
        <form
          className="card padded form-grid"
          onSubmit={handleSubmit}
        >
          <div className="form-section-title">
            <span className="section-kicker">Message us</span>
            <h2>Send a message</h2>
          </div>

          <label>
            Full name
            <input
              name="name"
              required
              defaultValue={user?.name || ''}
              placeholder="Your name"
            />
          </label>

          <label>
            Email
            <input
              name="email"
              required
              type="email"
              defaultValue={user?.email || ''}
              placeholder="you@example.com"
            />
          </label>

          <label>Send to
            <select name="target" value={target} onChange={event => { setTarget(event.target.value); setFarmerId(''); }}>
              <option value="admin">Platform admin</option>
              <option value="farmer">Farmer</option>
            </select>
          </label>
          {target === 'farmer' && <label>Farmer
            <select name="farmerId" value={farmerId} onChange={event => setFarmerId(event.target.value)} required={!orderId}>
              <option value="">Select an active farmer</option>
              {farmers.map(farmer => <option key={farmer.id} value={farmer._id}>{farmer.business || farmer.name}</option>)}
            </select>
          </label>}
          <label>Order reference (optional)
            {user?.role === 'customer' ? <select name="orderId" value={orderId} onChange={event => {setOrderId(event.target.value); if (event.target.value) setFarmerId('');}}>
              <option value="">General question</option>
              {orders.map(order => <option key={order.id} value={order.id}>#{order.id.slice(-7).toUpperCase()} · {order.items.map(item => item.name).join(', ')}</option>)}
            </select> : <input name="orderId" placeholder="Sign in to link an order" disabled />}
          </label>

          <label>
            Subject
            <input
              name="subject"
              required
              placeholder="How can we help?"
            />
          </label>

          <label>
            Message
            <textarea
              name="message"
              rows="6"
              required
              placeholder="Write your message..."
            />
          </label>

          <button className="btn btn-primary">
            Send message
          </button>

          {sent && (
            <div className="success-note">
              Message sent. Replies appear in your panel or email.
            </div>
          )}
          {error && <div className="error-note">{error}</div>}
        </form>

        <div className="card padded">
          <span className="section-kicker">Office</span>
          <h2>Digital Minds team location</h2>
          <p className="muted">
            For pickup points, see each farmer's stall and market map.
          </p>
          {teamAddress && <div className="map-frame"><iframe title="Digital Minds team location on Google Maps" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(teamAddress)}&output=embed`} /></div>}
        </div>
      </div>
    </div>
  );
}
