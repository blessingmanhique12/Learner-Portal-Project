# Part 2 - Map Your Actual Application

| Feature | Classification | Justification |
|---|---|---|
| Registration | Both | The client displays the registration form and collects user input; the server (or cloud service like Firebase Auth) creates the account and securely stores the credentials. |
| Login | Both | The client submits the entered credentials via the UI; the server verifies them against stored (hashed) credentials before granting access. |
| Form validation | Both | The client performs instant validation (empty fields, correct format) for a fast user experience; the server re-validates the same data because client-side checks can be bypassed or manipulated. |
| Displaying the dashboard | Client Side | Rendering the dashboard layout and UI elements happens in the browser/app on the user's device. |
| Creating a learning task | Both | The client collects task details through a form; the server processes the request and saves the new task to the database. |
| Retrieving tasks | Server/Cloud Service | Task data is stored in the database, so only the server/cloud service can query and return it to the client. |
| Updating a task | Both | The client triggers the edit and sends the updated data; the server applies the change and saves it to the database. |
| Deleting a task | Both | The client initiates the delete action; the server removes the record from the database. |
| Calculating learner progress | Server/Cloud Service | Progress should be calculated from trusted, authoritative data on the server so it cannot be faked or tampered with on the client. |
| Filtering/searching tasks | Both | Filtering can be done client-side on already-loaded data for speed, or server-side when querying large datasets that aren't fully loaded on the client. |
| Storing learner data | Server/Cloud Service | Persistent data storage belongs in a database or cloud service, not on the user's device. |
| Authentication | Server/Cloud Service | Authentication must be verified by a trusted backend/service; it can never be trusted from the client alone. |
| Database security/access rules | Server/Cloud Service | Access rules (e.g., Firebase security rules) are defined and enforced on the server/cloud service by design. |
| Updating the DOM | Client Side | The DOM (Document Object Model) is a browser-side structure, so updating it is purely a client-side task. |
| Displaying success/error messages | Client Side | Even when triggered by a server response, the actual rendering of the message in the UI happens on the client. |


# Part 3 - Design the SkillsTrack System Architecture

Overview
SkillsTrack is a client-driven web application built on HTML, CSS, and JavaScript in the browser, with Firebase supplying authentication and data storage as remote services. There is no custom backend server: the browser communicates directly with Firebase over the Firebase SDK and/or its REST API. The diagram below traces two concrete flows through the system — a learner signing in, and a learner creating a task — showing exactly where processing happens on the client versus the server, and how each request and response is handled.



