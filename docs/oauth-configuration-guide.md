# OAuth Configuration Guide

## Overview

JibbitATS supports multiple OAuth providers for seamless authentication:
- Google OAuth
- Microsoft (Azure AD)
- LinkedIn (OIDC)
- GitHub
- Apple

## Current Issues and Fixes

### Google OAuth "Unable to exchange external code" Error

**Root Cause:**
This error occurs when the OAuth redirect URI doesn't match exactly what's registered in Google Cloud Console, or when client credentials are misconfigured.

**Fix Steps:**

1. **Configure in Lovable Cloud Dashboard:**
   - Go to Users → Auth Settings → Google Settings
   - Add your Site URL (e.g., `https://yourapp.lovableproject.com`)
   - Add Redirect URLs:
     - Development: `http://localhost:8080/auth/callback`
     - Preview: `https://yourpreview.lovableproject.com/auth/callback`
     - Production: `https://yourapp.com/auth/callback`

2. **Configure in Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services → Credentials
   - Select your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", add:
     ```
     http://localhost:8080/auth/callback
     https://yourpreview.lovableproject.com/auth/callback
     https://yourapp.com/auth/callback
     ```
   - Under "Authorized JavaScript origins", add:
     ```
     http://localhost:8080
     https://yourpreview.lovableproject.com
     https://yourapp.com
     ```

3. **Ensure Consent Screen is Configured:**
   - Go to OAuth consent screen
   - Add your app name, user support email, and developer contact
   - Under "Scopes", ensure these are added:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`

**Verification:**
- Test login flow in each environment
- Check browser console for any CORS errors
- Verify redirect URL in network tab matches configured URLs

---

### LinkedIn OAuth Not Setup

**Important:** LinkedIn now uses OIDC flow, not the legacy OAuth flow.

**Configuration Steps:**

1. **Register App with LinkedIn:**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Create a new app
   - Under "Auth" tab, add redirect URLs:
     ```
     http://localhost:8080/auth/callback
     https://yourpreview.lovableproject.com/auth/callback
     https://yourapp.com/auth/callback
     ```

2. **Configure in Lovable Cloud:**
   - Go to Users → Auth Settings → LinkedIn Settings
   - Add Client ID and Client Secret from LinkedIn app
   - The system automatically uses `linkedin_oidc` provider

3. **Code Implementation:**
   ```typescript
   const { error } = await supabase.auth.signInWithOAuth({
     provider: 'linkedin_oidc',
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
     },
   });
   ```

**Note:** The legacy `linkedin` provider is deprecated. Always use `linkedin_oidc`.

---

## Development vs Production

### Development (localhost)
- OAuth providers may restrict localhost usage
- Google and GitHub work well in localhost
- LinkedIn and Microsoft may require HTTPS

### Preview Environment
- Fully functional OAuth
- Use preview URLs in provider configurations
- Test thoroughly before production deployment

### Production
- Add custom domain to all provider configurations
- Ensure HTTPS is enabled
- Monitor OAuth errors in production logs

---

## Common Issues and Solutions

### Issue: "Redirect URI mismatch"
**Solution:** Ensure the redirect URI in your OAuth provider settings exactly matches what your app sends, including:
- Protocol (http vs https)
- Port number (e.g., :8080)
- Path (e.g., /auth/callback)

### Issue: "Invalid client" or "unauthorized_client"
**Solution:** 
- Verify Client ID and Client Secret are correctly configured
- Check that secrets are properly stored in Lovable Cloud
- Ensure the OAuth app is enabled/published

### Issue: CORS errors during OAuth flow
**Solution:**
- Add your domain to "Authorized JavaScript origins" in provider settings
- Ensure wildcard domains are not used (most providers don't allow them)

### Issue: User profile data not populated
**Solution:**
- Check scope permissions include email and profile
- Verify the provider returns user metadata
- Check the `profiles` table has RLS policies allowing inserts for new users

---

## Testing OAuth Integration

### Manual Testing Checklist:
- [ ] Can initiate OAuth flow (redirect to provider)
- [ ] Can successfully authenticate with provider
- [ ] Redirected back to app after authentication
- [ ] User session is created
- [ ] User profile is created/updated
- [ ] Can access protected routes after login
- [ ] Can logout successfully

### Error Logging:
All OAuth errors are logged to the browser console and displayed as toast notifications. Check:
1. Browser Developer Tools → Console
2. Network tab → Failed requests
3. Lovable Cloud → Auth Logs (for server-side errors)

---

## Security Best Practices

1. **Never commit OAuth credentials to git**
   - All credentials are stored in Lovable Cloud secrets
   - Never add client secrets to frontend code

2. **Use state parameter** (handled automatically by Supabase)
   - Prevents CSRF attacks
   - Supabase Auth includes this by default

3. **Validate redirectTo URLs**
   - Only allow whitelisted domains
   - The app currently validates against `window.location.origin`

4. **Token refresh**
   - Supabase handles automatic token refresh
   - Configured in the Supabase client initialization

5. **Secure storage**
   - Auth tokens stored in localStorage (handled by Supabase)
   - Consider httpOnly cookies for production (requires custom auth setup)

---

## Support and Documentation

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2
- **LinkedIn OIDC:** https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **GitHub OAuth:** https://docs.github.com/en/developers/apps/building-oauth-apps

For issues specific to JibbitATS OAuth implementation, check:
- `src/pages/Login.tsx` - OAuth button handlers
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/pages/AuthCallback.tsx` - OAuth redirect handler
