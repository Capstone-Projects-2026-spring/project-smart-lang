---
sidebar_position: 5
---

# Use-case descriptions

### Use Case 1 - Account Login 

<i>As a user, I want to log into the Smart Lang app so that I can save my data and use my account across different devices.</i>
<br>
<i>Triggering Event: User opens Smart Lang app and clicks Login</i>

1. The user opens the Smart Lang app, and account login is displayed on the landing page.
2. The user clicks on the login button.
3. The system redirects the user to Google’s authentication page.
4. The user enters their Google email and password.
5. The system creates a user profile in the database if the user is new.
6. If the credentials are validated and authenticated, then the user is directed to the homepage and can access the ACC board. If not, the user is notified that the credentials are invalid and login failed. 

### Use Case 2 - Offline Accessibility
<i>As a user, I want to access the Smart Lang app when I have no internet connection </i>
<br>
<i>Triggering Event: User opens Smart Lang app offline, and clicks continue in offline mode</i>

1. The user opens the Smart Lang app and continues in offline mode, which is displayed on the landing page.
2. The system loads any cached data stored by the Service Worker.
3. The user is directed to the homepage and can access the AAC board.

### Use Case 3 - Sentence Creation (without suggestion) 
<i>As a user, I want to create a message using just the vocabulary displayed on the AAC device. </i> 
<br>
<i>Triggering Event: User clicks on a vocab word to add to the speech box from the board </i> 

1. The user views words from the AAC board on the homepage.
2. The user selects a word. 
3. The system adds the selected word to the speech box.
4. The user searches for the next word on the board.
5. The user adds more words to the speech box.
6. The system continues to add each word to the speech box after the last selected word. 
7. The user presses the Speak button.
8. The system reads the complete sentence using text-to-speech.

### Use Case 4 - Sentence Creation (with suggestion)
<i>As a user, I want to create a message using the suggested words feature displayed on the AAC device. </i> 
<br>
<i>Triggering Event: User clicks on a suggested vocab word to add to the speech box from the board </i> 

1. The user views words from the AAC board on the homepage.
2. The user selects a word. 
3. The system adds the selected word to the speech box.
4. The user searches for the next word on the board.
5. The user views suggested words on the “Suggested Words Box” displayed on the AAC board.
6. The user clicks and adds a word from the suggested words box.
7. The system continues to add each word to the speech box after the last selected word. 
8. The user presses the Speak button.
9. The system reads the complete sentence using text-to-speech.

### Use Case 5 - Sentence Editing
<i>As a user, I want to edit my message in the speech box.</i>
<br>
<i>Triggering Event: User deletes a vocab word from the speech box on the board </i>

1. The user views the sentence on the speech box from the AAC board on the homepage.
2. The user selects a word to be deleted. 
3. The system deletes the selected word from the speech box.
4. The user views and searches for the next word on the board.
5. The user selects a word. 
6. The system adds the selected word to the speech box.
7. The user presses the Speak button.
8. The system reads the updated sentence using text-to-speech.

### Use Case 6 - Caregiver Adds Vocabulary (without suggestion)
<i> As a caregiver, I want to add new vocabulary words so that the user can express more ideas on the AAC board. </i>
<br>
<i>Triggering Event: Caregiver realizes they should include a word and clicks on the vocabulary management page. </i>

1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Add New Word.
5. The system displays vocab words from the board.
6. The caregiver views and searches for vocab words.
7. The caregiver clicks and submits the selected word.
8. The system saves the new word to the database.
9. The system updates the AAC board with the new vocabulary word.

### Use Case 7 - Caregiver Adds Vocabulary (with suggestion)
<i> As a caregiver, I want to add new vocabulary words using the suggestion feature so that the user can express more ideas on the AAC board. </i>
<br>
<i>Triggering Event: Caregiver clicks on a suggested word to add through the vocabulary management page. </i>

1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Add New Word.
5. The system displays suggested vocab words based on the user's experience.
6. The caregiver views and searches through the suggested vocab words.
7. The caregiver clicks and submits the suggested vocabulary word
8. The system saves the new word to the database.
9. The system updates the AAC board with the new vocabulary word.

### Use Case 8 - Caregiver Removes Vocabulary Word 
<i> As a caregiver, I want to remove unused vocabulary words so that the user has a simple board. </i>
<br>
<i>Triggering Event: Caregiver realizes user doesn't use a vocab word and goes to remove it through the vocabulary management page. </i>

1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Remove Word.
5. The system displays the user's current AAC vocab words from the board.
6. The caregiver views and searches for the vocab word to remove.
7. The caregiver clicks and submits the selected word to remove.
8. The system saves and removes the word from the database.
9. The system updates the AAC board with the removed vocabulary word.





