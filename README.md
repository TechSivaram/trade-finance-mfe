# TradeFlow Microfrontend Demo

## Applications

- Shell — navigation and composition (`http://localhost:5000`)
- Dashboard MF — overview (`http://localhost:5001`)
- Trade MF — trade register (`http://localhost:5002`)
- Payment MF — payment register (`http://localhost:5003`)
- Analytics MF — analytics dashboard (`http://localhost:5004`)

## Run locally

From the project root:

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:5000`. The standalone Analytics MF preview is available at `http://localhost:5004/`.

Each MF has its own folder and package configuration. The Shell loads the remote applications at runtime. The sample data is illustrative and is not connected to backend services.

## Microfrontend event communication

The `@trade-finance/mf-contracts` workspace defines the browser event names and payload types shared by the Shell and Payment MF. On the Payments page, select a row's **Select** action. Payment MF emits `payment:selected` on `window`; the Shell listens and displays the selected payment context. Payment MF also emits `mf:ready` after its custom element is registered, and the Shell shows its connection status in the footer.

These are same-page browser events, not backend messaging. The selected-payment banner is demo UI state; production payment details and authorization must come from secured backend APIs.


## Mock payment details in Trade MF

1. Open **Payments** and select a payment.
2. The Shell stores the selection and automatically navigates to **Trade finance**.
3. Trade MF asks the Shell for the current selection using `payment:context-requested`.
4. The Shell replays `payment:selected`; Trade MF calls `getPaymentDetails(paymentId)` from `apps/trade-mf/src/api/mockPayments.ts`.
5. The mock service simulates a short network delay and returns payment details or a 404-like error.

This is an in-memory mock API service, not an HTTP server and not a real backend call. When a Spring Boot API is available, replace `getPaymentDetails` with a `fetch`/HTTP client call while keeping the Trade MF UI contract stable.

## OIDC authentication with TSCloak

The Shell is configured to use TSCloak as its OpenID Connect provider (`https://tscloak.onrender.com`) with the Authorization Code flow and PKCE. The registered client must allow the redirect URI `http://localhost:5000/auth/callback`, post-logout URI `http://localhost:5000/`, and web origin `http://localhost:5000`. The provider's discovery document advertises `S256` PKCE support and the standard authorization, token, JWKS, user-info, and logout endpoints.

### Register the browser client

Register a **public Single Page Application (SPA) / browser client** in TSCloak. If you do not have permission to create clients on this hosted IdP, ask its administrator to register one for you. Configure these exact local URLs:

- Client type: public/browser SPA (no client secret)
- Redirect/callback URI: `http://localhost:5000/auth/callback`
- Post-logout redirect URI: `http://localhost:5000/`
- Allowed web origin / CORS origin: `http://localhost:5000`
- Grant: Authorization Code; PKCE method `S256`
- Scopes requested: `openid profile email roles`

Do not use an implicit flow and do not put a client secret in frontend code. A client ID is not a secret, but it must match the client registered at TSCloak.

### Configure and run

1. Copy `apps/shell/.env.example` to `apps/shell/.env`.
2. Replace `YOUR_REGISTERED_CLIENT_ID` with the client ID returned by TSCloak:

   ```dotenv
   VITE_OIDC_CLIENT_ID=ffoTcza8BgPyqMUfSCGXcl-TeG3udApSFYsDrT8l3za
   ```

3. Restart the dev server after changing `.env`.
4. Run `npm install`, `npm run build`, then `npm run dev` from the project root.
5. Open `http://localhost:5000` and click **Continue with TSCloak**. After successful authentication, the Shell returns to the requested route.
6. Use **Sign out** in the sidebar to end the IdP session.

### What this bundle protects

- The Shell gates the application UI until the user is authenticated.
- The Shell displays the signed-in user's name/email from OIDC claims.
- OIDC state is stored in browser `sessionStorage`; no client secret is used.
- `getCurrentAccessToken()` in `apps/shell/src/auth/AuthContext.tsx` is a helper for attaching a valid access token to future API requests.
- The existing payment-selection event, automatic navigation, and mock payment details flow are preserved behind the sign-in gate.

**Important security boundary:** This protects the browser UI only. When a Spring Boot API is added, that API must independently validate access-token signature, issuer, audience, expiry, and required roles/permissions. Hiding a frontend route is not backend authorization. Role-based route restrictions are not enabled in this initial OIDC integration.

If login fails, check the registered client ID, callback/logout URLs, PKCE S256 support, allowed web origin/CORS settings, and the browser console. The app cannot complete a real sign-in until a valid client is registered and configured.


### OIDC logout

The Shell provides a **Sign out** action in the sidebar. It initiates the OIDC end-session redirect at TSCloak and returns to `http://localhost:5000/signed-out`. The signed-out page intentionally sits outside the authenticated route gate so it does not immediately start another login. Select **Sign in again** to begin a new OIDC authorization flow. Register `http://localhost:5000/signed-out` as an allowed post-logout redirect URI in TSCloak if the provider enforces redirect allowlists.

## Shell header and profile menu

- The top header remains sticky while the page content scrolls.
- The avatar at the top-right opens a menu with **Profile details** and **Sign out**.
- Profile claims are shown on `/profile`; they are no longer displayed as a card on the Dashboard.
- Sign out continues to use the existing OIDC logout flow.
