import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { downloadReport } from '../../../../JS/reportExport.js';

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/admin/reports').then(setReport).catch(err => setError(err.message)); }, []);

  return <>
    <div className="dash-heading row-between">
      <div><div className="eyebrow">ANALYTICS</div><h1>Reports</h1><p>Live platform summary and completed pickup revenue.</p></div>
      {report && <button className="btn btn-primary" onClick={() => downloadReport(report)}>Download CSV report</button>}
    </div>
    {error && <p className="error-note">{error}</p>}
    {report && <>
      <div className="stats-grid">
        {[['Farmers', report.farmers], ['Customers', report.customers], ['Markets', report.markets], ['Orders', report.orders], ['Completed revenue', `Rs ${report.revenue}`]].map(([title, value]) =>
          <div className="card padded" key={title}><small>{title}</small><h2>{value}</h2></div>)}
      </div>
      <div className="card padded table-wrap"><h2>Most active farmers</h2>
        <table><thead><tr><th>Farmer</th><th>Orders</th><th>Completed pickup value</th></tr></thead>
          <tbody>{report.activeFarmers.map(row => <tr key={row._id}><td>{row.business || String(row._id)}</td><td>{row.orders}</td><td>Rs {row.value}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card padded table-wrap"><h2>Completed orders by market</h2>
        <table><thead><tr><th>Market</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>{(report.byMarket || []).map(row => <tr key={row._id}><td>{row.name || String(row._id)}</td><td>{row.orders}</td><td>Rs {row.revenue}</td></tr>)}</tbody>
        </table>
      </div>
    </>}
  </>;
}
