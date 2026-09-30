import { useState } from 'react';

import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export default function Profile() {
  const { user, updateUser } = useApp();
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const inputs = event.currentTarget.querySelectorAll('input');
    try { const updated = await api('/profile', { method: 'PATCH', body: { name: inputs[0].value, phone: inputs[2].value, address: inputs[3].value } }); updateUser(updated); setSaved(true); } catch (error) { alert(error.message); }
  }

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">ACCOUNT</div>
          <h1>Profile</h1>
          <p>
            Contact details and your preferred market information.
          </p>
        </div>
      </div>

      <form
        className="card padded form-grid two profile-form-card"
        onSubmit={handleSubmit}
      >
        <div className="form-section-title span-2">
          <span className="section-kicker">Personal details</span>
          <h2>Customer information</h2>
        </div>

        <label>
          Full name
          <input defaultValue={user?.name} />
        </label>

        <label>
          Email
          <input defaultValue={user?.email} readOnly />
        </label>

        <label>
          Contact number
          <input defaultValue={user?.phone||''} />
        </label>

        <label className="span-2">
          Address
          <input defaultValue={user?.address||''} />
        </label>

        <label className="check span-2">
          <input type="checkbox" defaultChecked />
          Allow household members to use this account
        </label>

        <button className="btn btn-primary span-2">
          Save changes
        </button>

        {saved && (
          <div className="success-note span-2">
            Profile saved.
          </div>
        )}
      </form>
    </>
  );
}
