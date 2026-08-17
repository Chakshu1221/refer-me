import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, uploadToCloudinary } from '../lib/api.js';
import './css/app.css';
import './css/create.css';
import './css/openings.css';

const NOTES_MAX = 400;

export default function OfferReferral() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const jdRef = useRef(null);

  const [form, setForm] = useState({
    company_name: profile?.current_company || '',
    role_title: '', job_link: '', notes: '', slots: 1, rp_price: 50,
  });
  const [jdUrl, setJdUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const blur = (k) => () => setTouched({ ...touched, [k]: true });

  const errors = useMemo(() => {
    const e = {};
    if (!form.company_name.trim()) e.company_name = 'Company is required';
    if (!form.role_title.trim()) e.role_title = 'Role is required';
    if (form.job_link && !/^https?:\/\/.+/i.test(form.job_link)) e.job_link = 'Must start with http(s)://';
    return e;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0 && !saving && !uploading;

  const handleJd = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try { setJdUrl(await uploadToCloudinary(file, 'jd')); }
    catch (err) { setError(`Upload failed: ${err.message}`); }
    finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ company_name: true, role_title: true, job_link: true });
    if (Object.keys(errors).length) return;
    setError(''); setSaving(true);
    try {
      const o = await api.createOpening({
        ...form,
        slots: Number(form.slots),
        rp_price: Number(form.rp_price),
        jd_doc_url: jdUrl || null,
      });
      navigate(`/opening/${o.id}`);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const companyInitial = (form.company_name || '?')[0].toUpperCase();
  const myInitials = (profile?.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="page">
      <div className="create-head">
        <h1>Offer a referral 🎁</h1>
        <p>Post an opening you can refer for. Seekers grab it with their resume; you earn RP when you refer them.</p>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="create-layout">
        <div className="create-card">
          <form className="cform" onSubmit={submit} noValidate>
            <div className="two-col">
              <div className="field">
                <label>Company <span className="req">*</span></label>
                <div className="ctrl"><span className="lead">🏢</span>
                  <input className="with-lead" value={form.company_name} onChange={set('company_name')} onBlur={blur('company_name')} placeholder="e.g. Google" />
                </div>
                {touched.company_name && errors.company_name && <div className="err">{errors.company_name}</div>}
              </div>
              <div className="field">
                <label>Role / title <span className="req">*</span></label>
                <div className="ctrl"><span className="lead">💼</span>
                  <input className="with-lead" value={form.role_title} onChange={set('role_title')} onBlur={blur('role_title')} placeholder="e.g. SDET II" />
                </div>
                {touched.role_title && errors.role_title && <div className="err">{errors.role_title}</div>}
              </div>
            </div>

            <div className="field">
              <label>Job link <span className="opt">(optional)</span></label>
              <div className="ctrl"><span className="lead">🔗</span>
                <input className="with-lead" value={form.job_link} onChange={set('job_link')} onBlur={blur('job_link')} placeholder="https://careers.company.com/jobs/123" />
              </div>
              {touched.job_link && errors.job_link && <div className="err">{errors.job_link}</div>}
            </div>

            <div className="field">
              <label>Notes for seekers <span className="opt">(optional)</span></label>
              <textarea maxLength={NOTES_MAX} value={form.notes} onChange={set('notes')} placeholder="What you're looking for, team, must-haves…" />
              <div className="char-count">{form.notes.length}/{NOTES_MAX}</div>
            </div>

            <div className="two-col">
              <div className="field">
                <label>How many can you refer? <span className="req">*</span></label>
                <div className="ctrl"><span className="lead">🎟️</span>
                  <input className="with-lead" type="number" min="1" max="20" value={form.slots} onChange={set('slots')} />
                </div>
              </div>
              <div className="field">
                <label>RP price per referral <span className="req">*</span></label>
                <div className="ctrl"><span className="lead">⚡</span>
                  <input className="with-lead" type="number" min="10" max="500" step="5" value={form.rp_price} onChange={set('rp_price')} />
                </div>
              </div>
            </div>

            <div className="pay-note">
              <span>💡</span>
              <span>The <b>seeker pays</b> this RP to you when they confirm your referral. You never pay to help.</span>
            </div>

            <div className="field">
              <label>Job description <span className="opt">(optional)</span></label>
              <div className="uploads-row">
                <div className={`dropzone ${jdUrl ? 'done' : ''}`} onClick={() => jdRef.current?.click()}>
                  <div className="dz-ic">{jdUrl ? '✅' : '📑'}</div>
                  <b>{uploading ? 'Uploading…' : jdUrl ? 'JD added' : 'Upload JD'}</b>
                  <span>PDF, DOC or image</span>
                  {jdUrl && <span className="dz-remove" onClick={(e) => { e.stopPropagation(); setJdUrl(''); }}>Remove</span>}
                  <input ref={jdRef} className="hidden-input" type="file" accept=".pdf,.doc,.docx,image/*" onChange={handleJd} />
                </div>
              </div>
            </div>

            <div className="create-actions">
              <button className="btn-post" disabled={!canSubmit}>
                {saving ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Posting…</> : <>🎁 Post opening</>}
              </button>
              <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </form>
        </div>

        <div className="preview-wrap">
          <div className="preview-label">👁️ Live preview</div>
          <div className="preview-card">
            <div className="pv-head">
              <div className="pv-logo">{companyInitial}</div>
              <div className="pv-title">
                <h3>{form.role_title || 'Role title'}</h3>
                <span>🏢 {form.company_name || 'Company name'}</span>
              </div>
            </div>
            <p className="pv-notes">{form.notes || 'Your notes to seekers will appear here…'}</p>
            <div className="pv-docs">
              <span className="slots-badge">🎟️ {form.slots || 1} slot{Number(form.slots) === 1 ? '' : 's'}</span>
              {jdUrl && <span className="doc-tag">📑 JD</span>}
              {form.job_link && <span className="doc-tag">🔗 Link</span>}
            </div>
            <div className="pv-foot">
              <div className="pv-asker">
                {profile?.avatar_url ? <img className="av" src={profile.avatar_url} alt="" style={{ objectFit: 'cover' }} /> : <div className="av">{myInitials}</div>}
                <b>{profile?.full_name || 'You'}</b>
              </div>
              <span className="pv-reward">⚡ {form.rp_price} RP</span>
            </div>
          </div>
          <div className="pv-tip">💡 Seekers see this card and grab it with their resume. You then refer them and upload proof to get paid.</div>
        </div>
      </div>
    </div>
  );
}
