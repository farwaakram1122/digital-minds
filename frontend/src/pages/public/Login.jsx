import { useEffect } from 'react';
import { panelUrl } from '../../services/api';

export default function Login({ adminMode = false }) {
  useEffect(() => {
    window.location.replace(panelUrl(adminMode ? 'admin-login' : 'login'));
  }, [adminMode]);
  return <p className="page container">Opening sign in…</p>;
}
