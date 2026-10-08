import { signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { auth } from "../../FirebaseAuth/firebase.js";

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("learnerHubUser");
    window.location.href = "../../login-page/login.html";
  } catch (error) {
    console.error("Logout failed:", error);
    window.alert("Could not sign out. Please try again.");
  }
});
