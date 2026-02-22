### Use Case 1: Account Login

```mermaid
sequenceDiagram
    actor User
    participant App as Smart Lang App
    participant Auth as superlogin-client
    participant DB as CouchDB

    User->>App: Opens App
    App-->>User: Display Login / Register Options
    User->>App: Enter Username & Password
    App->>Auth: Submit Credentials
    Auth->>DB: Validate User
    DB-->>Auth: Return Auth Result

    alt Credentials Validated
        Auth-->>App: Return Session Token
        App->>DB: Sync User Data (PouchDB ↔ CouchDB)
        DB-->>App: Data Synced
        App-->>User: Redirect to Homepage (Access AAC Board)
    else Credentials Invalid
        Auth-->>App: Return Error
        App-->>User: Notify Login Failed
    end
```

1. The user opens the Smart Lang app, and login options are displayed on the landing page.
2. The user enters their username and password (or uses the app without registration in offline mode).
3. The app sends credentials to the superlogin authentication service.
4. superlogin validates the credentials against the CouchDB user database.
5. If valid, a session token is returned and the app syncs local PouchDB data with the remote CouchDB server.
6. The user is directed to the homepage and can access the AAC board. If credentials are invalid, the user is notified that login failed.


### Use Case 2: Offline Accessibility

```mermaid
sequenceDiagram
    actor User
    participant App as Smart Lang App
    participant SW as Service Worker

    User->>App: Open App (Offline)
    App-->>User: Display Offline Mode Option
    User->>App: Click "Continue in Offline Mode"
    App->>SW: Load Cached Data
    SW-->>App: Return Cached Resources
    App-->>User: Redirect to Homepage (Access AAC Board)
```

1. The user opens the Smart Lang app and continues in offline mode, which is displayed on the landing page.
2. The system loads any cached data stored by the Service Worker.
3. The user is directed to the homepage and can access the AAC board.

### Use Case 3: Sentence Creation (Without Suggestion)

```mermaid
sequenceDiagram
    actor User
    participant App as Smart Lang App (Homepage)
    participant Speech as Speech Box
    participant TTS as Text-to-Speech

    loop Add Words
        User->>App: View AAC Board
        User->>App: Select Word
        App->>Speech: Add Selected Word
        Speech-->>User: Display Word in Box
        User->>App: Search for Next Word
    end

    User->>App: Press Speak Button
    App->>TTS: Send Complete Sentence
    TTS-->>User: Read Sentence Aloud
```
1. The user views words from the AAC board on the homepage.
2. The user selects a word.
3. The system adds the selected word to the speech box.
4. The user searches for the next word on the board.
5. The user adds more words to the speech box.
6. The system continues to add each word to the speech box after the last selected word.
7. The user presses the Speak button.
8. The system reads the complete sentence using text-to-speech.

### Use Case 4: Sentence Creation (With Suggestion)

```mermaid
sequenceDiagram
    actor User
    participant App as Smart Lang App (Homepage)
    participant SBox as Suggested Words Box
    participant Speech as Speech Box
    participant TTS as Text-to-Speech

    User->>App: Select Initial Word
    App->>Speech: Add Word

    loop Add Suggested Words
        App->>App: Determine Next Suggestions
        App->>SBox: Display Suggested Words
        User->>SBox: View Suggested Words
        User->>SBox: Click Suggested Word
        SBox->>Speech: Add Word to Box
        Speech-->>User: Update Sentence Display
        User->>App: Search for/View Next Options
    end

    User->>App: Press Speak Button
    App->>TTS: Send Complete Sentence
    TTS-->>User: Read Sentence Aloud
```

1. The user views words from the AAC board on the homepage.
2. The user selects a word.
3. The system adds the selected word to the speech box.
4. The user searches for the next word on the board.
5. The user views suggested words on the “Suggested Words Box” displayed on the AAC board.
6. The user clicks and adds a word from the suggested words box.
7. The system continues to add each word to the speech box after the last selected word.
8. The user presses the Speak button.
9. The system reads the complete sentence using text-to-speech.

### Use Case 5: Sentence Editing

```mermaid
sequenceDiagram
    actor User
    participant App as Smart Lang App (Homepage)
    participant Speech as Speech Box
    participant TTS as Text-to-Speech

    User->>Speech: View Sentence
    User->>Speech: Select Word to Delete
    Speech->>Speech: Remove Selected Word
    Speech-->>User: Update Display

    opt Add Replacement Word
        User->>App: Search for Next Word
        User->>App: Select Word
        App->>Speech: Add Selected Word
    end

    User->>App: Press Speak Button
    App->>TTS: Send Updated Sentence
    TTS-->>User: Read Sentence Aloud
```

1. The user views the sentence on the speech box from the AAC board on the homepage.
2. The user selects a word to be deleted.
3. The system deletes the selected word from the speech box.
4. The user views and searches for the next word on the board.
5. The user selects a word.
6. The system adds the selected word to the speech box.
7. The user presses the Speak button.
8. The system reads the updated sentence using text-to-speech.


### Use Case 6: Caregiver Adds Vocabulary (Without Suggestion)

```mermaid
sequenceDiagram
    actor Caregiver
    participant App as Smart Lang App
    participant VM as Vocab Management
    participant DB as Database

    Caregiver->>App: Click Caregiver Page
    App-->>Caregiver: Display Management Options
    Caregiver->>VM: Click "Vocabulary Management"
    VM-->>Caregiver: Show Options
    Caregiver->>VM: Select "Add New Word"
    VM-->>Caregiver: Display Board Vocab Words
    Caregiver->>VM: Search and Select Word
    Caregiver->>VM: Submit Selected Word
    VM->>DB: Save New Word
    DB-->>VM: Confirm Save
    VM->>App: Update AAC Board
    App-->>Caregiver: Display Updated Board
```
1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Add New Word.
5. The system displays vocab words from the board.
6. The caregiver views and searches for vocab words.
7. The caregiver clicks and submits the selected word.
8. The system saves the new word to the database.
9. The system updates the AAC board with the new vocabulary word.

### Use Case 7: Caregiver Adds Vocabulary (With Suggestion)

```mermaid
sequenceDiagram
    actor Caregiver
    participant App as Smart Lang App
    participant VM as Vocab Management
    participant DB as Database

    Caregiver->>App: Click Caregiver Page (or Trigger via Suggestion)
    App-->>Caregiver: Display Management Options
    Caregiver->>VM: Click "Vocabulary Management"
    VM-->>Caregiver: Show Options
    Caregiver->>VM: Select "Add New Word"
    VM-->>Caregiver: Display Suggested Words (Based on User Experience)
    Caregiver->>VM: Search/View Suggestions
    Caregiver->>VM: Submit Suggested Word
    VM->>DB: Save New Word
    DB-->>VM: Confirm Save
    VM->>App: Update AAC Board
    App-->>Caregiver: Display Updated Board
```
1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Add New Word.
5. The system displays suggested vocab words based on the user's experience.
6. The caregiver views and searches through the suggested vocab words.
7. The caregiver clicks and submits the suggested vocabulary word
8. The system saves the new word to the database.
9. The system updates the AAC board with the new vocabulary word.

### Use Case 8: Caregiver Removes Vocabulary

```mermaid
sequenceDiagram
    actor Caregiver
    participant App as Smart Lang App
    participant VM as Vocab Management
    participant DB as Database

    Caregiver->>App: Click Caregiver Page
    App-->>Caregiver: Display Management Options
    Caregiver->>VM: Click "Vocabulary Management"
    VM-->>Caregiver: Show Options
    Caregiver->>VM: Select "Remove Word"
    VM-->>Caregiver: Display Current User Vocab
    Caregiver->>VM: Search/Select Word to Remove
    Caregiver->>VM: Submit Removal
    VM->>DB: Delete/Remove Word
    DB-->>VM: Confirm Removal
    VM->>App: Update AAC Board
    App-->>Caregiver: Display Updated Board
```
1. The caregiver clicks on the Caregiver page.
2. The system displays the caregiver page and the vocabulary management button.
3. The caregiver clicks on the vocabulary management button.
4. The caregiver selects Remove Word.
5. The system displays the user's current AAC vocab words from the board.
6. The caregiver views and searches for the vocab word to remove.
7. The caregiver clicks and submits the selected word to remove.
8. The system saves and removes the word from the database.
9. The system updates the AAC board with the removed vocabulary word.

