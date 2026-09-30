import { useEffect } from 'react';
import { panelUrl } from '../../services/api';

export default function Register() {
  useEffect(() => { window.location.replace(panelUrl('register')); }, []);
  return <p className="page container">Opening registration…</p>;
}
