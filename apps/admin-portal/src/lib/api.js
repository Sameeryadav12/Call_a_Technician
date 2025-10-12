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

// API functions for incoming job requests
export const incomingJobsApi = {
  getIncomingJobs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api(`/incoming-jobs${queryString ? '?' + queryString : ''}`);
  },
  getIncomingJob: (id) => api(`/incoming-jobs/${id}`),
  updateIncomingJob: (id, data) => api(`/incoming-jobs/${id}`, { method: 'PUT', body: data }),
  deleteIncomingJob: (id) => api(`/incoming-jobs/${id}`, { method: 'DELETE' }),
};