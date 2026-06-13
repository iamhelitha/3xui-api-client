# Phase C Testing: Mutating & Destructive Endpoints

## Overview

Phase C validates 10 dangerous/mutating API endpoints that modify system state, restart services, and perform destructive operations. These tests **MUST only run on TEST/DEV servers**, never on PRODUCTION.

Phase C is designed with multiple safety layers:
1. ✓ Server validation (ensures TEST server only)
2. ✓ Global approval gate (requires user confirmation to proceed)
3. ✓ Per-endpoint approval (user must approve each dangerous operation)
4. ✓ Automatic rollback (reversible operations restore system state)
5. ✓ Server recovery verification (waits for services to come back online)
6. ✓ Comprehensive result documentation (clear record of what happened)

## Endpoints Being Tested

| # | Endpoint | Operation | Risk | Reversible |
|---|----------|-----------|------|-----------|
| 1 | updateSetting | Change panel setting (language/theme) | Low | Yes |
| 2 | updateUser | Update test user field (remark) | Low | Yes |
| 3 | updateXrayConfig | Safe config modification | Medium | Yes |
| 4 | resetOutboundsTraffic | Reset traffic counter | Low | No |
| 5 | manageWarp | Query WARP status (read-safe) | Low | No |
| 6 | restartXrayService | Restart Xray service | High | No |
| 7 | stopXrayService | Stop Xray service | **CRITICAL** | No |
| 8 | restartPanel | Restart panel service | High | No |
| 9 | installXray | Install/verify Xray | Low | No |
| 10 | importDB | **Replace database from backup** | **CRITICAL** | Yes |

## Safety Requirements

Before running Phase C:

- [ ] You have a TEST/DEV 3x-ui server (not PRODUCTION)
- [ ] Server URL points to test server (contains "test", "localhost", or "staging" in URL)
- [ ] You have admin credentials for the test server
- [ ] You understand that services will be restarted (sessions will drop)
- [ ] You understand that importDB will REPLACE the current database
- [ ] You have a backup of important data before starting
- [ ] You can monitor the server during tests (check logs, verify recovery)

## Setup Instructions

### 1. Configure Environment

Create/update `.env` in project root:

```bash
# TEST server credentials (never use PRODUCTION here!)
TEST_PANEL_URL=http://localhost:7070    # or your test server
TEST_PANEL_USERNAME=admin
TEST_PANEL_PASSWORD=password

# Standard credentials (for fallback)
PANEL_URL=http://production:7070
PANEL_USERNAME=admin
PANEL_PASSWORD=password
```

### 2. Verify Setup Phase Passes

The test runner includes an automatic setup phase that:
- Validates server is TEST (hostname/URL check)
- Captures current settings (for rollback)
- Creates a temporary test user
- Backs up the database
- Captures traffic baseline

Run setup validation:

```bash
node test/phase-c-setup-data.js
```

You should see:
```
=== Phase C Setup & Data Preparation ===

1. Validating TEST server...
   ✓ TEST server validated
2. Capturing current settings...
   ✓ Settings captured
3. Capturing Xray configuration...
   ✓ Xray config captured
4. Creating test user...
   ✓ Test user created: phase-c-test-1234567890@example.com
5. Capturing traffic baseline...
   ✓ Traffic baseline captured
6. Creating database backup...
   ✓ Database backup created

=== Setup Complete ===
```

If setup fails with "SAFETY CHECK FAILED", your server URL is not recognized as a TEST server. Update `.env` to use a URL containing "test", "localhost", "staging", or "127.0.0.1".

### 3. Run Phase C Tests

```bash
node test/phase-c-execute-tests.js
```

## Test Execution Flow

### Global Approval

```
Phase C will execute DESTRUCTIVE operations on http://localhost:7070.

This includes:
  • Service restarts (panel, xray)
  • Database operations
  • Configuration changes

Continue? (yes/no):
```

**Answer "yes" only if you are certain you want to proceed.**

### Per-Endpoint Approval

For each endpoint, you'll see:

```
Test 1: updateSetting

This test changes the panel language setting to "en_US". 
The rollback will restore the original language setting. 
Safe operation, no impact on functionality.

Proceed? (yes/no):
```

**Answer "yes" for endpoints you want to test, "no" to skip.**

### Execution

Tests run sequentially. Each test:
1. Executes the endpoint
2. Validates the response shape
3. If reversible, automatically rolls back
4. Verifies server is still reachable
5. Logs results

Example output:

```
Test 1: updateSetting
  ✓ PASS (234ms)

Test 2: updateUser
  ✓ PASS (156ms)

Test 6: restartXrayService
  (waiting for service to recover...)
  ✓ PASS (8934ms)
```

### Results

After all tests, a results document is generated:

```
Step 5: Generating results document...

Phase C Results
Passed:  8/10
Failed:  1/10
Manual Rollbacks:  1

Results saved to: test/phase-c-result-2026-06-14T10-30-45-123Z.md
```

## What Each Test Does

### 1. updateSetting
- **What:** Changes panel language to "en_US"
- **Impact:** Panel UI language changes (revert with rollback)
- **Rollback:** Restores original language
- **Safe:** Yes

### 2. updateUser
- **What:** Updates test user's remark field
- **Impact:** Test user's remark changes (revert with rollback)
- **Rollback:** Restores original remark
- **Safe:** Yes

### 3. updateXrayConfig
- **What:** Reads current config, applies safe minimal change
- **Impact:** Xray configuration modified (revert with rollback)
- **Rollback:** Restores original configuration
- **Safe:** Yes (if minimal safe changes only)

### 4. resetOutboundsTraffic
- **What:** Resets outbound traffic counters to zero
- **Impact:** Traffic statistics lost (ONE-WAY, not reversible)
- **Rollback:** N/A (not reversible)
- **Safe:** Yes (metrics only, no configuration changes)

### 5. manageWarp
- **What:** Queries WARP status (read-safe, no modification)
- **Impact:** None
- **Rollback:** N/A (read-only)
- **Safe:** Yes

### 6. restartXrayService
- **What:** Restarts the Xray service
- **Impact:** All active connections drop, inbounds go offline, service recovers in ~30 seconds
- **Rollback:** N/A (self-healing)
- **Safe:** Yes (normal operation, service recovers automatically)

### 7. stopXrayService ⚠️
- **What:** Stops the Xray service (inbounds go offline)
- **Impact:** Service down (manual restart required or auto-recover if configured)
- **Rollback:** N/A (requires manual restart)
- **Safe:** Risky (may need manual intervention)
- **Skipped by default** — only run with explicit approval

### 8. restartPanel
- **What:** Restarts the 3x-ui panel service
- **Impact:** Current session drops, web UI unavailable for ~30 seconds
- **Rollback:** N/A (self-healing)
- **Safe:** Yes (normal operation, service recovers automatically)

### 9. installXray
- **What:** Installs or verifies Xray installation
- **Impact:** If not installed, downloads and installs (may take time)
- **Rollback:** N/A (idempotent, can re-run safely)
- **Safe:** Yes (installation is safe operation)

### 10. importDB ⚠️ CRITICAL
- **What:** Imports database from backup file, **REPLACING current database**
- **Impact:** **ALL data reverts to backup state** — users, inbounds, clients, settings all revert
- **Rollback:** Yes (imports backup taken before this test)
- **Safe:** Medium (safe if rollback works, CRITICAL if it doesn't)
- **Warning:** This is the most dangerous operation. Ensure you understand what data will be lost.

## Monitoring During Tests

While Phase C tests run:

### Monitor Server Logs

```bash
# In another terminal, watch the panel logs
tail -f /path/to/3xui/logs/panel.log
tail -f /path/to/3xui/logs/xray.log
```

### Monitor Service Status

```bash
# Check if services are running
curl http://localhost:7070/panel/api/server/status
curl http://localhost:7070/panel/api/xray/getXrayResult
```

### Monitor Resource Usage

```bash
# Check CPU/memory during service restarts
top
```

## Troubleshooting

### Test Fails with "Server did not recover"

The test tried to restart a service but it didn't come back online within 45 seconds.

**What to do:**
1. Wait 60 seconds and manually check if service recovered
2. If recovered, the test may be flagged as failed but system is OK
3. If not recovered, manually restart the service:
   ```bash
   # For 3x-ui
   sudo systemctl restart x-ui
   
   # For Xray (if separate)
   sudo systemctl restart xray
   ```

### Test Fails with "Manual Rollback Needed"

A test executed successfully but the automatic rollback failed.

**What to do:**
1. Check the result document to see which test failed
2. Manually restore the setting/configuration:
   - For updateSetting: change setting back to original value via panel UI
   - For updateUser: update user back via panel UI
   - For updateXrayConfig: restore config via panel UI
   - For importDB: manually re-import the correct database backup

### Database Import Test Fails

The importDB test failed to restore a backup.

**CRITICAL:** Check your data!

1. Log into panel and verify what data is present
2. If wrong data present, manually restore from backup:
   ```bash
   # Export current state
   curl http://localhost:7070/panel/api/server/getDb > current-state.db
   
   # Restore known-good backup
   curl -X POST -F "file=@backup.db" http://localhost:7070/panel/api/server/importDb
   ```

### Phase C Hangs Waiting for User Input

The test runner is waiting for user approval.

**What to do:**
1. Type `yes` or `no` and press Enter
2. Or press Ctrl+C to cancel

### Phase C Takes a Long Time

Service restart tests wait up to 45 seconds for recovery (reasonable for virtual servers).

**Expected timings:**
- Fast tests (settings, queries): 100-500ms
- Service restart tests: 10-45 seconds
- Database import: 5-30 seconds

If tests hang beyond these times, service may not be recovering — check logs and consider manual intervention.

## Manual Cleanup After Tests

Phase C tries to clean up automatically, but you may need to manually:

### Remove Test User

If test user wasn't automatically deleted:

```bash
# Log into panel and delete user: phase-c-test-[timestamp]@example.com
# Or use API:
curl -X POST http://localhost:7070/panel/api/setting/deleteUser \
  -H "Content-Type: application/json" \
  -d '{"email":"phase-c-test-1234567890@example.com"}'
```

### Restore Settings

If any settings weren't rolled back:

```bash
# Log into panel settings and manually restore:
# - Language
# - Theme
# - Any other changed settings
```

### Restore Database

If database import failed and you need to restore:

```bash
# Use the backup created before Phase C tests
curl -X POST -F "file=@path/to/backup.db" \
  http://localhost:7070/panel/api/server/importDb
```

## After Phase C: Next Steps

Once Phase C completes:

1. **Review result document** — Understand what passed/failed
2. **Update type definitions** — If response shapes differ from index.d.ts
3. **Identify Phase D** — Determine next testing phase:
   - Error scenario testing (invalid params, boundary conditions)
   - Integration testing (multi-endpoint workflows)
   - Performance/load testing
   - Hidden/undocumented endpoint discovery

## FAQ

**Q: Can I run Phase C on a production server?**
A: No. The test includes a safety check that refuses to run unless the server URL contains "test", "localhost", "staging", or "127.0.0.1". This is intentional.

**Q: What if a test succeeds but rollback fails?**
A: The test is marked as "MANUAL_ROLLBACK_NEEDED". You must manually restore the system state using the information in the result document.

**Q: Can I re-run Phase C?**
A: Yes, Phase C is designed to be idempotent (safe to re-run). However, some operations like database import are destructive — ensure you back up important data first.

**Q: What if the server is unreachable after a test?**
A: The test runner will automatically wait and retry up to 45 seconds for recovery. If the server doesn't recover, it likely requires manual intervention (check logs, restart service).

**Q: Do I need to run Phase A and Phase B before Phase C?**
A: No. Each phase is independent. You can run Phase C without Phase A/B. However, Phase C assumes the test server is already set up with a 3x-ui installation.

## Support

If Phase C tests fail unexpectedly:

1. Check the result document (`test/phase-c-result-[timestamp].md`)
2. Review server logs (panel, xray)
3. Check network connectivity
4. Verify test server is accessible
5. Re-run setup phase: `node test/phase-c-setup-data.js`
6. Run Phase C again with more detailed logging

For help, refer to the test output and result document for specific error messages.
