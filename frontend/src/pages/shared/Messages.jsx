import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { farmers } from '../../data/platformData';
import { api } from '../../services/api';

export default function Messages() {
  const { user, orders } = useApp();
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [target, setTarget] = useState('admin');
  const refresh = () => api('/messages').then(setMessages).catch(error => setError(error.message));
  useEffect(() => { refresh(); const timer = setInterval(() => { if (!document.hidden) refresh(); }, 5000); return () => clearInterval(timer); }, []);
  async function send(event) {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      await api('/contact', { method: 'POST', body: { ...Object.fromEntries(new FormData(form)), target, name: user.name, email: user.email } });
      form.reset(); setError(''); refresh();
    } catch (error) { setError(error.message); }
  }
  async function reply(event, message) {
    event.preventDefault();
    try {
      await api(`/messages/${message._id}/reply`, { method: 'PATCH', body: { reply: new FormData(event.currentTarget).get('reply') } });
      setError(''); refresh();
    } catch (error) { setError(error.message); }
  }
  return <><div className="dash-heading"><div><div className="eyebrow">CONVERSATIONS</div><h1>Messages</h1><p>Contact the right person and keep order questions together.</p></div></div>
    {user.role !== 'admin' && <form className="card padded form-grid" onSubmit={send}>
      <label>Send to<select name="target" value={target} onChange={event => setTarget(event.target.value)}>
        <option value="admin">Platform admin</option><option value={user.role === 'customer' ? 'farmer' : 'customer'}>{user.role === 'customer' ? 'Farmer' : 'Order customer'}</option>
      </select></label>
      <label>Order reference<select name="orderId"><option value="">General question</option>{orders.map(order => <option key={order.id} value={order.id}>#{order.id.slice(-7).toUpperCase()} · {order.items.map(item => item.name).join(', ')}</option>)}</select></label>
      {target === 'farmer' && <label>Farmer for general questions<select name="farmerId"><option value="">Choose a farmer or order</option>{farmers.map(farmer => <option key={farmer.id} value={farmer._id}>{farmer.business || farmer.name}</option>)}</select></label>}
      <label>Subject<input name="subject" required minLength="2" /></label>
      <label>Message<textarea name="message" required minLength="5" rows="4" /></label>
      <button className="btn btn-primary">Send message</button>
    </form>}
    {error && <p className="error-note">{error}</p>}
    <div className="order-cards">{messages.map(message => <article className="card padded" key={message._id}>
      <div className="row-between"><h3>{message.subject}</h3><small>{new Date(message.createdAt).toLocaleString()}</small></div>
      <p>{message.message}</p><small>{message.order ? `Order #${String(message.order).slice(-7).toUpperCase()} · ` : ''}{message.name} ({message.email})</small>
      {message.reply ? <p className="success-note">Reply: {message.reply}</p> : String(message.recipient) === user.id && <form onSubmit={event => reply(event, message)}><label>Reply<textarea name="reply" required minLength="2" /></label><button className="btn btn-primary">Send reply</button></form>}
    </article>)}{!messages.length && <div className="card padded">No messages yet.</div>}</div></>;
}
