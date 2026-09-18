// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCdAlMP5TeSa1FPwwqV2FfZEAxTgJxuVDw",
  authDomain: "studyflow-f62b2.firebaseapp.com",
  projectId: "studyflow-f62b2",
  storageBucket: "studyflow-f62b2.firebasestorage.app",
  messagingSenderId: "401259624499",
  appId: "1:401259624499:web:97b438571afcf7dfafcb46",
  measurementId: "G-P7M2VQE89F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);