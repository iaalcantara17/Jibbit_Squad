# Manual Setup Required

This document lists every item that MUST be configured manually by a person to make Sprint 3 fully functional. Each integration requires external account setup that cannot be automated.

---

## 1. Google OAuth (Social Login)

### Why Manual
Google requires you to create an OAuth 2.0 Client ID in Google Cloud Console with specific redirect URIs. This cannot be automated as it requires your Google account credentials and project ownership.

### Where to Do It
**Google Cloud Console → APIs & Services → Credentials**
URL: https://console.cloud.google.com/apis/credentials

### Exact Steps
1. Navigate to Google Cloud Console
2. Select or create a project
3. Click "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth Client ID"
5. Configure consent screen first if prompted:
   - User Type: External (for testing) or Internal (for org only)
   - Add app name, user support email, developer contact
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
6. Choose "Web application" as application type
7. Add Authorized JavaScript origins:
   ```
   http://localhost:8080
   https://fzckeizrrolxgakekzhe.supabase.co
   https://jibbit.app
   ```
8. Add Authorized redirect URIs:
   ```
   http://localhost:8080/auth/callback
   https://fzckeizrrolxgakekzhe.supabase.co/auth/v1/callback
   https://jibbit.app/auth/callback
   ```
9. Click "Create"
10. Copy the Client ID and Client Secret

### Values to Copy
- **Client ID**: Looks like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret**: Looks like `GOCSPX-abc123xyz`

### Where to Paste
**Lovable Cloud Dashboard → Users → Auth Settings → Google Settings**
- Enable Google provider
- Paste Client ID in "Client ID" field
- Paste Client Secret in "Client Secret" field
- Add Site URL: `https://jibbit.app`
- Add Redirect URLs:
  - `http://localhost:8080/auth/callback`
  - `https://jibbit.app/auth/callback`

Alternatively, if using Supabase directly (not via Lovable Cloud):
- Go to Supabase Dashboard → Authentication → Providers → Google
- Enable and configure there

### How to Verify
1. Go to `/login` page in your app
2. Click "Sign in with Google" button
3. Should redirect to Google consent screen
4. After approval, should redirect back to app
5. User should be logged in (check `/profile` page or auth state)
6. Check Network tab: callback request should return 302 redirect, not 500

### Common Failure Modes
1. **"Unable to exchange external code"**
   - **Cause**: Redirect URI mismatch or wrong client secret
   - **Fix**: Ensure redirect URIs match exactly (including protocol, port, path)
   
2. **"redirect_uri_mismatch"**
   - **Cause**: The redirect_uri sent doesn't match any registered URI
   - **Fix**: Double-check all redirect URIs are added in Google Console
   
3. **CORS errors**
   - **Cause**: Missing JavaScript origins
   - **Fix**: Add your domain to Authorized JavaScript origins

### Security Notes
- **Never commit** client secrets to git
- Secrets are stored in Supabase/Lovable Cloud secrets manager
- Rotate secrets if accidentally exposed
- Use different OAuth apps for dev/staging/production

---

## 2. LinkedIn OAuth (Social Login)

### Why Manual
LinkedIn requires OAuth app registration in LinkedIn Developer Portal. The app must be approved by LinkedIn and cannot be created programmatically.

### Where to Do It
**LinkedIn Developer Portal → My Apps**
URL: https://www.linkedin.com/developers/apps

### Exact Steps
1. Go to LinkedIn Developer Portal
2. Click "Create app"
3. Fill in app details:
   - App name: Your app name
   - LinkedIn Page: Select or create a company page
   - App logo: Upload a logo (required)
4. In the "Auth" tab, add Redirect URLs:
   ```
   http://localhost:8080/auth/callback
   https://fzckeizrrolxgakekzhe.supabase.co/auth/v1/callback
   https://jibbit.app/auth/callback
   ```
5. Request access to "Sign In with LinkedIn using OpenID Connect" product
6. Wait for LinkedIn approval (can take 1-3 days)
7. Once approved, go to "Auth" tab
8. Copy Client ID and Client Secret

### Values to Copy
- **Client ID**: Looks like `86abc12345xyz`
- **Client Secret**: Looks like `AbC123XyZ456`

### Where to Paste
**Lovable Cloud Dashboard → Users → Auth Settings → LinkedIn Settings**
- Enable LinkedIn OIDC provider
- Paste Client ID in "Client ID" field
- Paste Client Secret in "Client Secret" field

### How to Verify
1. Go to `/login` page
2. Click "Sign in with LinkedIn" button
3. Should redirect to LinkedIn authorization page
4. After approval, should redirect back to app
5. User should be logged in
6. Profile should populate with LinkedIn data

### Common Failure Modes
1. **"Provider not configured"**
   - **Cause**: LinkedIn app not approved yet or credentials not set
   - **Fix**: Wait for LinkedIn approval, then configure credentials
   
2. **"invalid_redirect_uri"**
   - **Cause**: Redirect URI not added to LinkedIn app
   - **Fix**: Add exact redirect URI in LinkedIn Developer Portal
   
3. **Blank screen after LinkedIn login**
   - **Cause**: Using legacy `linkedin` provider instead of `linkedin_oidc`
   - **Fix**: Code already uses `linkedin_oidc` - ensure Lovable Cloud provider is set to "LinkedIn (OIDC)"

### Security Notes
- Store Client Secret only in Lovable Cloud secrets
- Never log Client Secret or access tokens
- LinkedIn credentials are production-ready only after app approval

---

## 3. Google Calendar Integration

### Why Manual
Requires OAuth app with Calendar API access. Must be configured in Google Cloud Console with specific scopes.

### Where to Do It
**Google Cloud Console → APIs & Services**
URL: https://console.cloud.google.com/apis/library

### Exact Steps
1. Enable Google Calendar API:
   - Go to APIs & Services → Library
   - Search "Google Calendar API"
   - Click "Enable"
2. Create OAuth 2.0 credentials (or use existing from Google OAuth setup):
   - Go to Credentials
   - Use existing Web Client or create new
   - Add redirect URI: `https://fzckeizrrolxgakekzhe.supabase.co/functions/v1/calendar-oauth-callback`
3. Configure consent screen scopes:
   - Add `https://www.googleapis.com/auth/calendar`
   - Add `https://www.googleapis.com/auth/calendar.events`
4. Copy Client ID and Client Secret

### Values to Copy
- **Client ID**: Can reuse Google OAuth Client ID or create separate
- **Client Secret**: Can reuse Google OAuth Client Secret or create separate
- **Redirect URI**: `https://fzckeizrrolxgakekzhe.supabase.co/functions/v1/calendar-oauth-callback`

### Where to Paste
Secrets are already configured in Lovable Cloud:
- `GOOGLE_CALENDAR_CLIENT_ID` (already set)
- `GOOGLE_CALENDAR_CLIENT_SECRET` (already set)

If you need to update them:
1. Go to Lovable Cloud Dashboard → Settings → Secrets
2. Update `GOOGLE_CALENDAR_CLIENT_ID` value
3. Update `GOOGLE_CALENDAR_CLIENT_SECRET` value

### How to Verify
1. Go to app → Integrations Settings
2. Click "Connect Google Calendar"
3. Should redirect to Google consent screen
4. Grant calendar permissions
5. Should redirect back and show "Connected" status
6. Create a job with a deadline
7. Check your Google Calendar - event should appear

### Common Failure Modes
1. **"insufficient permissions"**
   - **Cause**: Calendar API not enabled or wrong scopes
   - **Fix**: Enable Calendar API and add required scopes to consent screen
   
2. **"redirect_uri_mismatch"**
   - **Cause**: Redirect URI not matching edge function URL
   - **Fix**: Add exact edge function callback URL to OAuth app
   
3. **Calendar events not syncing**
   - **Cause**: Edge function `calendar-sync` not deployed or secrets missing
   - **Fix**: Edge functions auto-deploy; verify secrets are set

### Security Notes
- Calendar access tokens are stored encrypted in `calendar_integrations` table
- Refresh tokens allow long-term access - treat as sensitive
- Users can revoke access via Google Account settings

---

## 4. Email Integration (Gmail OAuth)

### Why Manual
Requires OAuth app with Gmail API access for reading/sending emails.

### Where to Do It
**Google Cloud Console → APIs & Services**
URL: https://console.cloud.google.com/apis/library

### Exact Steps
1. Enable Gmail API:
   - Go to APIs & Services → Library
   - Search "Gmail API"
   - Click "Enable"
2. Add Gmail scopes to consent screen:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
3. Add redirect URI to OAuth client:
   - `https://fzckeizrrolxgakekzhe.supabase.co/functions/v1/email-oauth-callback`
4. Use same Client ID and Secret from Google OAuth setup

### Values to Copy
- **Client ID**: Same as Google OAuth
- **Client Secret**: Same as Google OAuth
- **Redirect URI**: `https://fzckeizrrolxgakekzhe.supabase.co/functions/v1/email-oauth-callback`

### Where to Paste
Secrets already configured in Lovable Cloud:
- `GOOGLE_CLIENT_ID` (already set)
- `GOOGLE_CLIENT_SECRET` (already set)

### How to Verify
1. Go to app → Email Integration page
2. Click "Connect Gmail"
3. Grant Gmail permissions
4. Should show "Connected" status
5. Email tracking should start working
6. Check Email Monitor page for tracked emails

### Common Failure Modes
1. **"access_denied"**
   - **Cause**: User declined Gmail permissions
   - **Fix**: Retry and accept all permissions
   
2. **"invalid_scope"**
   - **Cause**: Gmail scopes not added to consent screen
   - **Fix**: Add all required Gmail scopes
   
3. **Email poller not running**
   - **Cause**: Edge function not scheduled
   - **Fix**: Email poller runs automatically; check edge function logs

### Security Notes
- Gmail tokens stored encrypted in `email_integrations` table
- Never log email content or access tokens
- Users should use app-specific passwords for added security

---

## 5. Resend API (Email Notifications)

### Why Manual
Requires Resend account and API key. Cannot create Resend accounts programmatically.

### Where to Do It
**Resend Dashboard → API Keys**
URL: https://resend.com/api-keys

### Exact Steps
1. Sign up for Resend account at https://resend.com
2. Verify your sending domain (or use Resend test domain for dev)
3. Go to API Keys
4. Click "Create API Key"
5. Name it (e.g., "JibbitATS Production")
6. Copy the API key (starts with `re_`)
7. Add your sending domain:
   - Go to Domains
   - Add domain
   - Add DNS records (SPF, DKIM, DMARC)
   - Verify domain

### Values to Copy
- **API Key**: Starts with `re_`, looks like `re_123abc456def`
- **From Email**: Your verified email, e.g., `noreply@jibbit.app`

### Where to Paste
Secret already configured in Lovable Cloud:
- `RESEND_API_KEY` (already set)

If you need to update:
1. Go to Lovable Cloud Dashboard → Settings → Secrets
2. Update `RESEND_API_KEY` value

Also set in frontend (public, non-secret):
- Add to `.env` file: `VITE_RESEND_FROM_EMAIL=noreply@jibbit.app`

### How to Verify
1. Trigger a notification (e.g., create a job with deadline)
2. Check Resend Dashboard → Logs for sent email
3. Check recipient inbox for notification email
4. Edge function logs should show successful email send

### Common Failure Modes
1. **"Missing API key"**
   - **Cause**: RESEND_API_KEY not set
   - **Fix**: Set secret in Lovable Cloud
   
2. **"Domain not verified"**
   - **Cause**: Sending from unverified domain
   - **Fix**: Verify domain or use Resend test domain for dev
   
3. **Emails not arriving**
   - **Cause**: SPF/DKIM records not configured
   - **Fix**: Add all DNS records provided by Resend

### Security Notes
- **Never commit** API key to git
- API key grants full sending access - rotate if exposed
- Use separate keys for dev/staging/production
- Monitor Resend usage to detect abuse

---

## 6. OpenAI API (AI Features)

### Why Manual
Requires OpenAI account and API key for AI-powered features (resume generation, cover letters, company research, interview prep).

### Where to Do It
**OpenAI Platform → API Keys**
URL: https://platform.openai.com/api-keys

### Exact Steps
1. Sign up for OpenAI account at https://platform.openai.com
2. Add billing information (required for API access)
3. Go to API Keys
4. Click "Create new secret key"
5. Name it (e.g., "JibbitATS")
6. Copy the key immediately (cannot be viewed again)
7. Set usage limits to prevent unexpected charges:
   - Go to Settings → Limits
   - Set monthly budget cap

### Values to Copy
- **API Key**: Starts with `sk-`, looks like `sk-proj-abc123xyz456`

### Where to Paste
Secret already configured in Lovable Cloud:
- `OPENAI_API_KEY` (already set)

If you need to update:
1. Go to Lovable Cloud Dashboard → Settings → Secrets
2. Update `OPENAI_API_KEY` value

### How to Verify
1. Go to Resume Builder
2. Click "Generate with AI"
3. Should generate resume content
4. Go to Cover Letters
5. Click "Generate Cover Letter"
6. Should generate cover letter
7. Check OpenAI Dashboard → Usage for API calls

### Common Failure Modes
1. **"Insufficient quota"**
   - **Cause**: No billing set up or quota exceeded
   - **Fix**: Add payment method and increase quota
   
2. **"Invalid API key"**
   - **Cause**: Key expired or revoked
   - **Fix**: Generate new API key
   
3. **Rate limit errors**
   - **Cause**: Too many requests too fast
   - **Fix**: Implement rate limiting in edge functions (already done)

### Security Notes
- **Never commit** API key to git
- API key grants full API access - rotate if exposed
- Monitor usage to prevent abuse and unexpected costs
- Consider separate keys for dev/production

---

## 7. Site URL and Redirect URLs (Lovable Cloud Auth)

### Why Manual
Must be configured to match your deployment domains for OAuth callbacks to work.

### Where to Do It
**Lovable Cloud Dashboard → Users → Auth Settings**
Access via: Project Settings → Integrations → Lovable Cloud → Open Backend

### Exact Steps
1. Click "View Backend" button in Lovable interface
2. Navigate to Users → Auth Settings
3. Under "Site URL", set your primary domain:
   ```
   https://jibbit.app
   ```
4. Under "Redirect URLs", add all callback URLs:
   ```
   http://localhost:8080/auth/callback
   http://localhost:8080/*
   https://jibbit.app/auth/callback
   https://jibbit.app/*
   https://fzckeizrrolxgakekzhe.supabase.co/auth/v1/callback
   ```
5. Click "Save"

### Values to Copy
- **Site URL**: Your production domain
- **Redirect URLs**: All URLs where users can be redirected after auth

### Where to Paste
Already configured in Lovable Cloud - just needs to be updated via UI.

### How to Verify
1. Test OAuth login flow in all environments (local, preview, production)
2. Should redirect back to app successfully
3. No "redirect_uri_mismatch" or "invalid path" errors
4. Check browser Network tab for successful 302 redirects

### Common Failure Modes
1. **"requested path is invalid"**
   - **Cause**: Site URL not set or wrong
   - **Fix**: Set Site URL to your production domain
   
2. **Redirect loop**
   - **Cause**: Callback URL not in whitelist
   - **Fix**: Add exact callback URL to Redirect URLs
   
3. **Works in dev but not production**
   - **Cause**: Production domain not added to redirect URLs
   - **Fix**: Add production domain to all redirect URL lists

### Security Notes
- Only add trusted domains to redirect URLs
- Use wildcards carefully (e.g., `https://yourdomain.com/*`)
- Never allow open redirects (e.g., `*`)

---

## 8. Custom Domain (Optional but Recommended)

### Why Manual
Requires DNS configuration at your domain registrar.

### Where to Do It
**Your Domain Registrar DNS Settings** (e.g., Cloudflare, GoDaddy, Namecheap)

### Exact Steps
1. In Lovable Project Settings → Domains, add custom domain
2. Copy the provided DNS records (usually CNAME)
3. Go to your domain registrar's DNS settings
4. Add the CNAME record:
   ```
   Type: CNAME
   Name: @ (or your subdomain)
   Value: [provided by Lovable]
   TTL: Auto or 3600
   ```
5. Wait for DNS propagation (5 mins to 48 hours)
6. Verify in Lovable - should show "Active"

### Values to Copy
- **Domain**: Your domain name (e.g., `jibbit.app`)
- **CNAME Target**: Provided by Lovable after adding domain

### Where to Paste
DNS settings at your domain registrar.

### How to Verify
1. Visit your custom domain in browser
2. Should load your app (not Lovable subdomain)
3. SSL certificate should be valid (green padlock)
4. OAuth flows should work with custom domain

### Common Failure Modes
1. **"Domain not verified"**
   - **Cause**: DNS not propagated yet
   - **Fix**: Wait up to 48 hours; check DNS with `dig` or online tools
   
2. **SSL certificate error**
   - **Cause**: Certificate provisioning in progress
   - **Fix**: Wait 10-15 minutes after DNS propagation
   
3. **OAuth breaks with custom domain**
   - **Cause**: Custom domain not added to OAuth redirect URIs
   - **Fix**: Add custom domain callbacks to all OAuth apps

### Security Notes
- Use HTTPS only (enforced by Lovable)
- Enable DNSSEC if supported by registrar
- Consider using Cloudflare for DDoS protection

---

## Manual Items NOT Required

The following items are **already automated** and do NOT require manual setup:

### ✅ Database Migrations
- All schema changes are in `supabase/migrations/`
- Migrations run automatically on deployment
- No manual SQL execution required

### ✅ RLS Policies
- Already defined in migrations
- Teams, Progress Shares, Community Groups, Advisor Booking all have correct policies
- No manual policy creation needed

### ✅ Edge Functions Deployment
- All edge functions in `supabase/functions/` deploy automatically
- No manual deployment commands needed
- Function logs available in Lovable Cloud

### ✅ Environment Variables (Project Secrets)
These secrets are already configured in Lovable Cloud:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_KEY`
- `AUTOMATION_WEBHOOK_SECRET`

### ✅ Supabase Client Configuration
- `src/integrations/supabase/client.ts` is auto-generated
- Auth storage and session persistence pre-configured
- No manual client setup needed

### ✅ TypeScript Types
- `src/integrations/supabase/types.ts` is auto-generated from DB schema
- Updates automatically after migrations
- No manual type definitions needed

### ✅ Frontend Build & Deploy
- Automatic on code push
- No manual build commands needed
- Preview deployments automatic for branches

### ✅ Test Setup
- Vitest configured in `vitest.config.ts`
- Tests run with `npm test`
- Coverage with `npm run test:coverage`
- No manual test infrastructure setup

### ✅ CI/CD
- GitHub Actions workflows in `.github/workflows/`
- Runs tests and type checking automatically
- No manual CI configuration needed

### ✅ Email Templates
- Notification templates in edge functions
- No external email template service needed

### ✅ File Storage
- Supabase Storage bucket `profile-pictures` already created
- Public access configured
- No manual bucket creation needed

### ✅ Authentication Methods
- Email/password auth works out of the box
- No manual configuration beyond OAuth providers (listed above)

---

## Quick Start Checklist

Minimum required for basic functionality (no OAuth):
- [ ] None! Core app works without any manual setup

To enable Google OAuth:
- [ ] Google Cloud Console OAuth app
- [ ] Configure credentials in Lovable Cloud

To enable LinkedIn OAuth:
- [ ] LinkedIn Developer Portal app
- [ ] Wait for approval
- [ ] Configure credentials in Lovable Cloud

To enable email notifications:
- [ ] Resend account + API key
- [ ] Verify sending domain

To enable AI features:
- [ ] OpenAI account + API key
- [ ] Set up billing

To enable calendar sync:
- [ ] Google Calendar API enabled
- [ ] OAuth credentials with calendar scopes

To use custom domain:
- [ ] Add domain in Lovable
- [ ] Configure DNS CNAME record

---

## Support Resources

- **OAuth Configuration Guide**: `docs/oauth-configuration-guide.md`
- **Integration Fixes**: `docs/integrations-rls-share-community-advisors-institution-fixes.md`
- **Lovable Documentation**: https://docs.lovable.dev/
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **LinkedIn OIDC**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication

For issues specific to this implementation, check the comprehensive fix documentation in the `docs/` directory.
