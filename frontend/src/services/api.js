const BASE = import.meta.env.VITE_BACKEND_URL || '/api';
export const panelUrl = (page = 'login') => `${BASE.replace(/\/api\/?$/, '')}/panels/${page}.html`;
export async function api(path, { method = 'GET', body, token } = {}) {
  const session = token || sessionStorage.getItem('ml_token');
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
export async function uploadProductImage(file) {
  const body = new FormData();
  body.append('image', file);
  const token = sessionStorage.getItem('ml_token');
  const response = await fetch(`${BASE}/farmer/uploads`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Image upload failed');
  return data.image;
}
