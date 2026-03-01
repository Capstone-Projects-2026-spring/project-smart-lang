---
sidebar_position: 3
---
# Acceptance test

Non-functional acceptance testing assesses quality attributes of system features that extend beyond functional correctness.

This process verifies whether the system's behavior satisfies specified requirements, addressing aspects not evaluated by functional testing. Non-functional testing combines automated tests derived from use case scenarios and manual tests with documented observations.
The non-functional acceptance test description section includes the following areas:

* Content has been expanded from brief bullet points to comprehensive acceptance criteria that address overall quality.
* This section addresses usability, performance, reliability, security and privacy, compatibility, and maintainability.
* The revised wording aligns with the conventions of a formal acceptance test report.



| Scenario | Action | Expected Result | Actual Result | Status | 
| :--- | :---: | :--- | :---: | :--- |
| Navigation consistency | Navigate between child and caregiver flows using AAC entry points | Navigation is intuitive and consistent across role-based views | Caregiver actions are discoverable via dedicated entry points; child view remains clean and focused | PASS |
| Non-text content | Use icon/image-based controls in main workflows | Icons and visual elements are clear, recognizable, and intuitive | Users could complete targeted tasks using icon-driven actions without confusion | PASS |
| Contrast and visual clarity | Evaluate readability of text, icons, and controls in normal usage | Interface meets AASPIRE and WCAG-aligned contrast and clarity expectations | UI remained readable and visually clear during manual validation in target environment | PASS |
| Performance responsiveness | Perform authentication, grid interaction, and suggestion search under normal conditions | Core interactions respond without noticeable blocking | Core interactions were responsive during manual validation and test execution | PASS |
| Reliability of core flows | Repeat sign in/out, student linking, and search across refresh cycles | Core flows remain stable without data corruption or inconsistent behavior | Sign in/out, student linking, and suggestion operations behaved consistently over repeated runs | PASS |
| Security and privacy controls | Attempt caregiver-only actions before and after authentication | Restricted features require valid authentication and are protected from unauthorized access | Caregiver-only features were inaccessible until successful caregiver authentication | PASS |
 | Maintainability and testability | Review modularity, automated tests, and acceptance documentation coverage | Changes are testable, documented, and maintainable with low regression risk | Automated caregiver service tests pass and acceptance outcomes are documented in this report | PASS |
