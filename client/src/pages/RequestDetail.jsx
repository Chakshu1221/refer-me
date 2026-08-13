import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, uploadToCloudinary } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequestDetail() {
  const { id } = useParams();
  const { refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setData(await api.getRequest(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="container center">Loading…</div>;
  if (!data) return <div className="container"><div className="alert error">{error || 'Not found'}</div></div>;

  const { request, offers, is_owner } = data;

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{request.role_title}</h2>
          <span className={`badge ${request.status}`}>{request.status}</span>
        </div>
        <p className="meta">{request.company_name} · Reward <b>{request.rp_cost} RP</b></p>
        {request.job_link && <p><a href={request.job_link} target="_blank" rel="noreferrer">🔗 Job link</a></p>}
        {request.notes && <p>{request.notes}</p>}
        <div className="row">
          {request.resume_url && <a href={request.resume_url} target="_blank" rel="noreferrer">📄 Resume</a>}
          {request.jd_doc_url && <a href={request.jd_doc_url} target="_blank" rel="noreferrer">📑 JD</a>}
        </div>
        {request.requester && (
          <p className="meta">Asked by {request.requester.full_name} · Trust {request.requester.trust_score}</p>
        )}
      </div>

      {is_owner ? (
        <OwnerOffers
          offers={offers}
          reload={async () => { await load(); await refreshProfile(); }}
          setMsg={setMsg}
          setError={setError}
          disabled={request.status !== 'open'}
        />
      ) : (
        <ReferrerForm
          requestId={request.id}
          disabled={request.status !== 'open'}
          onDone={(m) => { setMsg(m); load(); }}
          setError={setError}
        />
      )}
    </div>
  );
}

/* ---------- Owner view: approve / reject offers ---------- */
function OwnerOffers({ offers, reload, setMsg, setError, disabled }) {
  const [busy, setBusy] = useState('');

  const approve = async (offerId) => {
    setBusy(offerId); setError(''); setMsg('');
    try {
      const r = await api.approveOffer(offerId);
      setMsg(`Approved! ${r.rp_moved} RP transferred to the referrer.`);
      await reload();
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  const reject = async (offerId) => {
    const reason = window.prompt('Reason for rejecting this referral? (required)');
    if (!reason || reason.trim().length < 3) return;
    setBusy(offerId); setError(''); setMsg('');
    try {
      await api.rejectOffer(offerId, reason.trim());
      setMsg('Offer rejected.');
      await reload();
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  return (
    <>
      <h3>Referral offers ({offers.length})</h3>
      {offers.length === 0 && <p className="hint">No offers yet.</p>}
      {offers.map((o) => (
        <div className="card" key={o.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{o.referrer?.full_name}</b>
            <span className={`badge ${o.status}`}>{o.status}</span>
          </div>
          <p className="meta">{o.referrer?.current_company} · Trust {o.referrer?.trust_score}</p>
          {o.message && <p>{o.message}</p>}
          <p><a href={o.proof_url} target="_blank" rel="noreferrer">🧾 View referral proof</a></p>
          {o.status === 'rejected' && o.rejection_reason && (
            <p className="hint">Reason: {o.rejection_reason}</p>
          )}
          {o.status === 'pending' && !disabled && (
            <div className="btn-row">
              <button className="btn success small" disabled={busy === o.id} onClick={() => approve(o.id)}>
                {busy === o.id ? '…' : 'Approve & pay RP'}
              </button>
              <button className="btn danger small" disabled={busy === o.id} onClick={() => reject(o.id)}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

/* ---------- Referrer view: submit offer with MANDATORY proof ---------- */
function ReferrerForm({ requestId, disabled, onDone, setError }) {
  const [proofUrl, setProofUrl] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      setProofUrl(await uploadToCloudinary(file, 'proof'));
    } catch (err) { setError(`Upload failed: ${err.message}`); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!proofUrl) { setError('Proof of referral is mandatory.'); return; }
    setSaving(true);
    try {
      await api.createOffer({ request_id: requestId, proof_url: proofUrl, message });
      onDone('Offer submitted! The requester will review your proof.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (disabled) return <p className="hint">This request is no longer open for offers.</p>;

  return (
    <form onSubmit={submit} className="card">
      <h3>Offer to refer</h3>
      <p className="hint">
        Refer this person at your company first, then upload the proof
        (screenshot / confirmation email). <b>Proof is mandatory.</b>
      </p>

      <label>Referral proof * (image / PDF)</label>
      <input type="file" accept="image/*,.pdf" onChange={handleFile} />
      <div className="file-row">
        {uploading ? 'Uploading…' : proofUrl ? '✅ Proof uploaded' : 'Required'}
      </div>

      <label>Message (optional)</label>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="I've submitted your profile via our internal portal…" />

      <div className="btn-row">
        <button className="btn" disabled={saving || uploading || !proofUrl}>
          {saving ? 'Submitting…' : 'Submit referral offer'}
        </button>
      </div>
    </form>
  );
}
