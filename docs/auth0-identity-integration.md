# Auth0 as an optional cloud identity layer

## Summary

Auth0 is added as an **optional** cloud identity/profile login that sits next to the
existing local wallet unlock. It is a backend-identity concern, not a wallet concern.

**The local vault unlock is untouched.** `AuthenticationService`
(`app/core/Authentication/Authentication.ts`) still decrypts the local vault with the
user's password through `KeyringController.submitPassword()`, and still stores that
password in the device keychain through `SecureKeychain`. Auth0 never sees, derives,
wraps or replaces that password, and no Auth0 token can unlock the vault. A user who
never signs in to Auth0 keeps exactly today's behaviour; a user who signs out of Auth0
keeps full access to their wallet.

## Layering

```
 local, self-custodial                  cloud identity (optional)
 ---------------------                  -------------------------
 password ─► KeyringController          Auth0 Universal Login
            .submitPassword()            │
            (vault decryption)           ▼
                                        access / id / refresh tokens
 AuthenticationService                  Auth0Service
 SecureKeychain (service com.metamask)  SecureKeychain (service com.metamask.auth0)
                                         │
                                         ▼
                                        backend identity layer
                                        (AuthenticationController, profile-sync)
```

The two columns share only the `SecureKeychain` helper, and they use **separate keychain
services**, so Auth0 credentials can never overwrite or be mistaken for the vault
password.

## Obtaining tokens on mobile

`react-native-auth0` (v4) is used because it drives the platform's system browser
(`ASWebAuthenticationSession` on iOS, Custom Tabs on Android) rather than an embedded
WebView, which is required by Auth0 and by the app stores for OAuth flows.

```ts
const credentials = await auth0.webAuth.authorize(
  { scope: 'openid profile email offline_access', audience },
  { customScheme: 'metamaskauth0' },
);
```

* **Login** — `webAuth.authorize()` performs Authorization Code + PKCE and returns
  `accessToken`, `idToken`, optional `refreshToken`, and `expiresAt`.
* **Refresh** — `auth.refreshToken({ refreshToken })`, triggered lazily by
  `Auth0Service.getSession()` when the stored access token is within 60s of expiry.
  Requires the `offline_access` scope and refresh tokens enabled on the Auth0 app.
* **Logout** — `webAuth.clearSession()` plus deletion of the stored credentials.

Configuration comes from build-time environment variables, inlined by
`transform-inline-environment-variables` exactly like the other `MM_*` variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MM_AUTH0_DOMAIN` | yes | Auth0 tenant domain |
| `MM_AUTH0_CLIENT_ID` | yes | Native application client id |
| `MM_AUTH0_AUDIENCE` | no | API audience for access tokens |
| `MM_AUTH0_SCOPE` | no | Overrides the default scope |

If either required variable is empty the feature is inert: `Auth0Service.isEnabled()`
returns `false`, no Auth0 client is constructed, and every call is a no-op. This is what
makes the layer optional.

## Token storage

Tokens are stored through `SecureKeychain`, using a dedicated keychain service
(`com.metamask.auth0`) and the same extra encryption layer that protects the vault
password before it reaches the OS keychain:

* `SecureKeychain.setAuth0Credentials(credentials)`
* `SecureKeychain.getAuth0Credentials()`
* `SecureKeychain.resetAuth0Credentials()`

Items are written with `ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY` and no biometric
access control: an Auth0 token is a bearer credential for cloud services, so gating it
behind biometrics would only add a prompt without adding custody guarantees. The vault
password entry (service `com.metamask`, with its biometric/passcode access control) is
written and read by the same code paths as before.

## Backend identity integration

The app already has a backend identity layer: `AuthenticationController` from
`@metamask/profile-sync-controller`, created in `app/core/Engine/Engine.ts` via
`createAuthenticationController`. It authenticates with a SIWE/SRP-derived key pair and
hands out a bearer token via `getBearerToken()` for profile sync, notifications and
other backend services.

Auth0 is wired in at that same layer and nowhere else. `getIdentityBearerToken()` in
`app/actions/identity/index.ts` returns the Auth0 access token when an Auth0 session
exists, and otherwise falls back to `AuthenticationController.getBearerToken()`. That
keeps `AuthenticationController` unmodified, keeps its SRP-based identity working for
existing users, and gives backend callers one place to obtain a bearer token.

Not done here, deliberately: replacing the profile-sync identity with Auth0, or making
any wallet operation depend on an Auth0 session.

## Native configuration

**iOS** — `ios/MetaMask/Info.plist` registers the `metamaskauth0` URL scheme alongside
the existing `metamask`/`wc`/`ethereum` schemes. `pod install` must be run once so that
the `react-native-auth0` pod is linked (`ios/Podfile.lock` is regenerated on a macOS
machine; it is not checked in from this change).

**Android** — `android/app/build.gradle` sets the `auth0Domain` and `auth0Scheme`
manifest placeholders that the library's `RedirectActivity` consumes, so no manual
`AndroidManifest.xml` intent filter is needed. `auth0Scheme` is the fixed
`metamaskauth0` string rather than the application id, because the `qa` and `flask`
flavours apply an `applicationIdSuffix` and would otherwise each need their own Auth0
callback URL.

Callback / logout URLs to register in the Auth0 application:

```
ios:     metamaskauth0://$MM_AUTH0_DOMAIN/ios/io.metamask/callback
android: metamaskauth0://$MM_AUTH0_DOMAIN/android/io.metamask/callback
```

(plus the `io.metamask.qa` and `io.metamask.flask` variants for those flavours).

## Testing

`app/core/Authentication/Auth0Service.test.ts` mocks `react-native-auth0` and
`SecureKeychain` and covers the disabled-by-default case, login, session reuse, lazy
refresh, refresh failure, and logout. The existing `Authentication.test.ts` suite is
unchanged and still exercises the vault-unlock paths.
