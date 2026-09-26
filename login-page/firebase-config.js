// Firebase core: creates the connection to our Firebase project.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

// Firebase Authentication: manages account creation and login.
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// Cloud Firestore: stores LearnerHub user profiles and application data.
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Configuration for the LearnerHub Firebase project: ron-learn.
const firebaseConfig = {
  apiKey: "AIzaSyAmmMxhDa9LLme7uP1y-X2kMJHr3t6tT5E",
  authDomain: "ron-learn.firebaseapp.com",
  projectId: "ron-learn",
  storageBucket: "ron-learn.firebasestorage.app",
  messagingSenderId: "63585372704",
  appId: "1:63585372704:web:b75d9cc803c9b15e0c8a45",
  measurementId: "G-M7RYTEEEVS"
};

// Initialize Firebase once for the application.
const app = initializeApp(firebaseConfig);

// Create the Authentication service.
const auth = getAuth(app);

// Create the Firestore service.
const db = getFirestore(app);

// Export these so other pages can reuse the same Firebase connection.
export { app, auth, db };