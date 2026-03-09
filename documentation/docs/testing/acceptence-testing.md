---
sidebar_position: 3
---
# Acceptance test

Demonstration of all of the functional and non-functional requirements. This can be a combination of automated tests derived from the use-cases (user stories) and manual tests with recorded observation of the results.

## Functional acceptance test results (actual)

| ID | Scenario | Action | Expected Result | Actual Result | Status |
| -- | -------- | ------ | --------------- | ------------- | ------ |
| 01 | Caregiver registration | Enter valid caregiver details and submit sign up form | Caregiver account is created and caregiver is signed in | Account created successfully and caregiver admin opened | PASS |
| 02 | Caregiver authentication | Enter valid username and password in sign in form | User is authenticated and can access caregiver tools | Sign in successful and caregiver admin modal opened | PASS |
| 03 | Caregiver session termination | Select sign out from caregiver admin modal | Caregiver session is cleared and admin tools are inaccessible | Sign out successful and caregiver access requires login again | PASS |
| 04 | Suggestion search | Enter keyword in caregiver search tab and run search | Suggestions are returned from available sources | Local/API suggestion results were returned and displayed | PASS |
| 05 | Student linking by PIN | Enter student PIN in Students tab and submit add action | Student is linked and shown in caregiver student list | Student linked successfully and shown in Students tab | PASS |

## Non-functional acceptance test description

Non-functional acceptance testing validates overall product quality beyond feature correctness. The table below records outcomes and their related use cases.

| ID | Scenario | Action | Expected Result | Actual Result | Status |
| -- | -------- | ------ | --------------- | ------------- | ------ |
| 18 | Navigation consistency | Navigate between child and caregiver flows using AAC entry points | Navigation is intuitive and consistent across role-based views | Caregiver actions are discoverable via dedicated entry points; child view remains clean and focused | PASS |
| 19 | Non-text content | Use icon/image-based controls in main workflows | Icons and visual elements are clear, recognizable, and intuitive | Users could complete targeted tasks using icon-driven actions without confusion | PASS |
| 20 | Contrast and visual clarity | Evaluate readability of text, icons, and controls in normal usage | Interface meets AASPIRE and WCAG-aligned contrast and clarity expectations | UI remained readable and visually clear during manual validation in target environment | PASS |
| 21 | Performance responsiveness | Perform authentication, grid interaction, and suggestion search under normal conditions | Core interactions respond without noticeable blocking | Core interactions were responsive during manual validation and test execution | PASS |
| 22 | Reliability of core flows | Repeat sign in/out, student linking, and search across refresh cycles | Core flows remain stable without data corruption or inconsistent behavior | Sign in/out, student linking, and suggestion operations behaved consistently over repeated runs | PASS |
| 23 | Security and privacy controls | Attempt caregiver-only actions before and after authentication | Restricted features require valid authentication and are protected from unauthorized access | Caregiver-only features were inaccessible until successful caregiver authentication | PASS |
| 24 | Maintainability and testability | Review modularity, automated tests, and acceptance documentation coverage | Changes are testable, documented, and maintainable with low regression risk | Automated caregiver service tests pass and acceptance outcomes are documented in this report | PASS |

## NFR Traceability Matrix

This matrix maps each non-functional acceptance test to the corresponding non-functional requirement in `features-and-requirements.md`.

| Test ID | Non-Functional Test Case | Related Non-Functional Requirement |
| ------- | ------------------------- | ---------------------------------- |
| 18 | Navigation consistency | The app will have a simplified userflow. |
| 19 | Non-text content | The app will support text scaling without clipping or overlapping to ensure readability. |
| 20 | Contrast and visual clarity | The app will support text scaling without clipping or overlapping to ensure readability. |
| 21 | Performance responsiveness | When a user presses the speech button for audio output, the audio will play slowly and clearly and will be uninterrupted until the sentence is complete; speech takes place within 3 seconds of the button being tapped. |
| 22 | Reliability of core flows | A user account is not required for sentence formation and speech. |
| 23 | Security and privacy controls | A user account is not required for sentence formation and speech. |
| 24 | Maintainability and testability | The app will have a simplified userflow. |
