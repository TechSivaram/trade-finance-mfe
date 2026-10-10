import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

const pageStyle = {
  minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
  background: 'linear-gradient(135deg, #f5f7fb, #e9eefb)', fontFamily: "'DM Sans', sans-serif", color: '#17233b',
} as const;
const cardStyle = {
  width: 'min(100%, 480px)', background: '#fff', border: '1px solid #e4e9f3',
  borderRadius: 18, padding: 32, boxShadow: '0 18px 55px #1b315012',
} as const;


export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const redirectStarted = useRef(false);
  const [redirectError, setRedirectError] = useState('');

  useEffect(() => {
    if (auth.isLoading || auth.isAuthenticated || auth.isLoggingOut || !auth.isConfigured || redirectStarted.current) return;
    redirectStarted.current = true;
    auth.login().catch((reason: unknown) => {
      setRedirectError(reason instanceof Error ? reason.message : 'Unable to redirect to TSCloak.');
      redirectStarted.current = false;
    });
  }, [auth.isLoading, auth.isAuthenticated, auth.isLoggingOut, auth.isConfigured, auth.login]);

  if (auth.isLoggingOut) {
    return <div style={pageStyle} aria-live="polite"><div style={cardStyle}>Signing out of TSCloak…</div></div>;
  }

  if (auth.isLoading || (!auth.isAuthenticated && auth.isConfigured && !redirectError)) {
    return <div style={pageStyle} aria-live="polite"><div style={cardStyle}>Redirecting to TSCloak…</div></div>;
  }

  if (!auth.isConfigured) {
    return <div style={pageStyle}><section style={cardStyle}>
      <div style={{ color: '#526ce0', fontWeight: 800, letterSpacing: 1 }}>TRADEFLOW · OIDC</div>
      <h1 style={{ marginBottom: 8 }}>OIDC configuration required</h1>
      <p>Set <code>VITE_OIDC_CLIENT_ID</code> in <code>apps/shell/.env</code> to a registered TSCloak public client, then restart the dev server.</p>
      <p style={{ color: '#69758b', fontSize: 13 }}>This browser app uses Authorization Code Flow with PKCE. Do not configure a client secret here.</p>
    </section></div>;
  }

  if (!auth.isAuthenticated) {
    return <div style={pageStyle}><section style={cardStyle}>
      <h1>Unable to start sign-in</h1>
      <p role="alert" style={{ color: '#b42318' }}>{redirectError || auth.error || 'TSCloak sign-in could not be started.'}</p>
      <button onClick={() => { setRedirectError(''); redirectStarted.current = false; }}>Try again</button>
    </section></div>;
  }

  return <>{children}</>;
}
