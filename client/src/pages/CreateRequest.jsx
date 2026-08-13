import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, uploadToCloudinary } from '../lib/api.js';
import './css/app.css';
import './css/create.css';

const NOTES_MAX = 400;
const PRESETS = [30, 50, 80, 120];

export default function CreateRequest() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const resumeRef = useRef(null);
  const jdRef = useRef(null);

  const [form, setForm] = useState({
    company_name: '', role_title: '', job_link: '', notes: '', rp_cost: 50,
  });
  const [resumeUrl, setResumeUrl] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [uploading, setUploading] = useState('');
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

  const handleFile = async (e, kind, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(kind); setError('');
    try {
      setter(await uploadToCloudinary(file, kind));
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ company_name: true, role_title: true, job_link: true });
    if (Object.keys(errors).length) return;
    setError(''); setSaving(true);
    try {
      const req = await api.createRequest({
        ...form,
        rp_cost: Number(form.rp_cost),
        resume_url: resumeUrl || null,
        jd_doc_url: jdUrl || null,
      });
      navigate(`/request/${req.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const myInitials = (profile?.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const companyInitial = (form.company_name || '?')[0].toUpperCase();

  return (
    <div className="page">
      <div className="create-head">
        <h1>Ask for a referral 🙋</h1>
        <p>Post a role you want. You only spend RP when you approve a referral with valid proof.</p>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="create-layout">
        {/* ---------- FORM ---------- */}
        <div className="create-card">
          <form className="cform" onSubmit={submit} noValidate>
            <div className="two-col">
              <div className="field">
                <label>Company <span className="req">*</span></label>
                <div className="ctrl">
                  <span className="lead">🏢</span>
                  <input className="with-lead" value={form.company_name}
                    onChange={set('company_name')} onBlur={blur('company_name')} placeholder="e.g. Google" />
                </div>
                {touched.company_name && errors.company_name && <div className="err">{errors.company_name}</div>}
              </div>

              <div className="field">
                <label>Role / title <span className="req">*</span></label>
                <div className="ctrl">
                  <span className="lead">💼</span>
                  <input className="with-lead" value={form.role_title}
                    onChange={set('role_title')} onBlur={blur('role_title')} placeholder="e.g. Senior QA Engineer" />
                </div>
                {touched.role_title && errors.role_title && <div className="err">{errors.role_title}</div>}
              </div>
            </div>

            <div className="field">
              <label>Job link <span className="opt">(optional)</span></label>
              <div className="ctrl">
                <span className="lead">🔗</span>
                <input className="with-lead" value={form.job_link}
                  onChange={set('job_link')} onBlur={blur('job_link')} placeholder="https://careers.company.com/jobs/123" />
              </div>
              {touched.job_link && errors.job_link && <div className="err">{errors.job_link}</div>}
            </div>

            <div className="field">
              <label>Notes for the referrer <span className="opt">(optional)</span></label>
              <textarea maxLength={NOTES_MAX} value={form.notes} onChange={set('notes')}
                placeholder="Why you're a great fit — experience, key skills, why this team…" />
              <div className="char-count">{form.notes.length}/{NOTES_MAX}</div>
            </div>

            {/* RP reward */}
            <div className="field">
              <label>Referral reward</label>
              <div className="rp-box">
                <div className="rp-box-top">
                  <span>Points paid to the referrer on approval</span>
                  <span className="rp-value">⚡ {form.rp_cost} RP</span>
                </div>
                <input type="range" className="rp-range" min="10" max="500" step="5"
                  value={form.rp_cost} onChange={set('rp_cost')} />
                <div className="rp-ticks"><span>10</span><span>250</span><span>500</span></div>
                <div className="rp-presets">
                  {PRESETS.map((p) => (
                    <button type="button" key={p}
                      className={`rp-preset ${Number(form.rp_cost) === p ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, rp_cost: p })}>
                      {p} RP
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* uploads */}
            <div className="field">
              <label>Attachments <span className="opt">(optional)</span></label>
              <div className="uploads-row">
                <div className={`dropzone ${resumeUrl ? 'done' : ''}`} onClick={() => resumeRef.current?.click()}>
                  <div className="dz-ic">{resumeUrl ? '✅' : '📄'}</div>
                  <b>{uploading === 'resume' ? 'Uploading…' : resumeUrl ? 'Resume added' : 'Upload resume'}</b>
                  <span>PDF or DOC</span>
                  {resumeUrl && <span className="dz-remove" onClick={(e) => { e.stopPropagation(); setResumeUrl(''); }}>Remove</span>}
                  <input ref={resumeRef} className="hidden-input" type="file" accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFile(e, 'resume', setResumeUrl)} />
                </div>

                <div className={`dropzone ${jdUrl ? 'done' : ''}`} onClick={() => jdRef.current?.click()}>
                  <div className="dz-ic">{jdUrl ? '✅' : '📑'}</div>
                  <b>{uploading === 'jd' ? 'Uploading…' : jdUrl ? 'JD added' : 'Upload job description'}</b>
                  <span>PDF, DOC or image</span>
                  {jdUrl && <span className="dz-remove" onClick={(e) => { e.stopPropagation(); setJdUrl(''); }}>Remove</span>}
                  <input ref={jdRef} className="hidden-input" type="file" accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleFile(e, 'jd', setJdUrl)} />
                </div>
              </div>
            </div>

            <div className="create-actions">
              <button className="btn-post" disabled={!canSubmit}>
                {saving ? (
                  <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Posting…</>
                ) : (
                  <>🚀 Post request</>
                )}
              </button>
              <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </form>
        </div>

        {/* ---------- LIVE PREVIEW ---------- */}
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
            <p className="pv-notes">{form.notes || 'Your notes to the referrer will appear here…'}</p>
            <div className="pv-docs">
              {resumeUrl && <span className="doc-tag">📄 Resume</span>}
              {jdUrl && <span className="doc-tag">📑 JD</span>}
              {form.job_link && <span className="doc-tag">🔗 Link</span>}
              {!resumeUrl && !jdUrl && !form.job_link && <span className="doc-tag" style={{ opacity: .6 }}>No attachments yet</span>}
            </div>
            <div className="pv-foot">
              <div className="pv-asker">
                {profile?.avatar_url
                  ? <img className="av" src={profile.avatar_url} alt="" style={{ objectFit: 'cover' }} />
                  : <div className="av">{myInitials}</div>}
                <b>{profile?.full_name || 'You'}</b>
              </div>
              <span className="pv-reward">⚡ {form.rp_cost} RP</span>
            </div>
          </div>
          <div className="pv-tip">
            💡 This is exactly how your request appears to potential referrers in the marketplace. A clear role, notes and attachments get faster referrals.
          </div>
        </div>
      </div>
    </div>
  );
}
