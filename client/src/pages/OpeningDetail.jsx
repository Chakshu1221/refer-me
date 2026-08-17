import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, uploadToCloudinary } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './css/app.css';
import './css/detail.css';
import './css/openings.css';

const initialsOf = (n = '?') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const isImage = (url = '') => /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);

export default function OpeningDetail() {
  const { id } = useParams();
  const { refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState('');

  const load = async () => {
    try { setData(await api.getOpening(id)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return <div className="page"><div className="skeleton" style={{ height: 280, borderRadius: 20 }} /></div>;
  }
  if (!data) {
    return (
      <div className="page"><div className="empty">
        <div className="em">😕</div><h3>Opening not found</h3>
        <p>{error || 'This opening may have been removed.'}</p>
        <Link to="/openings" className="btn-cta">← Back to Openings</Link>
      </div></div>
    );
  }

  const { opening, claims, is_owner } = data;
  const reload = async () => { await load(); await refreshProfile(); };
  const left = Math.max(0, (opening.slots || 1) - (opening.slots_filled || 0));

  return (
    <div className="page">
      <Link to={is_owner ? '/openings' : '/openings'} className="detail-back">← Back to openings</Link>

      {msg && <div className="alert success" style={{ marginBottom: 16 }}>{msg}</div>}
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="detail-layout">
        <div>
          <div className="detail-hero">
            <div className="dh-top">
              <div className="dh-logo">{(opening.company_name || '?')[0].toUpperCase()}</div>
              <div className="dh-title">
                <h1>{opening.role_title}</h1>
                <span className="co">🏢 {opening.company_name}</span>
              </div>
              <span className={`chip ${opening.status}`} style={{ alignSelf: 'flex-start' }}>{opening.status}</span>
            </div>

            {opening.notes && <p className="dh-notes">{opening.notes}</p>}

            <div className="dh-links">
              <span className="dh-reward">⚡ {opening.rp_price} RP</span>
              <span className={`slots-badge ${left <= 1 ? 'low' : ''}`}>🎟️ {left} of {opening.slots} left</span>
              {opening.job_link && <a className="dh-link" href={opening.job_link} target="_blank" rel="noreferrer">🔗 Job link</a>}
              {opening.jd_doc_url && <a className="dh-link" href={opening.jd_doc_url} target="_blank" rel="noreferrer">📑 Job description</a>}
            </div>

            {opening.referrer && (
              <div className="dh-asker">
                {opening.referrer.avatar_url ? <img className="av" src={opening.referrer.avatar_url} alt="" /> : <div className="av">{initialsOf(opening.referrer.full_name)}</div>}
                <div>
                  <b>{opening.referrer.full_name}{opening.referrer.is_premium && <span className="chip premium" style={{ marginLeft: 8 }}>💎 Premium</span>}</b>
                  <span>{opening.referrer.current_company} · Trust {opening.referrer.trust_score ?? 100}</span>
                </div>
              </div>
            )}
          </div>

          {is_owner && (
            <OwnerClaims claims={claims} onProof={setLightbox} reload={reload} setMsg={setMsg} setError={setError} />
          )}
        </div>

        <div className="side-panel">
          {is_owner ? (
            <OwnerSummary opening={opening} claims={claims} reload={reload} setMsg={setMsg} setError={setError} />
          ) : (
            <SeekerPanel opening={opening} claim={claims[0]} left={left}
              onDone={(m) => { setMsg(m); reload(); }} onProofView={setLightbox} setError={setError} reload={reload} setMsg={setMsg} />
          )}
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox('')}>
          <button className="lightbox-close" onClick={() => setLightbox('')}>✕</button>
          {isImage(lightbox)
            ? <img src={lightbox} alt="proof" onClick={(e) => e.stopPropagation()} />
            : <div style={{ color: '#fff' }}>Preview not available for this file type.</div>}
          <a className="lightbox-open-new" href={lightbox} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Open original ↗</a>
        </div>
      )}
    </div>
  );
}

/* ---------- OWNER: summary ---------- */
function OwnerSummary({ opening, claims, reload, setMsg, setError }) {
  const [closing, setClosing] = useState(false);
  const pending = claims.filter((c) => c.status === 'pending').length;
  const approved = claims.filter((c) => c.status === 'approved').length;

  const closeIt = async () => {
    if (!window.confirm('Close this opening? It will stop accepting grabs.')) return;
    setClosing(true); setError(''); setMsg('');
    try { await api.closeOpening(opening.id); setMsg('Opening closed.'); await reload(); }
    catch (err) { setError(err.message); } finally { setClosing(false); }
  };

  return (
    <div className="panel-card">
      <h3>Your opening</h3>
      <p className="lead-p">Review who grabbed it, refer one, upload proof. They confirm and RP comes to you.</p>
      <div className="owner-stats">
        <div className="owner-stat"><b>{claims.length}</b><span>Grabs</span></div>
        <div className="owner-stat"><b>{pending}</b><span>Pending</span></div>
        <div className="owner-stat"><b>{approved}</b><span>Done</span></div>
      </div>
      {opening.status !== 'filled' && (
        <button className="btn-close-req" onClick={closeIt} disabled={closing}>
          {closing ? 'Closing…' : '✕ Close this opening'}
        </button>
      )}
    </div>
  );
}

/* ---------- OWNER: claims list (submit proof / reject) ---------- */
function OwnerClaims({ claims, onProof, reload, setMsg, setError }) {
  const [busy, setBusy] = useState('');
  const proofRefs = useRef({});
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const uploadProof = async (claim, file) => {
    if (!file) return;
    setBusy(claim.id); setError(''); setMsg('');
    try {
      const url = await uploadToCloudinary(file, 'proof');
      await api.submitClaimProof(claim.id, url);
      setMsg('Proof submitted. The seeker will confirm to release RP.');
      await reload();
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  const doReject = async () => {
    if (reason.trim().length < 3) return;
    const cid = rejecting.id;
    setBusy(cid); setError(''); setMsg('');
    try { await api.rejectClaim(cid, reason.trim()); setMsg('Grab rejected.'); setRejecting(null); setReason(''); await reload(); }
    catch (err) { setError(err.message); } finally { setBusy(''); }
  };

  return (
    <div className="offers-section">
      <div className="offers-head"><h2>People who grabbed this ({claims.length})</h2></div>

      {claims.length === 0 ? (
        <div className="empty"><div className="em">📭</div><h3>No grabs yet</h3><p>When a seeker grabs this opening, they appear here with their resume.</p></div>
      ) : claims.map((c) => (
        <div className="claim-card" key={c.id}>
          <div className="claim-top">
            {c.seeker?.avatar_url ? <img className="claim-av" src={c.seeker.avatar_url} alt="" /> : <div className="claim-av">{initialsOf(c.seeker?.full_name)}</div>}
            <div className="claim-who">
              <b>{c.seeker?.full_name || 'Seeker'}</b>
              <span>{c.seeker?.current_company} · Trust {c.seeker?.trust_score ?? 100}</span>
            </div>
            <span className={`chip ${c.status === 'proof_submitted' ? 'pending' : c.status}`}>
              {c.status === 'proof_submitted' ? 'awaiting confirm' : c.status}
            </span>
          </div>

          {c.message && <p className="claim-msg">{c.message}</p>}

          <div className="dh-links" style={{ marginBottom: 12 }}>
            <a className="dh-link" href={c.resume_url} target="_blank" rel="noreferrer">📄 Resume</a>
            {c.proof_url && <span className="dh-link" style={{ cursor: 'pointer' }} onClick={() => onProof(c.proof_url)}>🧾 Proof</span>}
          </div>

          {c.status === 'rejected' && c.rejection_reason && (
            <p className="reject-note"><b>Rejected:</b> {c.rejection_reason}</p>
          )}

          {c.status === 'pending' && (
            <div className="claim-actions">
              <button className="btn-approve" disabled={busy === c.id} onClick={() => proofRefs.current[c.id]?.click()}>
                {busy === c.id ? '…' : '🧾 Refer & upload proof'}
              </button>
              <button className="btn-reject" disabled={busy === c.id} onClick={() => { setRejecting(c); setReason(''); }}>Reject</button>
              <input ref={(el) => (proofRefs.current[c.id] = el)} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                onChange={(e) => uploadProof(c, e.target.files?.[0])} />
            </div>
          )}
          {c.status === 'proof_submitted' && (
            <p className="reject-note" style={{ color: '#92400e', background: '#fffbeb', borderColor: '#fde68a' }}>
              ⏳ Proof submitted — waiting for {c.seeker?.full_name || 'the seeker'} to confirm.
            </p>
          )}
          {c.status === 'approved' && (
            <p className="reject-note" style={{ color: '#166534', background: '#dcfce7', borderColor: '#86efac' }}>
              ✅ Confirmed — RP received.
            </p>
          )}
        </div>
      ))}

      {rejecting && (
        <div className="modal-overlay" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject this grab?</h3>
            <p>A reason is required and shared with {rejecting.seeker?.full_name || 'the seeker'}.</p>
            <textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. not a fit for this role…" />
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

/* ---------- SEEKER: grab / status / confirm ---------- */
function SeekerPanel({ opening, claim, left, onDone, onProofView, setError, reload, setMsg }) {
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [pickedDocId, setPickedDocId] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!claim) api.myDocuments().then((d) => setDocs(d || [])).catch(() => setDocs([]));
  }, [claim]);

  // ----- already grabbed: show status + confirm -----
  if (claim) {
    const step = claim.status;
    const confirm = async () => {
      setBusy(true); setError('');
      try {
        const r = await api.approveClaim(claim.id);
        onDone(`✅ Confirmed! ${r.rp_moved} RP sent to the referrer.`);
      } catch (err) { setError(err.message); } finally { setBusy(false); }
    };
    const reject = async () => {
      const reason = window.prompt('Reason for rejecting? (required)');
      if (!reason || reason.trim().length < 3) return;
      setBusy(true); setError('');
      try { await api.rejectClaim(claim.id, reason.trim()); setMsg('Grab cancelled.'); await reload(); }
      catch (err) { setError(err.message); } finally { setBusy(false); }
    };

    return (
      <div className="panel-card">
        <h3>Your grab</h3>
        <div className="claim-steps">
          <div className={`claim-step done`}><span className="n">✓</span><div><b>Grabbed</b><span>Your resume was sent</span></div></div>
          <div className={`claim-step ${step === 'proof_submitted' || step === 'approved' ? 'done' : 'active'}`}>
            <span className="n">2</span><div><b>Referrer refers you</b><span>{step === 'pending' ? 'Waiting for the referral + proof' : 'Proof submitted'}</span></div>
          </div>
          <div className={`claim-step ${step === 'approved' ? 'done' : step === 'proof_submitted' ? 'active' : ''}`}>
            <span className="n">3</span><div><b>You confirm</b><span>RP moves to the referrer</span></div>
          </div>
        </div>

        {claim.proof_url && (
          <div className="dh-links" style={{ margin: '10px 0' }}>
            <span className="dh-link" style={{ cursor: 'pointer' }} onClick={() => onProofView(claim.proof_url)}>🧾 View proof</span>
          </div>
        )}

        {claim.status === 'rejected' && claim.rejection_reason && (
          <p className="reject-note"><b>Rejected:</b> {claim.rejection_reason}</p>
        )}

        {claim.status === 'proof_submitted' && (
          <>
            <div className="pay-note"><span>⚡</span><span>Confirming pays <b>{opening.rp_price} RP</b> to the referrer.</span></div>
            <button className="btn-submit-offer success" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }} disabled={busy} onClick={confirm}>
              {busy ? 'Confirming…' : `✓ Confirm & pay ${opening.rp_price} RP`}
            </button>
            <button className="btn-cancel" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={reject}>Reject proof</button>
          </>
        )}
        {claim.status === 'pending' && (
          <p className="reject-note" style={{ color: '#92400e', background: '#fffbeb', borderColor: '#fde68a' }}>
            ⏳ Waiting for {opening.referrer?.full_name || 'the referrer'} to refer you and upload proof.
          </p>
        )}
        {claim.status === 'approved' && (
          <p className="reject-note" style={{ color: '#166534', background: '#dcfce7', borderColor: '#86efac' }}>🎉 Done! You paid {opening.rp_price} RP. Good luck!</p>
        )}
      </div>
    );
  }

  // ----- not grabbed yet: grab form -----
  if (opening.status !== 'open' || left <= 0) {
    return (
      <div className="panel-card">
        <h3>No slots left</h3>
        <p className="lead-p">This opening is fully taken. Find another.</p>
        <Link to="/openings" className="btn-cta" style={{ width: '100%', justifyContent: 'center' }}>← Back to openings</Link>
      </div>
    );
  }

  const pickDoc = (d) => {
    if (pickedDocId === d.id) { setPickedDocId(null); setResumeUrl(''); }
    else { setPickedDocId(d.id); setResumeUrl(d.url); }
  };
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try { setPickedDocId(null); setResumeUrl(await uploadToCloudinary(file, 'resume')); }
    catch (err) { setError(`Upload failed: ${err.message}`); }
    finally { setUploading(false); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!resumeUrl) { setError('A resume is required to grab this opening.'); return; }
    setSaving(true); setError('');
    try { await api.claimOpening(opening.id, { resume_url: resumeUrl, message }); onDone('🎉 Grabbed! The referrer will review your resume.'); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form className="panel-card" onSubmit={submit}>
      <h3>Grab this referral 🎁</h3>
      <p className="lead-p">Attach your resume. If the referrer refers you and you confirm, you pay <b>{opening.rp_price} RP</b>.</p>

      {docs.length > 0 && (
        <>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', margin: '4px 0 8px' }}>Use a saved resume</label>
          <div className="vault-picker" style={{ marginBottom: 12 }}>
            {docs.filter((d) => d.kind === 'resume' || d.kind === 'other').map((d) => (
              <button type="button" key={d.id} className={`vault-chip ${pickedDocId === d.id ? 'active' : ''}`} onClick={() => pickDoc(d)}>
                <span className="vc-ic">📄</span><span className="vc-name">{d.name}</span>
                {pickedDocId === d.id && <span className="vc-check">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={`proof-zone ${resumeUrl ? 'done' : ''}`} onClick={() => fileRef.current?.click()}>
        <div className="pz-ic">{resumeUrl ? '✅' : '📄'}</div>
        <b>{uploading ? 'Uploading…' : pickedDocId ? 'Resume from vault' : resumeUrl ? 'Resume ready' : 'Upload resume'}</b>
        <span>PDF or DOC · required</span>
        <input ref={fileRef} className="hidden-input" type="file" accept=".pdf,.doc,.docx" onChange={handleFile} />
      </div>
      {resumeUrl && <button type="button" className="proof-remove" onClick={() => { setResumeUrl(''); setPickedDocId(null); }}>Remove</button>}

      <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block', margin: '14px 0 7px' }}>Message <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(optional)</span></label>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why you're a great fit…"
        style={{ width: '100%', minHeight: 80, padding: '12px 14px', fontSize: 14, fontFamily: 'inherit', border: '1px solid var(--border)', borderRadius: 12, resize: 'vertical' }} />

      <button className="btn-submit-offer" disabled={saving || uploading || !resumeUrl}>
        {saving ? 'Grabbing…' : '🎁 Grab this opening'}
      </button>
    </form>
  );
}
