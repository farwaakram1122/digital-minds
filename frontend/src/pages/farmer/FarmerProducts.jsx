import { useEffect, useState } from 'react';
import { api, uploadProductImage } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { unitsFor } from '../../../../JS/productUnits.js';
import { imageProps } from '../../../../JS/images.js';

export default function FarmerProducts() {
  const { refreshCatalog } = useApp();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const refresh = () => api('/farmer/products').then(setRows).catch(e => setError(e.message));
  useEffect(() => {
    refresh();
    api('/categories').then(setCategories).catch(e => setError(e.message));
  }, []);

  function startEdit(product = {}) {
    const category = product.category || categories[0]?.name || 'Fresh Produce';
    const choices = unitsFor(category, product.name);
    setEditing({ ...product, category, unit: choices.includes(product.unit) ? product.unit : choices[0] });
  }

  function changeProduct(changes) {
    const next = { ...editing, ...changes };
    const choices = unitsFor(next.category, next.name);
    if (!choices.includes(next.unit)) next.unit = choices[0];
    setEditing(next);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const file = form.imageFile;
    delete form.imageFile;
    form.price = Number(form.price);
    form.stock = Number(form.stock);
    form.available = editing._id ? editing.available : true;
    try {
      if (file?.size) form.image = await uploadProductImage(file);
      await api(editing._id ? `/farmer/products/${editing._id}` : '/farmer/products', {
        method: editing._id ? 'PATCH' : 'POST', body: form,
      });
      setEditing(null);
      refresh();
      refreshCatalog();
    } catch (err) { setError(err.message); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api(`/farmer/products/${id}`, { method: 'DELETE' });
      refresh();
      refreshCatalog();
    } catch (err) { setError(err.message); }
  }

  return <>
    <div className="dash-heading"><div><div className="eyebrow">CATALOGUE</div><h1>Products</h1><p>Manage pricing, availability and current stock.</p></div><button className="btn btn-primary" disabled={!categories.length} onClick={() => startEdit()}>Add product</button></div>
    {error && <div className="error-note">{error}</div>}
    {editing && <form key={editing._id || 'new'} className="card padded form-grid two" onSubmit={submit}>
      <h2 className="span-2">{editing._id ? 'Edit' : 'Add'} product</h2>
      <label>Product name<input name="name" required value={editing.name || ''} onChange={e => changeProduct({ name: e.target.value })} /></label>
      <label>Category<select name="category" required value={editing.category} onChange={e => changeProduct({ category: e.target.value })}>{categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></label>
      <label>Price (Rs)<input name="price" type="number" min="0" step="0.01" required defaultValue={editing.price ?? ''} /></label>
      <label>Price per unit<select name="unit" value={editing.unit} onChange={e => changeProduct({ unit: e.target.value })}>{unitsFor(editing.category, editing.name).map(unit => <option key={unit}>{unit}</option>)}</select></label>
      <label>Current stock ({editing.unit})<input name="stock" type="number" min="0" step="1" required defaultValue={editing.stock ?? 0} /></label>
      <label>Image URL<input name="image" defaultValue={editing.image || ''} /></label>
      <label>Description<input name="description" defaultValue={editing.description || ''} /></label>
      <label>Or upload image (JPG, PNG, WebP · max 3 MB)<input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp" /></label>
      <div className="span-2"><button className="btn btn-primary">Save product</button> <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
    <div className="card padded table-wrap">
      <table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{rows.map(p => {
          // A product reaches low stock at five units or fewer.
          const status = !p.available ? 'Paused' : p.stock <= 5 ? 'Low stock' : 'Available';
          return <tr key={p._id}>
            <td><div className="table-product"><img {...imageProps(p.image, p.name, 'product', p.category)} alt="" /><strong>{p.name}</strong></div></td>
            <td>{p.category}</td><td>Rs {p.price} / {p.unit}</td>
            <td>{p.stock} {p.unit}{p.reserved > 0 && <small> · {p.reserved} reserved</small>}</td>
            <td>{status}{p.stock === 0 && p.available ? ' · sold out' : ''}</td>
            <td className="table-actions">
              <button onClick={() => startEdit(p)}>Edit</button>
              <button onClick={() => remove(p._id)}>Delete</button>
              <button onClick={async () => { await api(`/farmer/products/${p._id}`, { method:'PATCH', body:{ available:!p.available } }); refresh(); }}>{p.available ? 'Pause' : 'Resume'}</button>
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </>;
}
