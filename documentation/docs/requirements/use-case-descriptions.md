---
sidebar_position: 5
---

# Use-case descriptions

### Use Case 1 - Account Login 

<i>As a user, I want to log into the Smart Lang app so that I can save my data and use my account across different devices.</i>
<i>Triggering Event: User opens Smart Lang app and clicks Login</i>

1. The user opens the Smart Lang app, and account login is displayed on the landing page.
2. The user clicks on the login button 
3. The system redirects the user to Google’s authentication page.
4. The user enters their Google email and password.
5. The system creates a user profile in the database if the user is new.
6. If the credentials are validated and authenticated, then the user is directed to the homepage and can access the ACC board. If not, the user is notified that the credentials are invalid and login failed. 
