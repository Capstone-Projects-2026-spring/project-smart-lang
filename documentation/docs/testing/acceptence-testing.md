---
sidebar_position: 3
---
# Acceptance test

Non-functional acceptance testing assesses quality attributes of system features that extend beyond functional correctness.

| Test ID | Scenario | Action | Expected Result |
| :--- | :---: | :---: | ---: |
| 1 | Deleting word tiles | User selects back button or trash button | A word tile is removed from the sentence bar with the backspace button or all tiles currently in the sentence bar is removed with the trash button |
| 2 | Selecting a word tile and constructing a sentence | User selects any word tile from the AAC board with audio output | The word tile appears on the sentence bar and the word associated with the tile will be audibly played |
| 3 | Navigating the AAC board | User selects category tiles and back button | Word tiles associated with the category is displayed and taken back to the default tile grid |
| 4 | Using the next-word suggestion bar | User sees the next-word suggestion bar updating as they are constructing a sentence | The next-word suggestion bar will change based on bigrams and trigrams they have used previously as they add words to the sentence bar. |
| 5 | Audio quality | User selects a word tile or play word to speech button | Audio is clear and played within 1 second of selecting a word tile or the word to speech button. |

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
