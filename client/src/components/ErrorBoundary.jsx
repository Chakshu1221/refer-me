import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, msg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, msg: error?.message || 'Something went wrong' };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, msg: '' });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        fontFamily: "'Poppins', system-ui, sans-serif", background: '#f8fafc', padding: 20,
      }}>
        <div style={{
          maxWidth: 420, width: '100%', textAlign: 'center', background: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 20, padding: '36px 28px',
          boxShadow: '0 20px 44px -30px rgba(30,27,75,.3)',
        }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>😵‍💫</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
            Something hiccuped
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
            The page didn't load correctly. This is usually a temporary session
            glitch — reloading fixes it.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              width: '100%', padding: '13px 18px', border: 'none', borderRadius: 12,
              background: 'linear-gradient(135deg,#4f46e5,#4338ca)', color: '#fff',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >
            ↻ Reload the app
          </button>
        </div>
      </div>
    );
  }
}
