import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export default function Notifications() {
  const { notifications, setNotifications } = useApp();
  async function markRead(note) {
    await api(`/notifications/${note._id}/read`, { method: 'PATCH' });
    setNotifications(current => current.map(item => item._id === note._id ? { ...item, read: true } : item));
  }
  return <><div className="dash-heading"><div><div className="eyebrow">ACTIVITY</div><h1>Notifications</h1><p>New orders, updates and messages refresh automatically.</p></div></div>
    <div className="order-cards">{notifications.map(note => <article className="card padded" key={note._id}>
      <div className="row-between"><h3>{note.title}</h3><small>{new Date(note.createdAt).toLocaleString()}</small></div>
      <p>{note.message}</p>{!note.read && <button className="btn btn-ghost" onClick={() => markRead(note)}>Mark read</button>}
    </article>)}{!notifications.length && <div className="card padded">No notifications yet.</div>}</div></>;
}
