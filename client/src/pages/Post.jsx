import { Link } from 'react-router-dom';
import './css/app.css';

export default function Post() {
  return (
    <div className="page">
      <div className="create-head" style={{ marginBottom: 22 }}>
        <h1>What do you want to post? 📝</h1>
        <p>Two ways to help on Refer Me! — pick the one that fits you right now.</p>
      </div>

      <div className="action-grid">
        <Link to="/create" className="action-card a-ask">
          <span className="big">🙋</span>
          <div>
            <h3>Ask for a referral</h3>
            <p>You're job hunting. Post a role you want and let people at that company refer you. You pay RP only when you approve a valid referral.</p>
          </div>
          <span className="arrow">→</span>
        </Link>

        <Link to="/offer" className="action-card a-give">
          <span className="big">🎁</span>
          <div>
            <h3>Offer a referral</h3>
            <p>You can refer people at your company. Post an opening; seekers grab it with their resume. You earn RP when you refer them.</p>
          </div>
          <span className="arrow">→</span>
        </Link>
      </div>

      <div className="empty" style={{ marginTop: 8, textAlign: 'left', padding: '18px 20px' }}>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5 }}>
          💡 <b>Not sure?</b> If you <b>want</b> a referral, choose <b>Ask</b>.
          If you <b>can give</b> a referral, choose <b>Offer</b>. RP always flows from the
          person receiving help to the person giving it — helping is how you earn.
        </p>
      </div>
    </div>
  );
}
