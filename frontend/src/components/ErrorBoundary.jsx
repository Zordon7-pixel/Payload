import React from 'react';
import { AlertTriangle, Wrench } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[PAYLOAD Error]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32, fontFamily: 'sans-serif' }}>
          <AlertTriangle size={48} color="#f59e0b" />
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0, textAlign: 'center', maxWidth: 400 }}>
            PAYLOAD ran into an unexpected error. Click below to attempt an automatic repair and reload.
          </p>
          <p style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', background: '#1a1d2e', padding: '8px 16px', borderRadius: 8, maxWidth: 500, wordBreak: 'break-all' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button onClick={() => window.location.reload()} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Wrench size={14} />
              Repair &amp; Reload
            </span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
