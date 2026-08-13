import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, uploadToCloudinary } from '../lib/api.js';
import './css/auth.css';
import './css/setup.css';

const SENIORITY = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager'];

export default function ProfileSetup() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    current_company: profile?.current_company || '',
    role_title: profile?.role_title || '',
    seniority: profile?.seniority || 'Mid',
    linkedin_url: profile?.linkedin_url || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const blur = (k) => () => setTouched({ ...touched, [k]: true });

  // ---- validation ----
  const errors = useMemo(() => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Please enter your name';
    if (!form.current_company.trim()) e.current_company = 'Company is required';
    if (!form.role_title.trim()) e.role_title = 'Role is required';
    if (form.linkedin_url && !/^https?:\/\/.+/i.test(form.linkedin_url))
      e.linkedin_url = 'Must start with http(s)://';
    return e;
  }, [form]);

  const requiredFilled = ['full_name', 'current_company', 'role_title']
    .filter((k) => form[k].trim()).length;
  const progress = Math.round((requiredFilled / 3) * 100);
  const canSubmit = Object.keys(errors).length === 0 && !saving && !uploading;

  const initials = (form.full_name || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  // ---- avatar upload ----
  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file, 'avatar');
      setAvatarUrl(url);
    } catch (err) {
      setError(`Avatar upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ---- submit ----
  const submit = async (e) => {
    e.preventDefault();
    setTouched({ full_name: true, current_company: true, role_title: true, linkedin_url: true });
    if (Object.keys(errors).length) return;
    setError('');
    setSaving(true);
    try {
      await api.updateMyProfile({ ...form, avatar_url: avatarUrl || null });
      await refreshProfile();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* -------- LEFT: welcome / steps -------- */}
      <aside className="auth-brand">
        <div className="auth-brand-top">
          <div className="auth-logo">
            <span className="dot">🤝</span>
            <b>Refer<span>Me!</span></b>
          </div>
        </div>

        <div className="auth-headline">
          <h1>One quick step to <em>set you up.</em></h1>
          <p>
            Your profile is what people see when you ask for a referral — or when
            you offer one. A complete profile builds trust and gets faster replies.
          </p>

          <div className="welcome-steps">
            <div className="welcome-step done">
              <span className="n">✓</span>
              <div><b>Signed in with Google</b><span>Welcome aboard!</span></div>
            </div>
            <div className="welcome-step">
              <span className="n">2</span>
              <div><b>Complete your profile</b><span>Company, role & a photo — you're here.</span></div>
            </div>
            <div className="welcome-step">
              <span className="n">3</span>
              <div><b>Start referring</b><span>Ask for or give your first referral.</span></div>
            </div>
          </div>

          <div className="auth-stat" style={{ marginTop: 26 }}>
            <span className="rp">⚡</span>
            <div>
              <b>100 RP ready</b>
              <span>waiting in your account</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: 13, color: '#9aa6d6' }}>
          © {new Date().getFullYear()} Refer Me!
        </div>
      </aside>

      {/* -------- RIGHT: the form -------- */}
      <main className="setup-panel">
        <div className="setup-card">
          <div className="auth-mini-brand">
            <span className="dot">🤝</span>
            <b>Refer<span>Me!</span></b>
          </div>

          <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Complete your profile</h2>
          <p className="sub" style={{ margin: '0 0 18px' }}>
            This is shown to people you help and who help you.
          </p>

          {error && <div className="alert error" style={{ marginBottom: 14 }}>{error}</div>}

          {/* avatar */}
          <div className="setup-avatar">
            <div className="avatar-ring">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" />
                : <div className="ph">{initials}</div>}
            </div>
            <div className="avatar-meta">
              <b>Profile photo</b>
              <span>{uploading ? 'Uploading…' : 'PNG or JPG, up to ~5MB'}</span>
              <div className="avatar-actions">
                <button type="button" className="mini-btn" onClick={() => fileRef.current?.click()}>
                  {avatarUrl ? 'Change' : 'Upload'}
                </button>
                {avatarUrl && (
                  <button type="button" className="mini-btn ghost" onClick={() => setAvatarUrl('')}>
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef} className="hidden-input" type="file"
                accept="image/*" onChange={handleAvatar}
              />
            </div>
          </div>

          <form className="setup-form" onSubmit={submit} noValidate>
            <div className="field">
              <label>Full name <span className="req">*</span></label>
              <div className="ctrl">
                <input
                  value={form.full_name} onChange={set('full_name')} onBlur={blur('full_name')}
                  placeholder="e.g. Chandra Prakash"
                />
              </div>
              {touched.full_name && errors.full_name && <div className="err">{errors.full_name}</div>}
            </div>

            <div className="form-grid two">
              <div className="field">
                <label>Current company <span className="req">*</span></label>
                <div className="ctrl">
                  <span className="lead">🏢</span>
                  <input
                    className="with-lead"
                    value={form.current_company} onChange={set('current_company')} onBlur={blur('current_company')}
                    placeholder="e.g. FNZ"
                  />
                </div>
                {touched.current_company && errors.current_company && <div className="err">{errors.current_company}</div>}
              </div>

              <div className="field">
                <label>Role / title <span className="req">*</span></label>
                <div className="ctrl">
                  <span className="lead">💼</span>
                  <input
                    className="with-lead"
                    value={form.role_title} onChange={set('role_title')} onBlur={blur('role_title')}
                    placeholder="e.g. Analyst Tester"
                  />
                </div>
                {touched.role_title && errors.role_title && <div className="err">{errors.role_title}</div>}
              </div>
            </div>

            <div className="field">
              <label>Seniority</label>
              <div className="segmented">
                {SENIORITY.map((s) => (
                  <button
                    type="button" key={s}
                    className={form.seniority === s ? 'active' : ''}
                    onClick={() => setForm({ ...form, seniority: s })}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>LinkedIn URL <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(optional)</span></label>
              <div className="ctrl">
                <span className="lead">🔗</span>
                <input
                  className="with-lead"
                  value={form.linkedin_url} onChange={set('linkedin_url')} onBlur={blur('linkedin_url')}
                  placeholder="https://linkedin.com/in/…"
                />
              </div>
              {touched.linkedin_url && errors.linkedin_url && <div className="err">{errors.linkedin_url}</div>}
            </div>

            {/* progress */}
            <div className="setup-progress"><i style={{ width: `${progress}%` }} /></div>
            <div className="setup-progress-label">
              {progress === 100 ? '✓ All set — ready to go!' : `${requiredFilled} of 3 required fields completed`}
            </div>

            <button className="btn-primary-lg" disabled={!canSubmit}>
              {saving ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Saving…
                </>
              ) : (
                <>Save &amp; continue →</>
              )}
            </button>
          </form>

          <p className="setup-hint">
            You can edit these details anytime from your profile.
          </p>
        </div>
      </main>
    </div>
  );
}
