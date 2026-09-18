# Premium backend preparation

This folder is preparation only. It is not deployed by the MSA One APK workflow.

Before Premium activation, implement authenticated application-user sessions and obtain Google Play Developer API credentials on the server. Never embed a Google service-account key or privileged access token in the APK.

`google-play.mjs` contains server-side helpers for:
- Purchases.subscriptionsv2.get verification
- active / grace-period entitlement mapping
- subscription acknowledgement
- returning capability-based entitlement data

Recommended endpoint contract:

- `GET /entitlement` → authenticated current-user entitlement
- `POST /billing/google/verify` → authenticated user + purchaseToken → server verification → entitlement
- `POST /billing/google/notifications` → Real-time Developer Notifications handler
- `POST /billing/restore` → authenticated user purchase reconciliation

Do not grant Premium for PENDING purchases. The app should only accept a backend response with `verified:true`.

The normal Build 47 workflow does not run or deploy this backend.
