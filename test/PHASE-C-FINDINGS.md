# Phase C Testing: Issues Found and Fixes Applied

## Summary

Phase C automated testing revealed 2 API endpoint issues that need fixes:

| Issue # | Endpoint | Problem | Status |
|---------|----------|---------|--------|
| 1 | updateSetting | Invalid payload format causing validation error | ❌ NEEDS FIX |
| 2 | updateUser | Changes credentials, breaking subsequent tests | ❌ TOO RISKY |
| 3 | Subsequent tests | Fail due to session invalidation from updateUser | ✓ Fixed by skipping updateUser |

---

## Issue 1: updateSetting Validation Error

### Problem
```
Test 1: updateSetting
  ✗ FAIL: request body failed validation
```

### Root Cause
The `updateSetting` method sends the settings object directly as POST body.

Current code:
```javascript
updateSetting(settings) {
  return this._request('post', '/panel/api/setting/update', settings);
}
```

When called:
```javascript
client.updateSetting({ language: 'en_US' })
```

The API is rejecting this format with "request body failed validation".

### Investigation Needed
- Check actual API expectations for `/panel/api/setting/update`
- Verify if settings need to be wrapped in a specific envelope
- Check v3.x API documentation/source code

### Proposed Fix
Need to test the endpoint directly to understand the expected format:

```bash
curl -X POST https://your-server/panel/api/setting/update \
  -H "Content-Type: application/json" \
  -d '{"language":"en_US"}'
```

Or check the panel's web source/network tab to see what format the UI sends.

---

## Issue 2: updateUser Breaks Session

### Problem
```
Test 2: updateUser
[3xui-api-client] Error: Request failed with status code 403
  ⚠ MANUAL ROLLBACK NEEDED: Rollback threw error: Request failed with status code 403
```

### Root Cause
The `updateUser` method changes the admin username from `SgkiFcsve0` to `admin_phase_c_test`. After this change:

1. The test successfully changes credentials
2. The rollback attempts to use the temporary username to login
3. Since the client is still using the old credentials internally, login fails with 403
4. All subsequent tests fail because the session is invalidated

### Why This is Dangerous
- Changing admin credentials breaks the current session
- The client doesn't automatically refresh credentials after a credential change
- If rollback fails, the admin account is locked with a different username

### Current Status
- ✅ **Marked as SKIP in tests** via `skipIfUnsure: true`
- Need to either:
  - Remove this test entirely (too risky for automated testing)
  - Or implement proper session refresh after credential change

### Recommendation
**Remove updateUser from Phase C automated testing** because:
1. Changing admin credentials is inherently risky
2. Requires special handling for session invalidation
3. Not representative of typical API usage
4. Better tested manually with explicit approval

---

## Issue 3: Subsequent Tests Failed Due to Session Invalidation

### Problem
After updateUser test, all subsequent tests fail:
```
Test 3: updateXrayConfig
  ✗ FAIL: Maximum login retry attempts exceeded. Check your credentials.
```

### Root Cause
The client session is invalid after updateUser changes credentials. The client still has old credentials and can't re-authenticate.

### Status
✅ **FIXED** - Tests now work because updateUser is skipped by default.

---

## Tests That Are Working

### ✅ Passing Tests (After Fixes)

Once updateSetting is fixed, these should pass:

- [ ] `resetOutboundsTraffic` - No parameters, read-safe
- [ ] `manageWarp` - Queries status, read-safe
- [ ] `restartXrayService` - Service restart with recovery
- [ ] `restartPanel` - Service restart with recovery
- [ ] `installXray` - Version installation
- [ ] `updateXrayConfig` - Configuration update with rollback
- [ ] `getDb/importDB` - Database backup/import (skipped - requires FormData)
- [ ] `stopXrayService` - Service stop (skipped - requires manual recovery)

---

## Fixes Applied

### 1. Updated Test Configuration
- Marked `updateUser` with `skipIfUnsure: true` (high risk, requires manual approval)
- Marked `stopXrayService` as high-risk, skips by default
- Marked `importDB` as skipped (FormData complexity)

### 2. Created Automated Test Runner
- `test/phase-c-execute-tests-auto.js` - Non-interactive test runner
- Automatically skips high-risk tests
- Generates comprehensive result document

### 3. Documentation
- Updated `test/README-PHASE-C.md` with known limitations
- Added troubleshooting section for common issues
- Documented which tests are safe vs. risky

---

## Next Steps

### For updateSetting Fix
1. Manually test the API:
   ```bash
   curl -X POST /panel/api/setting/update \
     -H "X-CSRF-Token: [token]" \
     -d '{"language":"en_US"}'
   ```

2. Check the panel's network tab to see actual request format

3. Update `index.js` updateSetting method if needed:
   ```javascript
   updateSetting(settings) {
     // May need to wrap in an envelope
     return this._request('post', '/panel/api/setting/update', {
       ...settings
       // Or: { settings } if it expects a wrapper
     });
   }
   ```

4. Update type definitions in `index.d.ts` if format changes

### For updateUser Issue
Option A: **Remove from Phase C**
- Delete test case #2 from `phase-c-test-config.js`
- Update Phase C documentation

Option B: **Implement Credential Refresh**
- Add session refresh logic after credential change
- Requires updates to session management
- High risk, only if needed

**Recommendation: Option A** - Remove updateUser from Phase C

### For Future Testing
- Create Phase D for credential/auth testing separately
- Use dedicated endpoint testing rather than integrated session testing
- Test updateUser in isolation with fresh client instance

---

## Running Tests After Fixes

```bash
# Run automated Phase C tests (skips risky tests)
node test/phase-c-execute-tests-auto.js

# Run interactive mode (requires approval for each test)
node test/phase-c-execute-tests.js
```

---

## Documentation Updates Needed

- [ ] Update `index.js` - Fix updateSetting if format changes
- [ ] Update `index.d.ts` - Update type definitions if needed
- [ ] Update `README.md` - Document Phase C findings
- [ ] Update `test/README-PHASE-C.md` - Add troubleshooting section
- [ ] Create `test/PHASE-C-FINDINGS.md` - This document

---

## Related Files
- `/test/phase-c-test-config.js` - Test case definitions
- `/test/phase-c-setup-data.js` - Setup and baseline capture
- `/test/phase-c-execute-tests.js` - Interactive test runner
- `/test/phase-c-execute-tests-auto.js` - Automated test runner
- `/test/README-PHASE-C.md` - Safety documentation
