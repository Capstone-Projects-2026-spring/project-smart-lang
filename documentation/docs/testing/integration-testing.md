---
sidebar_position: 2
---
# Integration tests

Our Integration testing will be carried out using Jest and React Testing Library. Any external input will be simulated using mock objects to ensure that tests run automatically without manual entry.

### Use Case 1 - Account Login 

<i> Testing user's successful login redirects them to the homepage. Mocking Google authentication and Database </i>

Steps:
1. The user opens the Smart Lang app, and account login is displayed on the landing page.
2. The user clicks on the login button.
3. The system redirects the user to Google’s authentication page.
4. The user enters their Google email and password.
5. The system creates a user profile in the database if the user is new.
6. If the credentials are validated and authenticated, then the user is directed to the homepage and can access the ACC board. If not, the user is notified that the credentials are invalid and login failed.

Assertions:
- Authentication function is called.
- User is redirected to homepage.
- AAC board is displayed.


### Use Case 2 - Offline Accessibility
<i>Testing Offline mode successfully loading cached data and opening the homepage. Mocking Service worker.</i>

Steps:
1. The user opens the Smart Lang app and continues in offline mode, which is displayed on the landing page.
2. The system loads any cached data stored by the Service Worker.
3. The user is directed to the homepage and can access the AAC board.

Assertions:
- Cached data is loaded.
- Homepage and AAC board are displayed.

### Use Case 3 - Sentence Creation (without suggestion) 
<i>Testing user's sentence creation with speech output. Mocking Text-to-speech.</i> 

Steps:
1. The user views words from the AAC board on the homepage.
2. The user selects a word. 
3. The system adds the selected word to the speech box.
4. The user searches for the next word on the board.
5. The user adds more words to the speech box.
6. The system continues to add each word to the speech box after the last selected word. 
7. The user presses the Speak button.
8. The system reads the complete sentence using text-to-speech.

Assertions:
- Selected words are added to the speech box in correct order.
- The speech box displays the entire sentence.
- Sentence is spoken using text-to-speech

### Use Case 4 - Sentence Creation (with suggestion)
<i>Testing user's sentence creation using suggested words with speech output. Mocking suggestion service and text-to-speech </i> 

Steps:
1. The user views words from the AAC board on the homepage.
2. The user selects a word. 
3. The system adds the selected word to the speech box.
4. The user searches for the next word on the board.
5. The user views suggested words on the “Suggested Words Box” displayed on the AAC board.
6. The user clicks and adds a word from the suggested words box.
7. The system continues to add each word to the speech box after the last selected word. 
8. The user presses the Speak button.
9. The system reads the complete sentence using text-to-speech.

Assertions:
- Suggested words are displayed.
- The suggested word selected are added to the speech box.
- The speech box displays the entire sentence.
- Sentence is spoken using text-to-speech

### Use Case 5 - Sentence Editing
<i>Testing user editing a sentence and using the speech output. Mocking Text-to-speech.</i>

Steps:
1. The user views the sentence on the speech box from the AAC board on the homepage.
2. User removes a word using the backspace deletion button.
3. The system updates the speech box to reflect the deletion.
4. The user views and searches for the next word on the board.
5. The user selects a word. 
6. The system adds the selected word to the speech box.
7. The user presses the Speak button.
8. The system reads the updated sentence using text-to-speech.

Assertions:
- The deleted word is removed from the speech box.
- The new word is added to the speech box.
- The speech box displays the updated sentence.
- Updated sentence is spoken using text-to-speech

  
### Use Case 6 - Caregiver Adds Vocabulary (without suggestion)
<i> Testing caregiver adding a new vocabulary word and the AAC board updates. Mocking database</i>

Steps:
1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Add New Word.
5. The system displays vocab words from the board.
6. The caregiver views and searches for vocab words.
7. The caregiver clicks and submits the selected word.
8. The system saves the new word to the database.
9. The system updates the AAC board with the new vocabulary word.

Assertions:
- Database saves new vocab word.
- AAC board updates with a new vocabulary word.

### Use Case 7 - Caregiver Adds Vocabulary (with suggestion)
<i> Testing caregiver adding suggested vocabulary word and the AAC board updates. Mocking suggestion service and database</i>

Steps:
1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Add New Word.
5. The system displays suggested vocab words based on the user's experience.
6. The caregiver views and searches through the suggested vocab words.
7. The caregiver clicks and submits the suggested vocabulary word
8. The system saves the new word to the database.
9. The system updates the AAC board with the new vocabulary word.

Assertions:
- Suggested vocabulary words are displayed.
- Database saves new vocab word.
- AAC board updates with a new vocabulary word.

### Use Case 8 - Caregiver Removes Vocabulary Word 
<i> Testing caregiver removing suggested vocabulary word and the AAC board updates. Mocking database</i>

Steps:
1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Remove Word.
5. The system displays the user's current AAC vocab words from the board.
6. The caregiver views and searches for the vocab word to remove.
7. The caregiver clicks and submits the selected word to remove.
8. The system saves and removes the word from the database.
9. The system updates the AAC board with the removed vocabulary word.

Assertions:
- Database removes previously saved vocab word
- AAC board updates no longer display the previous vocab word.

### Use Case 9 - Caregiver Gives Suggestions Manually
<i> Testing caregiver adding a word manually and the AAC board updates in real time. Mocks database and websocket listener</i>

Steps:
1. The Caregiver opens the Vocabulary Management page while the student is using the AAC board.
2. The system displays vocabulary management options.
3. The Caregiver selects Add Word(real-time) 
4. The system displays vocab words from the board.
5. The caregiver views and searches for vocab words from the library.
6. The caregiver clicks and submits the selected word.
7. The system saves the new word to the database.
8. The system updates the AAC board in real time with the new vocabulary word.

Assertions:
- Database saves new vocab word.
- WebSocket listener receives the new word update
- AAC board updates, adding the new word without reloading the page.
