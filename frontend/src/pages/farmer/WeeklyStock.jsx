import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function WeeklyStock() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/farmer/products').then(setRows).catch(error => setMessage(error.message));
  }, []);

  async function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      for (const product of rows) {
        await api(`/farmer/products/${product._id}`, {
          method: 'PATCH',
          body: {
            weeklyTemplate: Number(data.get(`template-${product._id}`)),
            stock: Number(data.get(`stock-${product._id}`)),
          },
        });
      }
      setRows(await api('/farmer/products'));
      setMessage('Weekly stock saved.');
    } catch (error) { setMessage(error.message); }
  }

  function applyTemplate(event) {
    const form = event.currentTarget.form;
    const invalid = rows.find(product => Number(form.elements[`template-${product._id}`].value) < (product.reserved || 0));
    if (invalid) {
      setMessage(`${invalid.name} has stock reserved for open orders. Increase its template first.`);
      return;
    }
    for (const product of rows)
      form.elements[`stock-${product._id}`].value = form.elements[`template-${product._id}`].value;
    form.requestSubmit();
  }

  return <>
    <div className="dash-heading"><div className="eyebrow">INVENTORY</div><h1>Weekly stock</h1><p>Save a reusable weekly template and set this week's stock.</p></div>
    <form onSubmit={save} className="card padded table-wrap">
      <table><thead><tr><th>Product</th><th>Weekly template</th><th>Current stock</th></tr></thead>
        <tbody>{rows.map(product => <tr key={product._id}>
          <td>{product.name} <small>({product.unit})</small></td>
          <td><input type="number" min="0" name={`template-${product._id}`} defaultValue={product.weeklyTemplate || 0} /> {product.unit}</td>
          <td><input type="number" min={product.reserved || 0} name={`stock-${product._id}`} defaultValue={product.stock} /> {product.unit}</td>
        </tr>)}</tbody>
      </table>
      <div className="inline-actions"><button className="btn btn-primary">Save weekly stock</button><button className="btn btn-ghost" type="button" onClick={applyTemplate}>Apply template this week</button></div>
      {message && <p role="status">{message}</p>}
    </form>
  </>;
}
