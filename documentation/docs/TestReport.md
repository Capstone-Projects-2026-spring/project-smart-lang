# Test Report

## Purpose
The Test Report is a record that the tests were run and a documentation of their results.

## Unit Test Output

**Command run:** `yarn test` / `jest --coverage`

**Results (Summary):**
- **Test Suites:** 2 skipped, 61 passed, 61 of 63 total
- **Tests:** 95 skipped, 952 passed, 1047 total
- **Time:** 12.185 s

**Coverage Summary:**
| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
|---|---|---|---|---|---|
| **All files** | **98.27** | **94.93** | **100** | **98.23** | |
| MapCache.js | 98.3 | 94.87 | 100 | 98.27 | 101 |
| dataUtil.js | 97.29 | 92.3 | 100 | 97.22 | 55 |
| voiceUtil.js | 100 | 100 | 100 | 100 | |

## Integration Test Output
The integration testing requirements covering module boundaries (e.g., Login/session flow, board loading/persistence with Firestore, and the Speech pipeline) are validated within the project's Jest test suite (specifically in `authService.test.js`, `firestoreSyncService.test.js`, and `speechService.test.js`). 

The output and coverage for these integration scenarios are included in the aggregated `yarn test` unit/integration test results above.

## Automated Acceptance Tests
Automated E2E acceptance tests are not configured in this project. Acceptance testing is performed manually according to the project's Release Readiness Checklist.

## Manual Acceptance Tests

**Test Date:** 2026-04-28
**Application Version:** 0.1.0 
**Dataset/Board Used:** Global-Core_Communicator_ARASAAC_EN

| Release Readiness Checklist Item | Pass/Fail | Notes / Deviations |
|----------------------------------|-----------|--------------------|
| User can open a board and compose a sentence from grid elements. | PASS | Verified composition works successfully. |
| User can speak the sentence through the configured speech provider. | PASS | Verified speech output triggers correctly. |
| Offline mode keeps core communication features usable. | PASS | Tested PWA caching with network disconnected. |
| Returning online restores synchronization behavior without data loss. | PASS | Verified data syncs back to Firebase Firestore. |
| Caregiver workflows for vocabulary updates behave as documented. | PASS | Admin tile visibility pushes correctly. |
| Accessibility and responsiveness checks pass on target devices. | PASS | UI responds correctly on simulated mobile/tablet layouts. |

## List of Known Problems

- **Google Sign-in popup closure:** `code: 'auth/popup-closed-by-user'` throws an expected UI error when the user cancels login popup during Auth service tests. Handled gracefully.
- **Firebase Network Error on Teardown:** Sign-out occasionally throws a network error during local test suite tear down due to emulator/network constraints.
- **Outdated Mapping warning:** `[baseline-browser-mapping] The data in this module is over two months old.` Needs local package update `npm i baseline-browser-mapping@latest -D`.