import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, uploadToCloudinary } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './css/app.css';
import './css/detail.css';

const initialsOf = (n = '?') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const isImage = (url = '') => /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState('');

  const load = async () => {
    try {
      setData(await api.getRequest(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 40, width: 120, marginBottom: 16 }} />
        <div className="detail-layout">
          <div className="skeleton" style={{ height: 280, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 220, borderRadius: 18 }} />
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="page">
        <div className="empty">
          <div className="em">😕</div>
          <h3>Request not found</h3>
          <p>{error || 'This request may have been removed.'}</p>
          <Link to="/browse" className="btn-cta">← Back to Browse</Link>
        </div>
      </div>
    );
  }

  const { request, offers, is_owner } = data;
  const reload = async () => { await load(); await refreshProfile(); };

  return (
    <div className="page">
      <Link to={is_owner ? '/' : '/browse'} className="detail-back">← Back</Link>

      {msg && <div className="alert success" style={{ marginBottom: 16 }}>{msg}</div>}
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="detail-layout">
        {/* ---------- MAIN COLUMN ---------- */}
        <div>
          <div className="detail-hero">
            <div className="dh-top">
              <div className="dh-logo">{(request.company_name || '?')[0].toUpperCase()}</div>
              <div className="dh-title">
                <h1>{request.role_title}</h1>
                <span className="co">🏢 {request.company_name}</span>
              </div>
              <span className={`chip ${request.status}`} style={{ alignSelf: 'flex-start' }}>{request.status}</span>
            </div>

            {request.notes && <p className="dh-notes">{request.notes}</p>}

            <div className="dh-links">
              <span className="dh-reward">⚡ {request.rp_cost} RP reward</span>
              {request.job_link && <a className="dh-link" href={request.job_link} target="_blank" rel="noreferrer">🔗 Job link</a>}
              {request.resume_url && <a className="dh-link" href={request.resume_url} target="_blank" rel="noreferrer">📄 Resume</a>}
              {request.jd_doc_url && <a className="dh-link" href={request.jd_doc_url} target="_blank" rel="noreferrer">📑 Job description</a>}
            </div>

            {request.requester && (
              <div className="dh-asker">
                {request.requester.avatar_url
                  ? <img className="av" src={request.requester.avatar_url} alt="" />
                  : <div className="av">{initialsOf(request.requester.full_name)}</div>}
                <div>
                  <b>
                    {request.requester.full_name}
                    {request.requester.is_premium && <span className="chip premium" style={{ marginLeft: 8 }}>💎 Premium</span>}
                  </b>
                  <span>{request.requester.current_company} · Trust {request.requester.trust_score ?? 100}</span>
                </div>
              </div>
            )}
          </div>

          {/* owner: offers list */}
          {is_owner && (
            <OwnerOffers
              offers={offers}
              disabled={request.status !== 'open'}
              onProof={setLightbox}
              reload={reload}
              setMsg={setMsg}
              setError={setError}
            />
          )}
        </div>

        {/* ---------- SIDE PANEL ---------- */}
        <div className="side-panel">
          {is_owner ? (
            <OwnerSummary request={request} offers={offers} reload={reload} setMsg={setMsg} setError={setError} />
          ) : (
            <ReferrerForm
              request={request}
              disabled={request.status !== 'open'}
              onDone={(m) => { setMsg(m); load(); }}
              setError={setError}
            />
          )}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox('')}>
          <button className="lightbox-close" onClick={() => setLightbox('')}>✕</button>
          {isImage(lightbox)
            ? <img src={lightbox} alt="proof" onClick={(e) => e.stopPropagation()} />
            : <div style={{ color: '#fff', textAlign: 'center' }}>Preview not available for this file type.</div>}
          <a className="lightbox-open-new" href={lightbox} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
            Open original ↗
          </a>
        </div>
      )}
    </div>
  );
}

/* ================= OWNER: summary side panel ================= */
function OwnerSummary({ request, offers, reload, setMsg, setError }) {
  const [closing, setClosing] = useState(false);
  const pending = offers.filter((o) => o.status === 'pending').length;
  const approved = offers.filter((o) => o.status === 'approved').length;

  const closeReq = async () => {
    if (!window.confirm('Close this request? It will no longer accept offers.')) return;
    setClosing(true); setError(''); setMsg('');
    try {
      await api.closeRequest(request.id);
      setMsg('Request closed.');
      await reload();
    } catch (err) { setError(err.message); } finally { setClosing(false); }
  };

  return (
    <div className="panel-card">
      <h3>Your request</h3>
      <p className="lead-p">Review the proof on each offer, then approve the one that referred you.</p>
      <div className="owner-stats">
        <div className="owner-stat"><b>{offers.length}</b><span>Offers</span></div>
        <div className="owner-stat"><b>{pending}</b><span>Pending</span></div>
        <div className="owner-stat"><b>{approved}</b><span>Approved</span></div>
      </div>
      {request.status === 'open' && (
        <button className="btn-close-req" onClick={closeReq} disabled={closing}>
          {closing ? 'Closing…' : '✕ Close this request'}
        </button>
      )}
    </div>
  );
}

/* ================= OWNER: offers list ================= */
function OwnerOffers({ offers, disabled, onProof, reload, setMsg, setError }) {
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState(null); // offer being rejected
  const [reason, setReason] = useState('');

  const approve = async (offerId) => {
    setBusy(offerId); setError(''); setMsg('');
    try {
      const r = await api.approveOffer(offerId);
      setMsg(`✅ Approved! ${r.rp_moved} RP transferred to the referrer.`);
      await reload();
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  const doReject = async () => {
    if (reason.trim().length < 3) return;
    const offerId = rejecting.id;
    setBusy(offerId); setError(''); setMsg('');
    try {
      await api.rejectOffer(offerId, reason.trim());
      setMsg('Offer rejected.');
      setRejecting(null); setReason('');
      await reload();
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  return (
    <div className="offers-section">
      <div className="offers-head">
        <h2>Referral offers ({offers.length})</h2>
      </div>

      {offers.length === 0 ? (
        <div className="empty">
          <div className="em">📬</div>
          <h3>No offers yet</h3>
          <p>When someone refers you and uploads proof, it appears here.</p>
        </div>
      ) : offers.map((o) => (
        <div className="offer-card" key={o.id}>
          <div className="offer-top">
            {o.referrer?.avatar_url
              ? <img className="offer-av" src={o.referrer.avatar_url} alt="" />
              : <div className="offer-av">{initialsOf(o.referrer?.full_name)}</div>}
            <div className="offer-who">
              <b>{o.referrer?.full_name || 'Referrer'}</b>
              <span>{o.referrer?.current_company} · Trust {o.referrer?.trust_score ?? 100}</span>
            </div>
            <span className={`chip ${o.status}`}>{o.status}</span>
          </div>

          {o.message && <p className="offer-msg">{o.message}</p>}

          <div className="proof-thumb" onClick={() => onProof(o.proof_url)}>
            🧾 View referral proof
          </div>

          {o.status === 'rejected' && o.rejection_reason && (
            <p className="reject-note"><b>Rejected:</b> {o.rejection_reason}</p>
          )}

          {o.status === 'pending' && !disabled && (
            <div className="offer-actions">
              <button className="btn-approve" disabled={busy === o.id} onClick={() => approve(o.id)}>
                {busy === o.id ? '…' : '✓ Approve & pay RP'}
              </button>
              <button className="btn-reject" disabled={busy === o.id} onClick={() => { setRejecting(o); setReason(''); }}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}

      {/* reject modal */}
      {rejecting && (
        <div className="modal-overlay" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject this offer?</h3>
            <p>A reason is required — it's shared with {rejecting.referrer?.full_name || 'the referrer'} and keeps the system fair.</p>
            <textarea
              autoFocus value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. This isn't the role I asked for / proof doesn't match…"
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="btn-reject" disabled={reason.trim().length < 3 || busy} onClick={doReject}>
                {busy ? 'Rejecting…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= REFERRER: submit offer w/ mandatory proof ================= */
function ReferrerForm({ request, disabled, onDone, setError }) {
  const fileRef = useRef(null);
  const [proofUrl, setProofUrl] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const proofIsImage = useMemo(() => isImage(proofUrl), [proofUrl]);

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
      await api.createOffer({ request_id: request.id, proof_url: proofUrl, message });
      onDone('🎉 Offer submitted! The requester will review your proof.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (disabled) {
    return (
      <div className="panel-card">
        <h3>Offers closed</h3>
        <p className="lead-p">This request is no longer open for new referral offers.</p>
        <Link to="/browse" className="btn-cta" style={{ width: '100%', justifyContent: 'center' }}>← Find another</Link>
      </div>
    );
  }

  return (
    <form className="panel-card" onSubmit={submit}>
      <h3>Refer this person 🤝</h3>
      <p className="lead-p">
        Refer them at your company first, then upload the proof (screenshot or
        confirmation email). You'll earn <b>{request.rp_cost} RP</b> when they approve.
      </p>

      <div className={`proof-zone ${proofUrl ? 'done' : ''}`} onClick={() => fileRef.current?.click()}>
        <div className="pz-ic">{proofUrl ? '✅' : '🧾'}</div>
        <b>{uploading ? 'Uploading…' : proofUrl ? 'Proof uploaded' : 'Upload referral proof'}</b>
        <span>Image or PDF · required</span>
        <input ref={fileRef} className="hidden-input" type="file" accept="image/*,.pdf" onChange={handleFile} />
      </div>

      {proofUrl && proofIsImage && (
        <div className="proof-preview"><img src={proofUrl} alt="proof preview" /></div>
      )}
      {proofUrl && (
        <button type="button" className="proof-remove" onClick={() => setProofUrl('')}>Remove proof</button>
      )}

      <div className="mandatory-note">
        <span>🔒</span>
        <span><b>Proof is mandatory.</b> No points move until the requester approves your uploaded proof — this keeps referrals genuine.</span>
      </div>

      <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block', marginBottom: 7 }}>
        Message <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(optional)</span>
      </label>
      <textarea
        value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="I've submitted your profile via our internal portal…"
        style={{ width: '100%', minHeight: 80, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', border: '1px solid var(--border)', borderRadius: 12, resize: 'vertical' }}
      />

      <button className="btn-submit-offer" disabled={saving || uploading || !proofUrl}>
        {saving ? (
          <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting…</>
        ) : (
          <>Submit referral offer →</>
        )}
      </button>
    </form>
  );
}
