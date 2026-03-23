# Kiln — Pending Deployment Steps

## 1. Resend API Key (email sending)

1. Sign in at [resend.com](https://resend.com)
2. Domains → Add Domain → `usekiln.org` → add the DNS records in Cloudflare (DKIM, SPF)
3. Once verified: API Keys → Create API Key → copy it
4. Set the secret:
   ```
   supabase secrets set RESEND_API_KEY=re_xxxxx
   ```

## 2. Deploy edge functions

```
supabase functions deploy notify-feedback
supabase functions deploy send-welcome-email
supabase functions deploy demo-turn
supabase functions deploy lti-launch
supabase functions deploy lti-grade
```

## 3. Database webhooks (Supabase Dashboard)

### Feedback notification
- Database → Webhooks → Create
- Name: `notify-feedback`
- Table: `feedback`
- Events: INSERT
- Type: Supabase Edge Functions
- Function: `notify-feedback`

### Welcome email
- Database → Webhooks → Create
- Name: `send-welcome-email`
- Table: `auth.users`
- Events: INSERT
- Type: Supabase Edge Functions
- Function: `send-welcome-email`

## 4. Cloudflare Email Routing

- `feedback@usekiln.org` → `charles.crabtree@monash.edu`
- `welcome@usekiln.org` → Resend sending domain verification

## 5. LTI secrets (if Canvas integration needed)

```
supabase secrets set LTI_PLATFORM_ISSUER=...
supabase secrets set LTI_PLATFORM_JWKS_URL=...
supabase secrets set LTI_CLIENT_ID=...
supabase secrets set LTI_OIDC_AUTH_URL=...
supabase secrets set LTI_PLATFORM_TOKEN_URL=...
supabase secrets set LTI_CLIENT_SECRET=...
supabase secrets set KILN_BASE_URL=https://usekiln.org
```

## 6. Plausible analytics

- Sign up at [plausible.io](https://plausible.io)
- Verify domain: `usekiln.org`

## 7. iOS / Android

- Xcode: select signing team, enable Push Notifications capability
- Apple Developer: create APNs key
- App Store Connect: create listing, screenshots, privacy URL
- Archive + submit via Xcode
