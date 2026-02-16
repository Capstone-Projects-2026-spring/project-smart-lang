---
sidebar_position: 4
---

# Features and Requirements

## Functional Requirements
    
* User will be able to use AAC Grid upon opening interface
  * The user will be able to see the constructed sentence built from their selected word tiles.
  * The user will be able to delete word tiles from the sentence bar or clear the entire sentence bar.
  * The system will use text to speech and user will be able to play audio output of the constructed sentence.
  * The system will allow for users to have multiple saved boards and have category-based navigation between them.

* The system will have next word suggestions
  * The system will track word tile usage and unused word tiles.
  * User will be able to regenerate next word suggestions.
    
* Caregiver will have tools for vocabulary management 
  * Caregivers will be able to add custom word tiles or remove word tiles.
  * Caregivers will be able to select word tiles to add to grid from vocabulary library.
  * Caregivers will be able to give personalized word suggestions to next word suggestion generator.

* Users will be able to create a user profile with an email and password.
  * Users are not required to have a registered account.
  * Accounts will save user data and can be accessed from different devices.
  
### Non-Functional Requirements

* The app will have a simplified userflow
  * Users must be able to add a word, delete a word, clear a sentence, and speak a sentence in ≤2 taps each from the primary screen.

* When a user presses the speech button for audio output, the audio will play slowly and clearly and will be uninterrupted until the sentence is complete.
  * Speech takes place within 3 seconds of the button being tapped.

* A user account is not required for sentence formation and speech.

* The app will support text scaling without clipping or overlapping to ensure readability.
