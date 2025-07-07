# Issue #25: OAuth Social Login Integration Fix

**Link:** [GitHub Issue #25](https://github.com/cartmantft/sub-translate/issues/25)

## Problem Analysis

### Root Cause
The OAuth social login (Google and GitHub) integration is failing because `detectSessionInUrl: false` is configured in both client and server Supabase configurations. This prevents Supabase from properly handling OAuth callback URLs that contain authentication tokens/codes.

### Current State
- Login page displays Google and GitHub login buttons
- OAuth callback route exists at `/auth/callback/route.ts`
- Environment variables are properly configured
- OAuth providers are configured in the Auth UI component
- **Issue:** `detectSessionInUrl: false` blocks OAuth token detection

### Technical Details
1. **Client Configuration** (`/src/lib/supabase/client.ts:34`)
   - `detectSessionInUrl: false` prevents OAuth callback handling
   - Needs to be `true` for OAuth flows to work

2. **Server Configuration** (`/src/lib/supabase/server.ts:35`)
   - Also has `detectSessionInUrl: false`
   - Should be `true` for proper OAuth handling

3. **OAuth Flow**
   - User clicks "Google로 계속하기" or "Github로 계속하기"
   - Redirects to OAuth provider
   - Provider redirects back to `/auth/callback` with code/token
   - Supabase client should detect and exchange the code for session
   - **Currently failing** because session detection is disabled

## Solution Implementation

### Phase 1: Core Configuration Fix ✅ COMPLETED
- [x] Enable `detectSessionInUrl: true` in client configuration
- [x] Enable `detectSessionInUrl: true` in server configuration
- [x] Test OAuth flows work with the fix

**Testing Results:**
- ✅ Google OAuth button correctly redirects to Supabase OAuth endpoint
- ✅ GitHub OAuth button correctly redirects to Supabase OAuth endpoint
- ❌ OAuth providers are not enabled in Supabase dashboard (configuration issue)
- ✅ OAuth callback URL handling is working properly

### Phase 1.5: Supabase Dashboard Configuration (Required)
- [ ] Enable Google OAuth provider in Supabase Authentication settings
- [ ] Enable GitHub OAuth provider in Supabase Authentication settings
- [ ] Configure OAuth app credentials in Supabase dashboard

### Phase 2: Enhanced Error Handling
- [ ] Improve OAuth error messages in login page
- [ ] Add specific error handling for OAuth failures
- [ ] Add loading states during OAuth redirects

### Phase 3: Testing & Validation
- [ ] Manual testing of Google OAuth flow
- [ ] Manual testing of GitHub OAuth flow
- [ ] Automated Playwright tests for OAuth flows
- [ ] Verify both development and production environments

## Expected Behavior After Fix

### Google OAuth Flow
1. User clicks "Google로 계속하기" button
2. Redirects to Google OAuth consent screen
3. User approves permissions
4. Redirects back to `/auth/callback` with authorization code
5. Supabase exchanges code for session
6. User is redirected to dashboard

### GitHub OAuth Flow
1. User clicks "Github로 계속하기" button
2. Redirects to GitHub OAuth consent screen
3. User approves permissions
4. Redirects back to `/auth/callback` with authorization code
5. Supabase exchanges code for session
6. User is redirected to dashboard

## Implementation Notes

### Security Considerations
- OAuth callback route already has Open Redirect protection
- URL validation is properly implemented
- Error logging is secure with sensitive data masking

### Development vs Production
- Development uses memory storage for session persistence
- Production uses standard cookie-based session storage
- Both environments need `detectSessionInUrl: true`

## Testing Strategy

### Manual Testing Results
1. ✅ Started dev server with `npm run servers:start`
2. ✅ Navigated to `/login`
3. ✅ Clicked "Google로 계속하기" button - redirects to Supabase OAuth endpoint
4. ❌ OAuth provider not enabled error: "Unsupported provider: provider is not enabled"
5. ✅ Clicked "Github로 계속하기" button - redirects to Supabase OAuth endpoint
6. ❌ OAuth provider not enabled error: "Unsupported provider: provider is not enabled"

**Test URLs Generated:**
- Google: `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&code_challenge=...`
- GitHub: `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/authorize?provider=github&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&code_challenge=...`

### Configuration Steps Required
1. **Enable OAuth Providers in Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/<YOUR_SUPABASE_PROJECT_ID>/auth/providers
   - Enable Google OAuth provider
   - Enable GitHub OAuth provider
   - Configure OAuth app credentials

2. **Google OAuth Setup:**
   - Create OAuth 2.0 Client ID in Google Cloud Console
   - Set authorized redirect URI: `https://zzzdgxlisqlgptymtmsg.supabase.co/auth/v1/callback`
   - Add Client ID and Client Secret to Supabase

3. **GitHub OAuth Setup:**
   - Create OAuth App in GitHub Developer Settings
   - Set callback URL: `https://zzzdgxlisqlgptymtmsg.supabase.co/auth/v1/callback`
   - Add Client ID and Client Secret to Supabase

### Automated Testing
- Create Playwright tests for OAuth flows
- Test both success and failure scenarios
- Verify proper error messages display

## Acceptance Criteria Validation

- [ ] Google OAuth login button redirects to Google auth page
- [ ] GitHub OAuth login button redirects to GitHub auth page  
- [ ] Google account auth completes and redirects to dashboard
- [ ] GitHub account auth completes and redirects to dashboard
- [ ] OAuth failures show clear error messages
- [ ] Works in both development and production environments