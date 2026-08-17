import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { openingsApi } from '../lib/openingsApi.js';
import './css/app.css';
import './css/create.css';
import './css/openings.css';

const PRESETS = [30, 50, 80, 120];

export default function PostOpening() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '', role_title: '', job_link: '', notes: '', rp_price: 50, slots_total: 1,
  });
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

  const canSubmit = Object.keys(errors).length === 0 && !saving;

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ company_name: true, role_title: true, job_link: true });
    if (Object.keys(errors).length) return;
    setError(''); setSaving(true);
    try {
      const created = await openingsApi.create({
        ...form,
        rp_price: Number(form.rp_price),
        slots_total: Number(form.slots_total),
      });
      navigate(`/opening/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="create-head">
        <h1>Offer a referral 🎁</h1>
        <p>Post an opening at your company. Seekers grab a slot, you refer them, upload proof, and earn RP on approval.</p>
      </div>

      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="create-card" style={{ maxWidth: 640 }}>
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
              <label>Role you can refer for <span className="req">*</span></label>
              <div className="ctrl">
                <span className="lead">💼</span>
                <input className="with-lead" value={form.role_title}
                  onChange={set('role_title')} onBlur={blur('role_title')} placeholder="e.g. SDET / QA Engineer" />
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
            <label>Notes for seekers <span className="opt">(optional)</span></label>
            <textarea value={form.notes} onChange={set('notes')}
              placeholder="What you need from them, team, eligibility, etc." />
          </div>

          <div className="two-col">
            <div className="field">
              <label>How many can you refer?</label>
              <input type="number" min="1" max="20" value={form.slots_total} onChange={set('slots_total')} />
              <p className="hint" style={{ fontSize: 12, color: 'var(--muted)' }}>Slots (1–20)</p>
            </div>

            <div className="field">
              <label>RP you'll earn per referral</label>
              <input type="number" min="10" max="500" value={form.rp_price} onChange={set('rp_price')} />
              <div className="rp-presets" style={{ marginTop: 8 }}>
                {PRESETS.map((p) => (
                  <button type="button" key={p}
                    className={`rp-preset ${Number(form.rp_price) === p ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, rp_price: p })}>
                    {p} RP
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="create-actions">
            <button className="op-btn" disabled={!canSubmit} style={{ flex: 1 }}>
              {saving ? 'Posting…' : '🎁 Post opening'}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
