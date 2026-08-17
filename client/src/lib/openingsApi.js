import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function request(path, { method = 'GET', body } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const openingsApi = {
  browse: (params = '') => request(`/api/openings${params}`),
  mine: () => request('/api/openings/mine'),
  claimed: () => request('/api/openings/claimed'),
  get: (id) => request(`/api/openings/${id}`),
  create: (body) => request('/api/openings', { method: 'POST', body }),
  close: (id) => request(`/api/openings/${id}/close`, { method: 'PATCH' }),
  claim: (id, body) => request(`/api/openings/${id}/claim`, { method: 'POST', body }),

  submitProof: (claimId, proof_url) =>
    request(`/api/openings/claims/${claimId}/proof`, { method: 'POST', body: { proof_url } }),
  approve: (claimId) =>
    request(`/api/openings/claims/${claimId}/approve`, { method: 'POST' }),
  reject: (claimId, reason) =>
    request(`/api/openings/claims/${claimId}/reject`, { method: 'POST', body: { reason } }),
};
