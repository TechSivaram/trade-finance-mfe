<div align="center">

# ✨ TradeFlow — Trade Finance Workspace

**A multi-framework microfrontend demo with OIDC authentication, event-driven UI coordination, and a mock payment-details service.**

![Architecture](https://img.shields.io/badge/architecture-microfrontends-5965f2?style=for-the-badge)
![Auth](https://img.shields.io/badge/auth-OIDC%20%2B%20PKCE-16856b?style=for-the-badge)
![Status](https://img.shields.io/badge/backend-mocked-f0a23a?style=for-the-badge)
![License](https://img.shields.io/badge/license-demo-lightgrey?style=for-the-badge)

*Explore the workspace, select a payment, jump to its trade details, and sign in through TSCloak.*

</div>

---

## 🧭 Contents

- [Overview](#-overview)
- [Architecture at a glance](#-architecture-at-a-glance)
- [Applications and ports](#-applications-and-ports)
- [Quick start](#-quick-start)
- [Authentication with TSCloak](#-authentication-with-tscloak)
- [Logout and sign-in lifecycle](#-logout-and-sign-in-lifecycle)
- [Microfrontend communication](#-microfrontend-communication)
- [Payment-selection journey](#-payment-selection-journey)
- [Repository layout](#-repository-layout)
- [Security boundaries and current limitations](#-security-boundaries-and-current-limitations)
- [Troubleshooting](#-troubleshooting)

## 🎯 Overview

TradeFlow is a learning/demo application for exploring a **Shell + independently built microfrontends** approach for a Trade Finance workspace. The Shell owns top-level navigation, authentication gating, the sticky header, and the profile menu. Feature MFs own their screens. Shared browser-event contracts keep cross-MF communication explicit.

> [!IMPORTANT]
> This is a frontend demo. The data is illustrative, and the payment-details service is an in-memory mock—not a deployed HTTP API or a Spring Boot backend.

## 🏗️ Architecture at a glance

```mermaid
flowchart TB
    U([User / Browser]) --> IDP[TSCloak Identity Provider]
    U --> S[Shell · React · :5000]
    IDP <-->|OIDC Authorization Code + PKCE| S

    S --> D[Dashboard MF · :5001]
    S --> T[Trade MF · :5002]
    S --> P[Payment MF · :5003]
    S --> A[Analytics MF · :5004]

    C[Shared MF Contracts] -. event names + payload types .-> S
    C -.-> P
    C -.-> T
    P -- "payment:selected" --> W((Browser window events))
    W --> S
    S -- "payment:context-requested / payment:selected" --> W
    W --> T
    T --> M[Mock payment details service]

    classDef shell fill:#e8edff,stroke:#5865f2,color:#172554,stroke-width:2px;
    classDef mf fill:#e7f8f1,stroke:#16856b,color:#064e3b;
    classDef identity fill:#fff2df,stroke:#d97706,color:#78350f;
    class S shell;
    class D,T,P,A mf;
    class IDP identity;
```

### Design principles

- **Shell owns composition:** navigation, route protection, header, and profile menu live in one place.
- **Feature ownership stays local:** each MF owns its feature UI and can be built separately.
- **Contracts over imports:** browser events provide a small, explicit communication surface.
- **Identity is centralized:** the Shell uses OIDC; feature modules are shown behind the authenticated workspace.
- **Backend is a future boundary:** business data and authorization must move to secured APIs for production.

## 🧩 Applications and ports

| Application | Local URL | Responsibility |
|---|---|---|
| **Shell** | `http://localhost:5000` | App composition, navigation, OIDC, sticky header, profile menu |
| Dashboard MF | `http://localhost:5001` | Overview cards and recent trade activity |
| Trade MF | `http://localhost:5002` | Trade register and selected-payment details |
| Payment MF | `http://localhost:5003` | Payment list and payment selection |
| Analytics MF | `http://localhost:5004` | Trade analytics view |
| Shared contracts | workspace package | Event names, payload types, event helper |

The Shell loads feature modules at runtime. The root `dev` command builds the feature bundles first and then starts the Shell and MF preview servers together.

## 🚀 Quick start

### Prerequisites

- Node.js and npm (use a current LTS release)
- A TSCloak client configured for local development
- Network access to `https://tscloak.onrender.com` for login/logout

### Run the workspace

From the repository root:

```bash
npm install
npm run build
npm run dev
```

Open **<http://localhost:5000>**. The Shell redirects unauthenticated users to TSCloak. Once authenticated, you can navigate between Overview, Trade finance, Payments, and Trade analytics.

> 💡 `npm run dev` builds the remote MFs before starting their preview servers. If you change an MF and it does not appear to update, rebuild/restart the workspace.

## 🔐 Authentication with TSCloak

The Shell is a browser-based OIDC client using **Authorization Code Flow with PKCE (`S256`)**. The requested working scopes are `openid profile email`.

### OIDC sequence

```mermaid
sequenceDiagram
    actor User
    participant Shell as Shell (:5000)
    participant IdP as TSCloak
    User->>Shell: Open a protected route
    Shell->>Shell: Check local OIDC state
    alt Not authenticated
        Shell->>IdP: Authorization request + PKCE challenge
        IdP-->>User: Sign-in UI
        User->>IdP: Authenticate
        IdP-->>Shell: Redirect with authorization code + state
        Shell->>IdP: Exchange code + PKCE verifier
        IdP-->>Shell: Tokens / claims
    else Session already available
        Shell->>Shell: Restore authenticated state
    end
    Shell-->>User: Render requested workspace route
```

### Register/configure the public SPA client

In TSCloak, the browser client must be registered as a **public SPA**. Do not embed a client secret in frontend code.

| Setting | Value |
|---|---|
| Issuer / provider | `https://tscloak.onrender.com` |
| Client type | Public browser SPA |
| Redirect URI | `http://localhost:5000/auth/callback` |
| Post-logout URI | `http://localhost:5000/signed-out` |
| Allowed web origin | `http://localhost:5000` |
| Flow | Authorization Code + PKCE (`S256`) |
| Working scopes | `openid profile email` |

> **Scope note:** The `roles` scope previously returned `invalid_scope` from this IdP, so the app should continue using the working standard scopes until TSCloak's role-scope assignment is corrected. Roles may be exposed as claims separately, depending on the IdP configuration.

### Client configuration

1. Copy `apps/shell/.env.example` to `apps/shell/.env` if needed.
2. Set the client ID issued for the registered TSCloak application:

   ```dotenv
   VITE_OIDC_CLIENT_ID=your-registered-client-id
   ```

3. Restart the dev server after editing `.env`.

A client ID is public configuration, but it must match the IdP registration. Never place a client secret, password, access token, or ID token in `.env`, source control, or screenshots.

## 🚪 Logout and sign-in lifecycle

```mermaid
flowchart TD
    A[Authenticated workspace] --> B[Profile menu → Sign out]
    B --> C[Set logout-in-progress flag]
    C --> D[Single redirect to TSCloak end-session endpoint]
    D --> E[IdP invalidates its session / expires its cookie]
    E --> F[Redirect to /signed-out]
    F --> G{User clicks Sign in again?}
    G -- No --> H[Remain on signed-out page]
    G -- Yes --> I[Start fresh OIDC authorization]
    I --> J[OIDC callback]
    J --> K[Dashboard / requested protected route]
```

- The profile menu in the sticky top header offers **Profile details** and **Sign out**.
- `/profile` displays the available signed-in user claims; the Dashboard itself does not host a profile card.
- `/signed-out` is a public route and should not automatically initiate a new login.
- Logout must be one uninterrupted navigation. TSCloak—not the `localhost` application—owns and must expire its own `_session` cookie.
- The post-logout redirect URI must be allowed by the IdP. If the IdP cookie remains, inspect the `/session/end` response and `Set-Cookie` header in DevTools; the frontend cannot delete a cookie owned by another origin.

## 🔁 Microfrontend communication

The `@trade-finance/mf-contracts` workspace package defines shared event names and payload types. Events are dispatched on the browser `window` object, so this pattern applies to MFEs loaded in the **same browser page**.

### Event map

| Event | Publisher / consumer | Purpose in this demo |
|---|---|---|
| `payment:selected` | Payment MF → Shell; Shell can replay to Trade MF | Announces the selected payment summary/ID |
| `payment:context-requested` | Trade MF → Shell | Trade MF asks for the current selection after it mounts |
| `mf:ready` | Feature MF → Shell (where emitted) | Reports that a module is ready/registered |
| `mf:error` | Shared contract | Contract for module error reporting; handling may need extending |
| `mf:navigate` | Shared contract / Shell listener | Contract for navigation requests; producers may need adding where required |

### Event sequence

```mermaid
sequenceDiagram
    participant User
    participant Payment as Payment MF
    participant Window as Browser window
    participant Shell
    participant Trade as Trade MF
    participant Mock as Mock payment service

    User->>Payment: Select a payment
    Payment->>Window: payment:selected { paymentId, summary }
    Window-->>Shell: Event listener receives selection
    Shell->>Shell: Save selected payment
    Shell->>Shell: Navigate to Trade finance
    Trade->>Window: payment:context-requested
    Window-->>Shell: Request received
    Shell->>Window: Replay payment:selected
    Window-->>Trade: Selection context received
    Trade->>Mock: getPaymentDetails(paymentId)
    Mock-->>Trade: Details or not-found error
    Trade-->>User: Render selected-payment details
```

**Important:** browser events are not a message broker and do not persist messages. The Shell keeps demo selection state in memory and replays it when Trade MF requests the context. This is suitable for a learning demo; production data must be retrieved from an API.

## 💳 Payment-selection journey

1. Open **Payments** and select a payment row.
2. Payment MF emits `payment:selected`.
3. The Shell stores the selection and navigates automatically to **Trade finance**.
4. Trade MF requests the current selection after mounting.
5. The Shell replays the selection event.
6. Trade MF calls `getPaymentDetails(paymentId)` in `apps/trade-mf/src/api/mockPayments.ts`.
7. The mock service simulates latency and returns sample details or a not-found error.

This function is an in-memory TypeScript service, **not** a real HTTP endpoint. When a Spring Boot API is available, replace it with a `fetch`/HTTP client call while keeping the feature UI and event contract stable.

## 📁 Repository layout

```text
trade-finance-mfe/
├── apps/
│   ├── shell/          # Composition, routes, OIDC, header and profile menu
│   ├── dashboard-mf/   # Overview dashboard
│   ├── trade-mf/       # Trade register and mock payment-details call
│   ├── payment-mf/     # Payment list and selection event
│   └── analytics-mf/   # Analytics module
├── packages/
│   └── mf-contracts/   # Shared browser-event contracts
├── package.json        # npm workspaces + root scripts
└── README.md
```

## 🛡️ Security boundaries and current limitations

- OIDC protects the Shell's browser UI; it does **not** secure a future backend automatically.
- A Spring Boot API must independently validate access-token signature, issuer, audience, expiry, and required permissions/roles.
- Frontend route hiding is not authorization enforcement.
- The current payment data is mock/in-memory data and must not be used for real financial operations.
- Role-based route restrictions are not enabled in this initial integration.
- Browser events work only within the same page context and are not suitable for server-to-server communication.
- The OIDC/logout behavior depends on TSCloak's client configuration and supported end-session behavior; verify cookie expiration in the browser during testing.

## 🧰 Troubleshooting

| Symptom | What to check |
|---|---|
| Login returns `invalid_scope` | Use `openid profile email`; verify additional scopes are assigned/allowed by TSCloak before requesting them. |
| Login loops or callback reports state mismatch | Start a fresh login from the app; keep the origin exactly `http://localhost:5000`; inspect the callback and browser console. |
| Logout request is canceled | Inspect Network → `/session/end` → Initiator. Ensure the Shell does not launch a new login while logout is in progress. |
| TSCloak `_session` cookie remains | Inspect `/session/end` response and `Set-Cookie`; only TSCloak can expire its own cookie. |
| Trade MF has no selected payment | Select a payment first; check the `payment:selected` and `payment:context-requested` events in DevTools. |
| A remote MF is blank or stale | Check its preview port, build output, browser console, and whether the root `dev` command completed the remote build. |
| `.env` change has no effect | Restart the dev server and verify `VITE_OIDC_CLIENT_ID` matches the registered client. |

---

<div align="center">

**TradeFlow · Learning through architecture**

*Microfrontends · OIDC · Browser events · Mock API boundary*

</div>
