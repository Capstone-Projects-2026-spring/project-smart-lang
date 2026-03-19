---
sidebar_position: 1
---
# Unit Tests

We plan to use Jest for unit testing due to its familiarity and overall ease of use. We are aiming for a minimum of 80% code coverage across our codebase.

**Backend Testing Strategy**
Our backend tests will focus on data integrity, API responses, and business logic. Examples include:
* Ensuring CRUD operations for suggestions correctly update the database.
* Validating that the API returns the correct number of suggestion records when a user selects a tile, and further ensuring that the count of tile usage is being incremented and decremented properly. 
* Ensuring the search API endpoint correctly filters and returns the expected payload of suggestions based on query parameters.

**Frontend Testing Strategy**
Our frontend tests will focus on component rendering, user interface state, and user interactions. Examples include:
* Verifying that picture and audio assets are properly linked and rendered within the suggestion tiles.
* Ensuring that UI styling and colors remain consistent when suggestion tiles are dynamically added or removed from the DOM.
* Confirming that caregiver linking codes are properly fetched and displayed to the user.
