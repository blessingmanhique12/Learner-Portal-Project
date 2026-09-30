import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCdAlMP5TeSa1FPwwqV2FfZEAxTgJxuVDw",
    authDomain: "studyflow-f62b2.firebaseapp.com",
    projectId: "studyflow-f62b2",
    storageBucket: "studyflow-f62b2.firebasestorage.app",
    messagingSenderId: "401259624499",
    appId: "1:401259624499:web:97b438571afcf7dfafcb46",
    measurementId: "G-P7M2VQE89F"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);