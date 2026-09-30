import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { auth, db } from "../FirebaseAuth/firebase.js";


/*
 * Dashboard elements
 */
const loginPath = '../login-page/login.html';

const welcome = document.getElementById('facilitatorWelcome');
const roleValue = document.getElementById('roleValue');
const message = document.getElementById('dashboardMessage');
const logoutButton = document.getElementById('logoutButton');

const learnerList = document.getElementById('learnerList');
const learnerCount = document.getElementById('learnerCount');


/*
 * Display a dashboard message
 */
const setMessage = (text, type = '') => {
        if (!message) {
                return;
        }

        message.textContent = text;
        message.className = type
                ? `message ${type}`
                : 'message';
};


/*
 * Send the user back to the login page
 */
const redirectToLogin = () => {
        localStorage.removeItem('learnerHubUser');
        window.location.href = loginPath;
};


/*
 * Display the learners on the dashboard
 */
const displayLearners = (learners) => {

        if (!learnerList) {
                return;
        }

        learnerList.innerHTML = '';

        if (learners.length === 0) {
                learnerList.innerHTML = `
                        <p class="muted">
                                No learners are currently registered.
                        </p>
                `;

                if (learnerCount) {
                        learnerCount.textContent = '0 learners';
                }

                return;
        }


        if (learnerCount) {
                learnerCount.textContent =
                        `${learners.length} learner${learners.length === 1 ? '' : 's'}`;
        }


        learners.forEach((learner) => {

                const learnerCard = document.createElement('article');

                learnerCard.className = 'learner-card';


                const name = document.createElement('h3');

                name.textContent =
                        learner.displayName ||
                        learner.username ||
                        'Unnamed learner';


                const email = document.createElement('p');

                email.textContent =
                        learner.email || 'No email available';


                const programme = document.createElement('p');

                programme.textContent =
                        learner.programme || 'Programme not specified';


                learnerCard.appendChild(name);
                learnerCard.appendChild(email);
                learnerCard.appendChild(programme);

                learnerList.appendChild(learnerCard);
        });
};


/*
 * Load all learner profiles from Firestore
 *
 * IMPORTANT:
 * We specifically request documents where:
 *
 * role == "learner"
 *
 * Therefore facilitator profiles are not included
 * in the learner list.
 */
const loadLearners = async () => {

        if (!learnerList) {
                return;
        }

        learnerList.innerHTML = `
                <p class="muted">
                        Loading learners...
                </p>
        `;


        const learnersQuery = query(
                collection(db, 'registrations'),
                where('role', '==', 'learner')
        );


        const learnersSnapshot = await getDocs(learnersQuery);


        const learners = learnersSnapshot.docs.map((learnerDocument) => ({
                id: learnerDocument.id,
                ...learnerDocument.data()
        }));


        displayLearners(learners);
};


/*
 * Check Firebase authentication and facilitator role
 */
onAuthStateChanged(auth, async (user) => {

        /*
         * No authenticated user
         */
        if (!user) {
                redirectToLogin();
                return;
        }


        try {

                /*
                 * Get the user's profile directly from Firestore.
                 *
                 * We do NOT trust localStorage for the user's role.
                 */
                const profileSnapshot = await getDoc(
                        doc(db, 'registrations', user.uid)
                );


                /*
                 * Profile does not exist
                 */
                if (!profileSnapshot.exists()) {

                        await signOut(auth);

                        redirectToLogin();

                        return;
                }


                const profile = profileSnapshot.data();


                /*
                 * User must actually be a facilitator.
                 */
                if (profile.role !== 'facilitator') {

                        await signOut(auth);

                        redirectToLogin();

                        return;
                }


                /*
                 * Determine the facilitator's display name.
                 */
                const displayName =
                        profile.displayName ||
                        profile.username ||
                        user.displayName ||
                        user.email;


                /*
                 * Display facilitator information.
                 */
                if (welcome) {
                        welcome.textContent =
                                `Welcome, ${displayName}.`;
                }


                if (roleValue) {
                        roleValue.textContent =
                                profile.role;
                }


                /*
                 * Store session information for UI purposes.
                 *
                 * This is NOT used as the security check.
                 */
                localStorage.setItem(
                        'learnerHubUser',
                        JSON.stringify({
                                uid: user.uid,
                                email: user.email,
                                displayName,
                                role: profile.role,
                                programme: profile.programme || ''
                        })
                );


                /*
                 * Now load the learners.
                 */
                await loadLearners();


                setMessage('Firebase session connected.');

        } catch (error) {

                console.error(
                        'Facilitator dashboard error:',
                        error
                );

                setMessage(
                        error.message ||
                        'Could not load the facilitator dashboard.',
                        'error'
                );
        }
});


/*
 * Sign out
 */
if (logoutButton) {

        logoutButton.addEventListener('click', async () => {

                try {

                        await signOut(auth);

                        redirectToLogin();

                } catch (error) {

                        console.error(
                                'Logout error:',
                                error
                        );

                        setMessage(
                                'Could not sign out. Please try again.',
                                'error'
                        );
                }
        });
}