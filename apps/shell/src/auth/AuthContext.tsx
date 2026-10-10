import {
  UserManager,
  WebStorageStateStore,
  type User,
} from 'oidc-client-ts';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const authority = 'https://tscloak.onrender.com';
const configuredClientId = (import.meta.env.VITE_OIDC_CLIENT_ID ?? '').trim();
const isPlaceholder = !configuredClientId || /^(YOUR_|REPLACE_|<|client-id)/i.test(configuredClientId);
const clientId = isPlaceholder ? '' : configuredClientId;

// This is a public browser client: never put a client secret in a Vite env variable.
const userManager = clientId
  ? new UserManager({
      authority,
      client_id: clientId,
      redirect_uri: `${window.location.origin}/auth/callback`,
      post_logout_redirect_uri: `${window.location.origin}/signed-out`,
      response_type: 'code',
      scope: 'openid profile email',
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      loadUserInfo: true,
      filterProtocolClaims: true,
      automaticSilentRenew: false,
      monitorSession: false,
    })
  : null;

interface AuthContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  user: User | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  error: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  completeLogin: () => Promise<User>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userManager));
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!userManager) {
      setIsLoading(false);
      return;
    }

    let active = true;
    userManager.getUser()
      .then((loadedUser) => {
        // Do not overwrite a user established by the callback if this startup
        // restoration request began before callback processing completed.
        if (active && loadedUser) setUser(loadedUser);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to restore the sign-in session.');
      })
      .finally(() => { if (active) setIsLoading(false); });

    const onUserLoaded = (loadedUser: User) => setUser(loadedUser);
    const onUserUnloaded = () => setUser(null);
    const onAccessTokenExpired = () => {
      setUser(null);
      setError('Your sign-in session has expired. Please sign in again.');
    };
    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addAccessTokenExpired(onAccessTokenExpired);

    return () => {
      active = false;
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserUnloaded);
      userManager.events.removeAccessTokenExpired(onAccessTokenExpired);
    };
  }, []);

  const login = useCallback(async () => {
    if (!userManager) throw new Error('OIDC client is not configured. Set VITE_OIDC_CLIENT_ID in apps/shell/.env.');
    setError('');
    setIsLoggingOut(false);
    // A previous logout or failed callback can leave a stale local OIDC user.
    // Clear only the local user record before starting a fresh authorization
    // request; do not clear it in logout() before signoutRedirect, because the
    // IdP logout request may need the current ID token as id_token_hint.
    await userManager.removeUser();
    setUser(null);
    // The signed-out page is an intermediate page, not the destination after
    // a successful login. Always send the user to Dashboard when signing in
    // from /signed-out (or the root); preserve deep links for other routes.
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const returnTo = window.location.pathname === '/signed-out' || window.location.pathname === '/'
      ? '/dashboard'
      : currentPath;

    await userManager.signinRedirect({
      // Ask the IdP to show its login UI after logout rather than silently
      // reusing an existing SSO session.
      prompt: 'login',
      state: { returnTo },
    });
  }, []);

  const logout = useCallback(async () => {
    if (!userManager) return;
    // IMPORTANT: set this before signoutRedirect(). oidc-client-ts can emit
    // userUnloaded while preparing logout. Without this guard, AuthGate may
    // immediately start signinRedirect(), canceling the /session/end navigation.
    setIsLoggingOut(true);
    setError('');
    try {
      await userManager.signoutRedirect({
        post_logout_redirect_uri: `${window.location.origin}/signed-out`,
      });
    } catch (reason) {
      setIsLoggingOut(false);
      setError(reason instanceof Error ? reason.message : 'Unable to sign out.');
      throw reason;
    }
  }, []);

  const completeLogin = useCallback(async () => {
    if (!userManager) throw new Error('OIDC client is not configured. Set VITE_OIDC_CLIENT_ID in apps/shell/.env.');
    const authenticatedUser = await userManager.signinRedirectCallback();
    setUser(authenticatedUser);
    setError('');
    return authenticatedUser;
  }, []);

  const clearError = useCallback(() => setError(''), []);
  const value = useMemo<AuthContextValue>(() => ({
    isConfigured: Boolean(userManager),
    isLoading,
    user,
    isAuthenticated: Boolean(user && !user.expired),
    isLoggingOut,
    error,
    login,
    logout,
    completeLogin,
    clearError,
  }), [isLoading, user, error, isLoggingOut, login, logout, completeLogin, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

/** Use this helper when replacing a mock API with a secured backend call. */
export async function getCurrentAccessToken(): Promise<string | null> {
  if (!userManager) return null;
  const currentUser = await userManager.getUser();
  return currentUser && !currentUser.expired ? currentUser.access_token : null;
}
