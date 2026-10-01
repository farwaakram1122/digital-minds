import { useEffect } from 'react';

export default function Login({ adminMode = false }) {
  useEffect(() => {
    window.location.replace(
      adminMode ? '/panels/admin-login.html' : '/panels/login.html'
    );
  }, [adminMode]);

  return null;
}