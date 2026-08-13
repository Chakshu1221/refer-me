import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export default function ProfileSetup() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    current_company: profile?.current_company || '',
    role_title: profile?.role_title || '',
    seniority: profile?.seniority || 'Mid',
    linkedin_url: profile?.linkedin_url || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.updateMyProfile(form);
      await refreshProfile();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h2>Complete your profile</h2>
      <p className="hint">This is shown to people you help and who help you.</p>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit} className="card">
        <label>Full name *</label>
        <input value={form.full_name} onChange={set('full_name')} required />

        <label>Current company *</label>
        <input value={form.current_company} onChange={set('current_company')} required />

        <label>Role / title *</label>
        <input value={form.role_title} onChange={set('role_title')} required />

        <label>Seniority</label>
        <select value={form.seniority} onChange={set('seniority')}>
          <option>Junior</option>
          <option>Mid</option>
          <option>Senior</option>
          <option>Lead</option>
          <option>Manager</option>
        </select>

        <label>LinkedIn URL</label>
        <input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" />

        <div className="btn-row">
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save & continue'}</button>
        </div>
      </form>
    </div>
  );
}
