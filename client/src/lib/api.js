import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

/** Attach the current Supabase JWT and call the backend. */
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

export const api = {
  // profile
  getMyProfile: () => request('/api/profile/me'),
  updateMyProfile: (body) => request('/api/profile/me', { method: 'PUT', body }),
  getProfile: (id) => request(`/api/profile/${id}`),

  // requests (seeker asks -> referrer offers)
  browseRequests: (params = '') => request(`/api/requests${params}`),
  myRequests: () => request('/api/requests/mine'),
  getRequest: (id) => request(`/api/requests/${id}`),
  createRequest: (body) => request('/api/requests', { method: 'POST', body }),
  closeRequest: (id) => request(`/api/requests/${id}/close`, { method: 'PATCH' }),

  // offers
  createOffer: (body) => request('/api/offers', { method: 'POST', body }),
  myOffers: () => request('/api/offers/mine'),
  approveOffer: (id) => request(`/api/offers/${id}/approve`, { method: 'POST' }),
  rejectOffer: (id, reason) => request(`/api/offers/${id}/reject`, { method: 'POST', body: { reason } }),

  // openings (referrer posts -> seeker grabs)
  browseOpenings: (params = '') => request(`/api/openings${params}`),
  myOpenings: () => request('/api/openings/mine'),
  getOpening: (id) => request(`/api/openings/${id}`),
  createOpening: (body) => request('/api/openings', { method: 'POST', body }),
  closeOpening: (id) => request(`/api/openings/${id}/close`, { method: 'PATCH' }),

  // claims (on openings)
  claimOpening: (id, body) => request(`/api/openings/${id}/claim`, { method: 'POST', body }),
  myClaims: () => request('/api/openings/claims/mine'),
  submitClaimProof: (claimId, proof_url) =>
    request(`/api/openings/claims/${claimId}/proof`, { method: 'POST', body: { proof_url } }),
  approveClaim: (claimId) =>
    request(`/api/openings/claims/${claimId}/approve`, { method: 'POST' }),
  rejectClaim: (claimId, reason) =>
    request(`/api/openings/claims/${claimId}/reject`, { method: 'POST', body: { reason } }),

  // uploads
  uploadSignature: (kind) => request('/api/uploads/signature', { method: 'POST', body: { kind } }),

  // document vault
  myDocuments: () => request('/api/documents'),
  addDocument: (body) => request('/api/documents', { method: 'POST', body }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),

  // subscriptions
  plans: () => request('/api/subscriptions/plans'),
  mySubscription: () => request('/api/subscriptions/me'),
  activatePlan: (plan) => request('/api/subscriptions/activate', { method: 'POST', body: { plan } }),
};

/**
 * Upload a file straight to Cloudinary using a signed payload from our backend.
 * Returns the secure_url to store in Postgres.
 */
export async function uploadToCloudinary(file, kind) {
  const sig = await api.uploadSignature(kind);
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    { method: 'POST', body: form }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Upload failed');
  return data.secure_url;
}
