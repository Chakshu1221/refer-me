import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, uploadToCloudinary } from '../lib/api.js';
import { openingsApi } from '../lib/openingsApi.js';
import './css/app.css';
import './css/detail.css';
import './css/openings.css';

const initialsOf = (n = '?') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const isImage = (u = '') => /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(u);

export default function OpeningDetail() {
  const { id } = useParams();
  const { refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState('');

  const load = async () => {
    try { setData(await openingsApi.get(id)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="page"><div className="skeleton" style={{ height: 260, borderRadius: 20 }} /></div>;
  if (!data) return (
    <div className="page"><div className="empty"><div className="em">😕</div><h3>Opening not found</h3>
      <Link to="/openings" className="btn-cta">← Back to openings</Link></div></div>
  );

  const { opening, claims, is_owner } = data;
  const reload = async () => { await load(); await refreshProfile(); };
  const left = (opening.slots_total ?? 1) - (opening.slots_used ?? 0);

  return (
    <div className="page">
      <Link to="/openings" className="detail-back">← Back to openings</Link>
      {msg && <div className="alert success" style={{ marginBottom: 16 }}>{msg}</div>}
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="op-layout">
        <div>
          <div className="detail-hero">
            <div className="dh-top">
              <div className="dh-logo" style={{ background: 'linear-gradient(135deg,#10b981,#047857)' }}>
                {(opening.company_name || '?')[0].toUpperCase()}
              </div>
              <div className="dh-title">
                <h1>{opening.role_title}</h1>
                <span className="co">🏢 {opening.company_name}</span>
              </div>
              <span className={`chip ${opening.status === 'open' ? 'open' : 'closed'}`} style={{ alignSelf: 'flex-start' }}>
                {opening.status}
              </span>
            </div>
            {opening.notes && <p className="dh-notes">{opening.notes}</p>}
            <div className="dh-links">
              <span className="dh-reward" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>⚡ {opening.rp_price} RP</span>
              <span className="dh-link">🎟️ {left} slot{left === 1 ? '' : 's'} left</span>
              {opening.job_link && <a className="dh-link" href={opening.job_link} target="_blank" rel="noreferrer">🔗 Job link</a>}
            </div>
            {opening.referrer && (
              <div className="dh-asker">
                {opening.referrer.avatar_url
                  ? <img className="av" src={opening.referrer.avatar_url} alt="" />
                  : <div className="av">{initialsOf(opening.referrer.full_name)}</div>}
                <div>
                  <b>{opening.referrer.full_name}{opening.referrer.is_premium && <span className="chip premium" style={{ marginLeft: 8 }}>💎 Premium</span>}</b>
                  <span>{opening.referrer.current_company} · Trust {opening.referrer.trust_score ?? 100}</span>
                </div>
              </div>
            )}
          </div>

          {is_owner && (
            <OwnerClaims claims={claims} reload={reload} setMsg={setMsg} setError={setError} onProof={setLightbox} />
          )}
        </div>

        <div className="side-panel">
          {is_owner ? (
            <OwnerPanel opening={opening} claims={claims} reload={reload} setMsg={setMsg} setError={setError} />
          ) : (
            <SeekerPanel opening={opening} claim={claims[0]} onDone={(m) => { setMsg(m); load(); }} reload={reload} setError={setError} onProof={setLightbox} />
          )}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox('')}>
          <button className="lightbox-close" onClick={() => setLightbox('')}>✕</button>
          {isImage(lightbox)
            ? <img src={lightbox} alt="proof" onClick={(e) => e.stopPropagation()} />
            : <div style={{ color: '#fff' }}>Preview not available.</div>}
          <a className="lightbox-open-new" href={lightbox} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Open original ↗</a>
        </div>
      )}
    </div>
  );
}

/* ---------- owner: summary + close ---------- */
function OwnerPanel({ opening, claims, reload, setMsg, setError }) {
  const [closing, setClosing] = useState(false);
  const pending = claims.filter((c) => c.status === 'pending').length;
  const done = claims.filter((c) => c.status === 'approved').length;

  const close = async () => {
    if (!window.confirm('Close this opening?')) return;
    setClosing(true); setError(''); setMsg('');
    try { await openingsApi.close(opening.id); setMsg('Opening closed.'); await reload(); }
    catch (err) { setError(err.message); } finally { setClosing(false); }
  };

  return (
    <div className="op-panel">
      <h3>Your opening</h3>
      <p className="lead">Seekers grab slots below. Refer them, upload proof, then they approve to release your RP.</p>
      <div className="owner-stats">
        <div className="owner-stat"><b>{claims.length}</b><span>Grabs</span></div>
        <div className="owner-stat"><b>{pending}</b><span>Pending</span></div>
        <div className="owner-stat"><b>{done}</b><span>Done</span></div>
      </div>
      {opening.status !== 'closed' && (
        <button className="btn-close-req" onClick={close} disabled={closing}>
          {closing ? 'Closing…' : '✕ Close opening'}
        </button>
      )}
    </div>
  );
}

/* ---------- owner: claims list (upload proof / reject) ---------- */
function OwnerClaims({ claims, reload, setMsg, setError, onProof }) {
  const fileRefs = useRef({});
  const [busy, setBusy] = useState('');

  const uploadProof = async (claimId, file) => {
    if (!file) return;
    setBusy(claimId); setError(''); setMsg('');
    try {
      const url = await uploadToCloudinary(file, 'proof');
      await openingsApi.submitProof(claimId, url);
      setMsg('Proof uploaded. Waiting for the seeker to approve.');
      await reload();
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  const reject = async (claimId) => {
    const reason = window.prompt('Reason for rejecting? (required)');
    if (!reason || reason.trim().length < 3) return;
    setBusy(claimId); setError('');
    try { await openingsApi.reject(claimId, reason.trim()); setMsg('Claim rejected.'); await reload(); }
    catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  return (
    <div className="offers-section">
      <div className="offers-head"><h2>People who grabbed this ({claims.length})</h2></div>
      {claims.length === 0 ? (
        <div className="empty"><div className="em">📭</div><h3>No grabs yet</h3><p>When someone grabs your opening, they appear here.</p></div>
      ) : claims.map((c) => (
        <div className="claim-card" key={c.id}>
          <div className="claim-top">
            {c.seeker?.avatar_url
              ? <img className="claim-av" src={c.seeker.avatar_url} alt="" />
              : <div className="claim-av">{initialsOf(c.seeker?.full_name)}</div>}
            <div className="claim-who">
              <b>{c.seeker?.full_name || 'Seeker'}</b>
              <span>{c.seeker?.current_company} · Trust {c.seeker?.trust_score ?? 100}</span>
            </div>
            <span className={`chip ${c.status === 'approved' ? 'approved' : c.status === 'rejected' ? 'rejected' : 'pending'}`}>{c.status}</span>
          </div>
          {c.message && <p className="offer-msg">{c.message}</p>}
          {c.resume_url && <p><a className="dh-link" href={c.resume_url} target="_blank" rel="noreferrer">📄 Resume</a></p>}
          {c.proof_url && <p><a className="dh-link" onClick={() => onProof(c.proof_url)} style={{ cursor: 'pointer' }}>🧾 View proof</a></p>}
          {c.status === 'rejected' && c.rejection_reason && <p className="reject-note"><b>Rejected:</b> {c.rejection_reason}</p>}

          {c.status === 'pending' && (
            <div className="claim-actions">
              <button className="op-btn" style={{ flex: 1 }} disabled={busy === c.id} onClick={() => fileRefs.current[c.id]?.click()}>
                {busy === c.id ? 'Uploading…' : '🧾 Refer & upload proof'}
              </button>
              <button className="btn-reject" disabled={busy === c.id} onClick={() => reject(c.id)}>Reject</button>
              <input ref={(el) => (fileRefs.current[c.id] = el)} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                onChange={(e) => uploadProof(c.id, e.target.files?.[0])} />
            </div>
          )}
          {c.status === 'proof_submitted' && <p className="hint" style={{ color: 'var(--muted)', fontSize: 13 }}>⏳ Waiting for the seeker to approve your proof.</p>}
        </div>
      ))}
    </div>
  );
}

/* ---------- seeker: grab / view status / approve ---------- */
function SeekerPanel({ opening, claim, onDone, reload, setError, onProof }) {
  const [docs, setDocs] = useState([]);
  const [pickedId, setPickedId] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => { api.myDocuments().then((d) => setDocs(d || [])).catch(() => setDocs([])); }, []);

  const grab = async () => {
    setSaving(true); setError('');
    try {
      await openingsApi.claim(opening.id, { resume_url: resumeUrl || null, message });
      onDone('🎉 You grabbed this opening! The referrer will refer you and upload proof.');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const approve = async () => {
    setApproving(true); setError('');
    try {
      const r = await openingsApi.approve(claim.id);
      onDone(`✅ Approved! ${r.rp_moved} RP sent to the referrer.`);
      await reload();
    } catch (err) { setError(err.message); } finally { setApproving(false); }
  };

  // already claimed -> show status
  if (claim) {
    return (
      <div className="op-panel">
        <h3>Your grab</h3>
        <p className="lead">Status of your claim on this opening.</p>
        <p><span className={`chip ${claim.status === 'approved' ? 'approved' : claim.status === 'rejected' ? 'rejected' : 'pending'}`}>{claim.status}</span></p>
        {claim.proof_url && <p><a className="dh-link" onClick={() => onProof(claim.proof_url)} style={{ cursor: 'pointer' }}>🧾 View referral proof</a></p>}
        {claim.status === 'rejected' && claim.rejection_reason && <p className="reject-note"><b>Rejected:</b> {claim.rejection_reason}</p>}
        {claim.status === 'proof_submitted' && (
          <>
            <p className="lead">The referrer submitted proof. Approve to release <b>{opening.rp_price} RP</b>.</p>
            <button className="op-btn" onClick={approve} disabled={approving}>
              {approving ? 'Approving…' : `✓ Approve & pay ${opening.rp_price} RP`}
            </button>
          </>
        )}
        {claim.status === 'pending' && <p className="hint" style={{ color: 'var(--muted)', fontSize: 13 }}>⏳ Waiting for the referrer to refer you and upload proof.</p>}
        {claim.status === 'approved' && <p className="hint" style={{ color: 'var(--success)', fontSize: 13 }}>✅ Done — RP transferred. Good luck!</p>}
      </div>
    );
  }

  if (opening.status !== 'open') {
    return <div className="op-panel"><h3>Opening closed</h3><p className="lead">This opening is no longer accepting grabs.</p>
      <Link to="/openings" className="btn-cta" style={{ width: '100%', justifyContent: 'center' }}>← Find another</Link></div>;
  }

  return (
    <div className="op-panel">
      <h3>Grab this opening 🎁</h3>
      <p className="lead">Attach a resume, then grab a slot. You'll pay <b>{opening.rp_price} RP</b> only after the referrer proves the referral and you approve.</p>

      {docs.length > 0 && (
        <>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>Pick a saved resume</label>
          <div className="op-vault">
            {docs.map((d) => (
              <button type="button" key={d.id}
                className={`op-vault-chip ${pickedId === d.id ? 'active' : ''}`}
                onClick={() => {
                  if (pickedId === d.id) { setPickedId(null); setResumeUrl(''); }
                  else { setPickedId(d.id); setResumeUrl(d.url); }
                }}>
                <span>{d.kind === 'jd' ? '📑' : '📄'}</span>
                <span className="n">{d.name}</span>
                {pickedId === d.id && <span>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      <label style={{ fontSize: 13, fontWeight: 700, display: 'block', margin: '6px 0 8px' }}>Message (optional)</label>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="Why you're a fit…"
        style={{ width: '100%', minHeight: 80, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', border: '1px solid var(--border)', borderRadius: 12, resize: 'vertical', marginBottom: 12 }} />

      <button className="op-btn" onClick={grab} disabled={saving}>
        {saving ? 'Grabbing…' : '🎁 Grab this opening'}
      </button>
      <p className="mkt-slots-note">No RP is charged until you approve the referral proof.</p>
    </div>
  );
}
