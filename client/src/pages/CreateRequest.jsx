import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadToCloudinary } from '../lib/api.js';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '', role_title: '', job_link: '', notes: '', rp_cost: 50,
  });
  const [resumeUrl, setResumeUrl] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleFile = async (e, kind, setter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    setError('');
    try {
      const url = await uploadToCloudinary(file, kind);
      setter(url);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
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

  return (
    <div className="container" style={{ maxWidth: 620 }}>
      <h2>Ask for a referral</h2>
      <p className="hint">You only spend RP when you approve a referral with valid proof.</p>
      {error && <div className="alert error">{error}</div>}

      <form onSubmit={submit} className="card">
        <label>Company *</label>
        <input value={form.company_name} onChange={set('company_name')} required />

        <label>Role / title *</label>
        <input value={form.role_title} onChange={set('role_title')} required />

        <label>Job link</label>
        <input value={form.job_link} onChange={set('job_link')} placeholder="https://…/jobs/123" />

        <label>Notes for the referrer</label>
        <textarea value={form.notes} onChange={set('notes')} placeholder="Why you're a good fit, your experience, etc." />

        <label>RP reward for the referrer (10–500)</label>
        <input type="number" min="10" max="500" value={form.rp_cost} onChange={set('rp_cost')} />
        <p className="hint">This is deducted from you and credited to the referrer on approval.</p>

        <label>Resume (PDF/doc)</label>
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleFile(e, 'resume', setResumeUrl)} />
        <div className="file-row">
          {uploading === 'resume' ? 'Uploading…' : resumeUrl ? '✅ Resume uploaded' : 'Optional'}
        </div>

        <label>Job description doc</label>
        <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => handleFile(e, 'jd', setJdUrl)} />
        <div className="file-row">
          {uploading === 'jd' ? 'Uploading…' : jdUrl ? '✅ JD uploaded' : 'Optional'}
        </div>

        <div className="btn-row">
          <button className="btn" disabled={saving || uploading}>
            {saving ? 'Posting…' : 'Post request'}
          </button>
        </div>
      </form>
    </div>
  );
}
