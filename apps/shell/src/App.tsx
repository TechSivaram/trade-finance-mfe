import { lazy, Suspense, useEffect, useState, createElement } from "react";
import type { ReactNode } from "react";
import { NavLink, Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
import { emitMfEvent } from "@trade-finance/mf-contracts";
import { useAuth } from "./auth/AuthContext";
import { AuthGate } from "./auth/AuthGate";
import { OidcCallback } from "./auth/OidcCallback";
import type { PaymentSelectedDetail } from "@trade-finance/mf-contracts";
const Dashboard = lazy(() => import("dashboard/DashboardApp"));
const Trade = lazy(() => import("trade/TradeApp"));

function PaymentsPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadScript = (src: string, id: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(
          id,
        ) as HTMLScriptElement | null;
        if (existing?.dataset.loaded === "true") {
          resolve();
          return;
        }
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error(`Could not load ${src}`)),
            { once: true },
          );
          return;
        }
        const script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.type = "module";
        script.crossOrigin = "anonymous";
        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };
        script.onerror = () =>
          reject(
            new Error(
              `Could not load ${src}. Is the Payments MF running on port 5003?`,
            ),
          );
        document.head.appendChild(script);
      });

    (async () => {
      try {
        await loadScript(
          "http://localhost:5003/polyfills.js",
          "payment-mf-polyfills",
        );
        await loadScript("http://localhost:5003/main.js", "payment-mf-main");
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unable to load Payments.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error)
    return (
      <div className="panel">
        <h2>Payments microfrontend unavailable</h2>
        <p>{error}</p>
        <p>
          Run <code>npm run dev</code> from the project root.
        </p>
      </div>
    );
  if (!ready) return <div className="panel">Loading Payments…</div>;
  return createElement("payment-app");
}

function AnalyticsPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const id = "analytics-mf-script";
    const src = "http://localhost:5004/trade-analytics.js";

    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      setReady(true);
      return () => {
        cancelled = true;
      };
    }

    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      script.dataset.loaded = "true";
      if (!cancelled) setReady(true);
    };
    const onError = () => {
      if (!cancelled)
        setError(
          `Could not load ${src}. Is the Trade Analytics app running on port 5004?`,
        );
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.id = id;
      script.src = src;
      script.type = "module";
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, []);

  if (error)
    return (
      <div className="panel">
        <h2>Trade Analytics microfrontend unavailable</h2>
        <p>{error}</p>
        <p>
          Run <code>npm run dev</code> from the project root.
        </p>
      </div>
    );
  if (!ready) return <div className="panel">Loading Trade Analytics…</div>;
  return createElement("trade-analytics");
}

function Remote({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="panel">Loading microfrontend…</div>}>
      {children}
    </Suspense>
  );
}
function AuthenticatedLayout() {
  const [selectedPayment, setSelectedPayment] = useState<PaymentSelectedDetail | null>(null);
  const auth = useAuth();
  const displayName = String(auth.user?.profile.name ?? auth.user?.profile.preferred_username ?? auth.user?.profile.email ?? "Authenticated user");
  const initials = displayName.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "U";
  const [paymentMfReady, setPaymentMfReady] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onPaymentSelected = (event: Event) => {
      const detail = (event as CustomEvent<PaymentSelectedDetail>).detail;
      if (!detail?.paymentId) return;
      setSelectedPayment(current => current?.paymentId === detail.paymentId ? current : detail);
      // Selecting a payment takes the user directly to Trade Finance, where
      // Trade MF requests the selection and loads the details from the mock API.
      if (!location.pathname.startsWith('/trades')) navigate('/trades');
    };
    const onPaymentContextRequested = () => {
      if (selectedPayment) emitMfEvent('payment:selected', selectedPayment);
    };
    const onMfReady = (event: Event) => {
      const detail = (event as CustomEvent<{ mf: string }>).detail;
      if (detail?.mf === 'payment') setPaymentMfReady(true);
    };
    window.addEventListener('payment:selected', onPaymentSelected);
    window.addEventListener('payment:context-requested', onPaymentContextRequested);
    window.addEventListener('mf:ready', onMfReady);
    return () => {
      window.removeEventListener('payment:selected', onPaymentSelected);
      window.removeEventListener('payment:context-requested', onPaymentContextRequested);
      window.removeEventListener('mf:ready', onMfReady);
    };
  }, [selectedPayment, location.pathname, navigate]);

  useEffect(() => {
    // When Trade MF is opened, replay the Shell's current selection so it can
    // fetch authoritative details (mocked for now) even if selection happened earlier.
    if (location.pathname.startsWith('/trades') && selectedPayment) {
      emitMfEvent('payment:selected', selectedPayment);
    }
  }, [location.pathname, selectedPayment]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">TF</span>
          <div>
            <strong>TradeFlow</strong>
            <small>Finance platform</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          <NavLink to="/dashboard">
            ▦ <span>Overview</span>
          </NavLink>
          <NavLink to="/trades">
            ⇄ <span>Trade finance</span>
          </NavLink>
          <NavLink to="/payments">
            ↗ <span>Payments</span>
          </NavLink>
          <NavLink to="/analytics">
            ▥ <span>Trade analytics</span>
          </NavLink>
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">TRADE FINANCE PLATFORM</span>
            <h1>Operations workspace</h1>
          </div>
          <div className="top-actions">
            <span className="status-dot"></span>
            <span className="system-status">All systems operational</span>
            <div className="profile-menu-wrap">
              <button className="top-avatar profile-menu-trigger" type="button" aria-label="Open profile menu" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen(open => !open)}>{initials}</button>
              {profileMenuOpen && <>
                <button className="menu-dismiss" aria-label="Close profile menu" type="button" onClick={() => setProfileMenuOpen(false)} />
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-user"><strong>{displayName}</strong><small>{String(auth.user?.profile.email ?? "Signed in with TSCloak")}</small></div>
                  <NavLink role="menuitem" to="/profile" onClick={() => setProfileMenuOpen(false)}>Profile details</NavLink>
                  <button role="menuitem" type="button" onClick={() => { setProfileMenuOpen(false); auth.logout().catch((e: unknown) => alert(e instanceof Error ? e.message : "Unable to sign out.")); }}>Sign out</button>
                </div>
              </>}
            </div>
          </div>
        </header>
        {selectedPayment && (
          <section className="selection-context" aria-live="polite">
            <div>
              <strong>Payment selected: {selectedPayment.paymentId}</strong>
              <span>{selectedPayment.beneficiary} · {selectedPayment.amount} · {selectedPayment.status}</span>
            </div>
            <button type="button" onClick={() => setSelectedPayment(null)} aria-label="Clear selected payment">Clear</button>
          </section>
        )}

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Remote>
                <Dashboard />
              </Remote>
            }
          />
          <Route
            path="/trades/*"
            element={
              <Remote>
                <Trade />
              </Remote>
            }
          />
          <Route path="/profile" element={<section className="content profile-page">
            <div className="page-heading"><div><h2>Profile details</h2><p className="muted">Your authenticated identity information from TSCloak.</p></div></div>
            <div className="profile-detail-card">
              <div className="profile-detail-heading"><span className="profile-large-avatar">{initials}</span><div><h3>{displayName}</h3><p>{String(auth.user?.profile.email ?? "Email not provided")}</p></div></div>
              <dl className="profile-details-grid">
                <div><dt>Full name</dt><dd>{String(auth.user?.profile.name ?? auth.user?.profile.given_name ?? "Not provided")}</dd></div>
                <div><dt>Username</dt><dd>{String(auth.user?.profile.preferred_username ?? auth.user?.profile.nickname ?? "Not provided")}</dd></div>
                <div><dt>Email</dt><dd>{String(auth.user?.profile.email ?? "Not provided")}</dd></div>
                <div><dt>Email verified</dt><dd>{auth.user?.profile.email_verified === true ? "Yes" : auth.user?.profile.email_verified === false ? "No" : "Not provided"}</dd></div>
                <div><dt>Identity provider</dt><dd>TSCloak</dd></div>
                <div><dt>Subject ID</dt><dd>{String(auth.user?.profile.sub ?? "Not provided")}</dd></div>
              </dl>
            </div>
          </section>} />
          <Route path="/payments/*" element={<PaymentsPage />} />
          <Route path="/analytics/*" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <footer>
          TradeFlow demo <span>•</span> Shell composes independently built
          microfrontends <span>•</span> Payment MF {paymentMfReady ? 'connected' : 'not connected yet'}
        </footer>
      </main>
    </div>
  );
}


function SignedOutPage() {
  const auth = useAuth();
  const [error, setError] = useState("");

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f7fb", fontFamily: "'DM Sans', sans-serif", color: "#17233b" }}>
      <section style={{ width: "min(100%, 440px)", padding: 32, border: "1px solid #e4e9f3", borderRadius: 18, background: "#fff", boxShadow: "0 18px 55px #1b315012" }}>
        <div style={{ color: "#526ce0", fontWeight: 800, letterSpacing: 1 }}>TRADEFLOW · FINANCE PLATFORM</div>
        <h1>You've signed out</h1>
        <p>Your TradeFlow session has ended.</p>
        {error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}
        <button className="primary-btn" type="button" onClick={() => auth.login().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to start sign-in."))}>
          Sign in again
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  if (location.pathname === "/auth/callback") return <OidcCallback />;
  // Do not let AuthGate immediately start a new login after logout.
  if (location.pathname === "/signed-out") return <SignedOutPage />;
  return <AuthGate><AuthenticatedLayout /></AuthGate>;
}
