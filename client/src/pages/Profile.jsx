import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api, uploadToCloudinary } from '../lib/api.js';
import './css/app.css';
import './css/profile.css';

const SENIORITY = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager'];
const initialsOf = (n = '?') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const trustLevel = (t = 100) => (t >= 90 ? 'hi' : t >= 60 ? 'mid' : 'lo');

export default function Profile() {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    current_company: profile?.current_company || '',
    role_title: profile?.role_title || '',
    seniority: profile?.seniority || 'Mid',
    linkedin_url: profile?.linkedin_url || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  if (!profile) return <div className="page"><div className="skeleton" style={{ height: 300, borderRadius: 22 }} /></div>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startEdit = () => {
    setForm({
      full_name: profile.full_name || '',
      current_company: profile.current_company || '',
      role_title: profile.role_title || '',
      seniority: profile.seniority || 'Mid',
      linkedin_url: profile.linkedin_url || '',
    });
    setAvatarUrl(profile.avatar_url || '');
    setMsg(''); setError('');
    setEditing(true);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      setAvatarUrl(await uploadToCloudinary(file, 'avatar'));
    } catch (err) { setError(`Avatar upload failed: ${err.message}`); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.full_name.trim() || !form.current_company.trim() || !form.role_title.trim()) {
      setError('Name, company and role are required.'); return;
    }
    if (form.linkedin_url && !/^https?:\/\/.+/i.test(form.linkedin_url)) {
      setError('LinkedIn URL must start with http(s)://'); return;
    }
    setSaving(true); setError('');
    try {
      await api.updateMyProfile({ ...form, avatar_url: avatarUrl || null });
      await refreshProfile();
      setMsg('✅ Profile updated.');
      setEditing(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const doSignOut = async () => { await signOut(); navigate('/login'); };

  const avatarNode = (url, ini) =>
    url ? <img className="pf-avatar" src={url} alt="avatar" /> : <div className="pf-avatar">{ini}</div>;

  const trust = profile.trust_score ?? 100;

  return (
    <div className="page">
      {msg && <div className="alert success" style={{ marginBottom: 16 }}>{msg}</div>}
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* BANNER + IDENTITY */}
      <div className="pf-banner" />
      <div className="pf-card">
        <div className="pf-idrow">
          <div className="pf-avatar-wrap">
            {avatarNode(editing ? avatarUrl : profile.avatar_url, initialsOf(editing ? form.full_name : profile.full_name))}
            {editing && (
              <>
                <span className="pf-cam" onClick={() => fileRef.current?.click()} title="Change photo">
                  {uploading ? '…' : '📷'}
                </span>
                <input ref={fileRef} className="hidden-input" type="file" accept="image/*" onChange={handleAvatar} />
              </>
            )}
          </div>

          <div className="pf-namebox">
            <h1>{profile.full_name || 'Your name'}</h1>
            <div className="role">
              <b>{profile.role_title || '—'}</b> · {profile.current_company || '—'}
            </div>
            <div className="pf-badges">
              <span className="chip approved">
                <span className={`trust-dot ${trustLevel(trust)}`} />Trust {trust}
              </span>
              {profile.seniority && <span className="chip fulfilled">{profile.seniority}</span>}
              {profile.is_premium && <span className="chip premium">💎 Premium</span>}
            </div>
          </div>

          {!editing && (
            <button className="pf-edit-btn" onClick={startEdit}>✏️ Edit profile</button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="pf-stats">
        <div className="pf-stat">
          <div className="ic">⚡</div>
          <b>{profile.rp_balance ?? 0}</b>
          <span>Referral Points</span>
        </div>
        <div className="pf-stat">
          <div className="ic">🛡️</div>
          <b>{trust}</b>
          <span>Trust score</span>
          <div className="bar"><i style={{ width: `${Math.min(100, trust)}%` }} /></div>
        </div>
        <div className="pf-stat">
          <div className="ic">{profile.is_premium ? '💎' : '🆓'}</div>
          <b style={{ fontSize: 18 }}>{profile.is_premium ? 'Premium' : 'Free'}</b>
          <span>{profile.is_premium && profile.premium_expiry
            ? `until ${new Date(profile.premium_expiry).toLocaleDateString()}`
            : 'Plan'}</span>
        </div>
      </div>

      {/* DETAILS (read) or EDIT FORM */}
      {!editing ? (
        <div className="pf-section">
          <h2>Details</h2>
          <div className="pf-grid">
            <div className="pf-item">
              <div className="k">Full name</div>
              <div className="v">{profile.full_name || <span className="empty">Not set</span>}</div>
            </div>
            <div className="pf-item">
              <div className="k">Email</div>
              <div className="v">{profile.email || <span className="empty">—</span>}</div>
            </div>
            <div className="pf-item">
              <div className="k">Company</div>
              <div className="v">{profile.current_company || <span className="empty">Not set</span>}</div>
            </div>
            <div className="pf-item">
              <div className="k">Role / title</div>
              <div className="v">{profile.role_title || <span className="empty">Not set</span>}</div>
            </div>
            <div className="pf-item">
              <div className="k">Seniority</div>
              <div className="v">{profile.seniority || <span className="empty">Not set</span>}</div>
            </div>
            <div className="pf-item">
              <div className="k">LinkedIn</div>
              <div className="v">
                {profile.linkedin_url
                  ? <a href={profile.linkedin_url} target="_blank" rel="noreferrer">View profile ↗</a>
                  : <span className="empty">Not added</span>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pf-section">
          <h2>Edit details</h2>
          <div className="pf-grid">
            <div className="pf-field">
              <label>Full name *</label>
              <input value={form.full_name} onChange={set('full_name')} placeholder="Your name" />
            </div>
            <div className="pf-field">
              <label>Company *</label>
              <input value={form.current_company} onChange={set('current_company')} placeholder="Company" />
            </div>
            <div className="pf-field">
              <label>Role / title *</label>
              <input value={form.role_title} onChange={set('role_title')} placeholder="e.g. Analyst Tester" />
            </div>
            <div className="pf-field">
              <label>LinkedIn URL</label>
              <input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" />
            </div>
            <div className="pf-field" style={{ gridColumn: '1 / -1' }}>
              <label>Seniority</label>
              <div className="pf-seg">
                {SENIORITY.map((s) => (
                  <button type="button" key={s}
                    className={form.seniority === s ? 'active' : ''}
                    onClick={() => setForm({ ...form, seniority: s })}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="pf-edit-actions">
            <button className="pf-save" onClick={save} disabled={saving || uploading}>
              {saving ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</> : '💾 Save changes'}
            </button>
            <button className="pf-cancel" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          </div>
        </div>
      )}

      {/* ACCOUNT */}
      <div className="pf-section">
        <h2>Account</h2>
        <div className="pf-account">
          <div className="txt">
            <b>Signed in with Google</b>
            <span>{profile.email || 'Your Google account'}</span>
          </div>
          <button className="pf-signout" onClick={doSignOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
