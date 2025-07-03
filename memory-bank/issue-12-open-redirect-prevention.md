# Issue #12: Open Redirect Prevention and URL Validation

**GitHub Issue**: [#12 - [보안] 리다이렉트 URL 검증 및 Open Redirect 방지](https://github.com/cartmantft/sub-translate/issues/12)

## Problem Analysis

### Critical Vulnerability Identified
**LOCATION**: `/src/app/auth/callback/route.ts` lines 8-14
**SEVERITY**: HIGH - Open Redirect vulnerability in OAuth callback

**Current Vulnerable Code**:
```typescript
const next = searchParams.get('next') ?? '/'
return NextResponse.redirect(`${origin}${next}`)
```

**Attack Vector**: 
```
https://yourapp.com/auth/callback?code=valid_code&next=https://malicious-site.com
```

### Security Impact
- **Phishing Attacks**: Users can be redirected to lookalike malicious sites
- **Credential Harvesting**: Attackers can steal user credentials post-authentication
- **SEO Attacks**: Malicious redirection can harm domain reputation
- **OAuth Token Theft**: Potential for stealing authentication tokens

## Implementation Plan

### Phase 1: Core URL Validation Framework
1. **Create URL Validator Utility** (`/src/lib/utils/url-validator.ts`)
   - Implement allowlist-based validation
   - Support both development and production environments
   - Handle edge cases (relative URLs, fragments, query params)

2. **Create Redirect Safety Config** (`/src/lib/config/redirect-config.ts`)
   - Define allowed domains (localhost, production domain)
   - Define allowed paths (/dashboard, /projects, /)
   - Environment-specific configuration

### Phase 2: OAuth Callback Security
1. **Fix OAuth Callback Route** (`/src/app/auth/callback/route.ts`)
   - Integrate URL validation before redirect
   - Add secure logging for blocked attempts
   - Default to safe fallback page

2. **Enhance Error Handling** (`/src/app/auth/auth-code-error/page.tsx`)
   - Validate any redirect parameters
   - Ensure error page cannot be weaponized

### Phase 3: System-wide Protection
1. **Update Authentication Middleware** (`/src/middleware.ts`)
   - Add redirect validation to login redirects
   - Protect against redirect loops

2. **Secure Navigation Components**
   - Update any client-side redirect logic
   - Implement safe redirect utilities

### Phase 4: Security Enhancements
1. **Add Security Logging** 
   - Log blocked redirect attempts
   - Use existing secure logger utility
   - Monitor for attack patterns

2. **Implement CSRF-like Protection**
   - Add state parameter to OAuth flow
   - Validate state on callback

### Phase 5: Comprehensive Testing
1. **Playwright Security Tests**
   - Test malicious redirect attempts
   - Verify proper fallback behavior
   - Test edge cases (encoded URLs, relative paths)

2. **Unit Tests for Validation Logic**
   - Test URL parser edge cases
   - Verify allowlist effectiveness
   - Test environment-specific behavior

## Technical Requirements

### URL Validation Rules
1. **Same-Origin Only**: All redirects must be to same origin
2. **Path Allowlist**: Only predefined safe paths allowed
3. **No External Domains**: Block all external redirects
4. **Fallback Safety**: Default to "/" for invalid URLs

### Allowed Redirect Destinations
- `/` (home page)
- `/dashboard` (user dashboard)  
- `/projects` (projects page)
- `/login` (login page - for auth flows)

### Security Headers Enhancement
- Maintain existing CSP implementation
- Consider adding `Referrer-Policy: strict-origin-when-cross-origin`
- Ensure `X-Frame-Options: DENY` remains active

## Integration with Existing Security

### Leverage Current Infrastructure
- **Middleware System**: `/src/middleware.ts` - already has security patterns
- **Logger Utility**: Use existing secure logging from Issue #10
- **CSRF Framework**: Follow patterns from Issue #11 implementation
- **Test Infrastructure**: Extend Playwright security test suite

### Maintain Security Consistency
- Follow established error handling patterns
- Use consistent logging format
- Maintain TypeScript strict mode compliance
- Keep environment-aware configuration pattern

## Success Criteria

### Functional Requirements ✅
- [ ] OAuth callback validates redirect URLs
- [ ] External URL redirects are blocked
- [ ] Safe fallback for invalid redirects
- [ ] Maintains user experience for valid flows
- [ ] Preserves authentication functionality

### Security Requirements ✅
- [ ] No Open Redirect vulnerability
- [ ] Comprehensive input validation
- [ ] Security logging for monitoring
- [ ] Defense in depth approach
- [ ] Zero false positives for legitimate use

### Testing Requirements ✅
- [ ] Playwright tests cover attack scenarios
- [ ] Unit tests validate edge cases
- [ ] Manual security testing passes
- [ ] No regression in authentication flows
- [ ] Performance impact minimal

## Risk Assessment

### Pre-Implementation Risks
- **High**: Open Redirect vulnerability active
- **Medium**: Potential for credential theft
- **Low**: SEO and reputation damage

### Post-Implementation Risks
- **Low**: User experience degradation if overly restrictive
- **Low**: Authentication flow disruption
- **Minimal**: Performance impact from validation

## Dependencies and Considerations

### No External Dependencies
- Implement using native URL API
- Leverage existing security infrastructure
- No new npm packages required

### Backward Compatibility
- Maintain all existing legitimate redirect flows
- Preserve user experience
- No breaking changes to API

### Performance Considerations
- URL validation must be fast (< 1ms)
- Minimal overhead on authentication flow
- Consider caching for repeated validations

## Implementation Timeline

1. **Day 1**: Core URL validation framework
2. **Day 2**: OAuth callback security fix
3. **Day 3**: System-wide protection and testing
4. **Day 4**: Security enhancements and comprehensive testing
5. **Day 5**: Code review and deployment preparation

## References

- **OWASP Open Redirect Prevention**: https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html
- **CWE-601: URL Redirection to Untrusted Site**: https://cwe.mitre.org/data/definitions/601.html
- **Previous Security Work**: Issues #10 (Auth Error Handling) and #11 (CSRF Protection)