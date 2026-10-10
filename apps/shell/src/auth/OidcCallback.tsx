import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function OidcCallback() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // The IdP may return an OAuth error before issuing a code. Handle that
    // response directly instead of attempting state validation without a
    // successful authorization response.
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get('error');
    if (providerError) {
      const description = params.get('error_description');
      setError(description ? `${providerError}: ${description}` : providerError);
      return;
    }

    auth.completeLogin().then((user) => {
      const state = user.state as { returnTo?: unknown } | undefined;
      const returnTo = typeof state?.returnTo === 'string' && state.returnTo.startsWith('/') && !state.returnTo.startsWith('//')
        ? state.returnTo : '/dashboard';
      navigate(returnTo, { replace: true });
    }).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Sign-in callback failed.');
    });
  }, [auth.completeLogin, navigate]);

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
    <section style={{ maxWidth: 520, padding: 28, border: '1px solid #e4e9f3', borderRadius: 16, background: '#fff' }}>
      <h1>{error ? 'Sign-in failed' : 'Completing sign-in…'}</h1>
      {error && <><p role="alert" style={{ color: '#b42318' }}>{error}</p><button onClick={() => navigate('/', { replace: true })}>Return to sign in</button></>}
    </section>
  </main>;
}
