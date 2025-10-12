const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export function getToken(){
  // one source of truth
  return sessionStorage.getItem('cat_token') || localStorage.getItem('cat_token') || null;
}

export async function api(path, { method='GET', body, headers={} } = {}){
  const token = getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null; try{ data = text ? JSON.parse(text) : null }catch{}
  if(!res.ok) throw new Error((data && (data.error || data.message)) || res.statusText);
  return data;
}
