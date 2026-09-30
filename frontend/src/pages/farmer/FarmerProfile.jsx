import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api, uploadProductImage } from '../../services/api';
import { imageProps } from '../../../../JS/images.js';

export default function FarmerProfile() {
  const { user, updateUser, refreshCatalog } = useApp();
  const [markets, setMarkets] = useState([]);
  const [marketSearch, setMarketSearch] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState((user?.markets || []).map(String));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { api('/markets').then(setMarkets).catch(e => setError(e.message)); }, []);

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      // A new upload wins if both options are filled; otherwise keep the current photo.
      const imageUrl = String(data.imageUrl || '').trim();
      const image = data.imageFile?.size ? await uploadProductImage(data.imageFile) : imageUrl || user?.image;
      delete data.imageFile;
      delete data.imageUrl;
      if (!data.stallMapUrl) delete data.stallMapUrl;
      const updated = await api('/profile', { method: 'PATCH', body: {
        ...data,
        image,
        markets: selectedMarkets,
        operatingDays: data.operatingDays.split(',').map(day => day.trim()).filter(Boolean),
        pickupSlots: data.pickupSlots.split(',').map(slot => slot.trim()).filter(Boolean),
        cutoffHours: Number(data.cutoffHours),
      } });
      updateUser(updated);
      await refreshCatalog();
      setSaved(true); setError('');
    } catch (err) { setError(err.message); setSaved(false); }
  }

  return <>
    <div className="dash-heading"><div><div className="eyebrow">BUSINESS PROFILE</div><h1>Farmer profile</h1><p>Set your stall address, markets and pickup windows.</p></div></div>
    <form className="card padded form-grid two profile-form-card" onSubmit={submit}>
      {[['business','Business / stall name'],['name','Contact person'],['phone','Contact number'],['address','Stall address'],['operatingDays','Operating days (comma separated)'],['pickupSlots','Pickup slots (e.g. 09:00–09:30)'],['cutoffHours','Cutoff hours before pickup']].map(([key,label]) =>
        <label key={key}>{label}<input name={key} required={['business','name','phone','address'].includes(key)} defaultValue={Array.isArray(user?.[key]) ? user[key].join(', ') : user?.[key] ?? ''} /></label>
      )}
      <label>Stall image URL (HTTPS, optional)<input name="imageUrl" type="url" defaultValue={user?.image?.startsWith('https://') ? user.image : ''} placeholder="https://example.com/stall.jpg" /></label>
      <label>Or upload stall photo (JPG, PNG, WebP · max 3 MB)<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <label className="span-2">Stall map pin (OpenStreetMap marker link)
        <input name="stallMapUrl" type="url" placeholder="https://www.openstreetmap.org/?mlat=25.38&mlon=68.37" />
        <small>On OpenStreetMap, mark the exact pickup point and paste its share link. Leave empty to keep your saved pin.</small>
      </label>
      {Number.isFinite(user?.latitude) && Number.isFinite(user?.longitude) && <a className="text-link span-2" href={`https://www.openstreetmap.org/?mlat=${user.latitude}&mlon=${user.longitude}#map=18/${user.latitude}/${user.longitude}`} target="_blank" rel="noopener noreferrer">View saved stall pin ↗</a>}
      <img {...imageProps(user?.image, user?.business || user?.name, 'farmer')} alt="Current stall" width="140" height="95" style={{objectFit:'cover'}} />
      <label className="span-2">Search markets<input value={marketSearch} onChange={event => setMarketSearch(event.target.value)} placeholder="Search by market, city or address" /></label>
      <label className="span-2">Markets (hold Ctrl to select more than one)
        <select multiple size={Math.min(5, Math.max(2, markets.length))} value={selectedMarkets} onChange={event => {
          const visible = markets.filter(m => `${m.name} ${m.city} ${m.address}`.toLowerCase().includes(marketSearch.toLowerCase()));
          setSelectedMarkets(current => [...current.filter(id => !visible.some(m => m._id === id)), ...[...event.target.selectedOptions].map(option => option.value)]);
        }}>
          {markets.filter(market => `${market.name} ${market.city} ${market.address}`.toLowerCase().includes(marketSearch.toLowerCase())).map(market => <option key={market._id} value={market._id}>{market.name} · {market.address}</option>)}
        </select>
      </label>
      <button className="btn btn-primary span-2">Save profile</button>
      {saved && <div className="success-note span-2">Profile saved. Your approved stall is visible to customers.</div>}
      {error && <div className="error-note span-2">{error}</div>}
    </form>
  </>;
}
