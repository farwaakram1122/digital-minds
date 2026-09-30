export default function StatusBadge({ status }) {
  const statusTone = {
    placed: 'amber',
    accepted: 'blue',
    packing: 'blue',
    packed: 'green',
    out_for_delivery: 'green',
    ready: 'green',
    completed: 'neutral',
    cancelled: 'red',
    declined: 'red',
    pending: 'amber',
    approved: 'green',
    suspended: 'red',
  };

  const tone = statusTone[status] || 'neutral';

  return (
    <span className={`badge badge-${tone}`}>
      {status === 'ready' ? 'Ready for pickup' : String(status).replaceAll('_', ' ').replace('-', ' ')}
    </span>
  );
}
