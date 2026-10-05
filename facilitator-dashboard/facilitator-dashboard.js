import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
        addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
        serverTimestamp,
        updateDoc,
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
const learnerDetail = document.getElementById('learnerDetail');
const bookingForm = document.getElementById('bookingForm');
const assessmentAssignmentForm = document.getElementById('assessmentAssignmentForm');
const bookingDateInput = document.getElementById('bookingDate');
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
if (bookingDateInput) bookingDateInput.min = today.toISOString().slice(0, 10);
const stageDefinitions = [
        { key: 'html', label: 'Stage 1: HTML Quiz' },
        { key: 'rps', label: 'Stage 2: Rock, Paper, Scissors' },
        { key: 'css', label: 'Stage 3: CSS Quiz' },
        { key: 'chess', label: 'Stage 4: Chess' },
        { key: 'javascript', label: 'Stage 5: JavaScript Quiz' }
];

let facilitatorId = null;
let selectedLearner = null;
let unsubscribeAssessmentAssignments = null;
const learnerActivityCache = new Map();


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


const stageLabel = (stage) =>
        stageDefinitions.find((item) => item.key === stage)?.label || stage;

const dateToMillis = (dateValue) => {
        if (!dateValue) return 0;
        if (typeof dateValue.toMillis === 'function') return dateValue.toMillis();
        const parsedDate = new Date(dateValue).getTime();
        return Number.isFinite(parsedDate) ? parsedDate : 0;
};

const formatDate = (dateValue) => {
        const timestamp = dateToMillis(dateValue);
        return timestamp ? new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
        }).format(timestamp) : 'Date not recorded';
};

const loadLearnerActivity = async (learner) => {
        const [progressSnapshot, scoresSnapshot] = await Promise.all([
                getDoc(doc(db, 'learnerProgress', learner.id)),
                getDocs(query(collection(db, 'scores'), where('userId', '==', learner.id)))
        ]);

        const progressData = progressSnapshot.exists() ? progressSnapshot.data() : {};
        const games = progressData.games || {};
        const scores = scoresSnapshot.docs
                .map((scoreDocument) => ({ id: scoreDocument.id, ...scoreDocument.data() }))
                .sort((first, second) => dateToMillis(second.completedAt) - dateToMillis(first.completedAt));
        const latestByStage = new Map();

        scores.forEach((score) => {
                if (score.stage !== 'skills-assessment' && !latestByStage.has(score.stage)) {
                        latestByStage.set(score.stage, score);
                }
        });

        const completedStages = stageDefinitions.filter((stage) => games[stage.key] === true).length;
        const unresolvedFailure = [...latestByStage.entries()].some(([stage, score]) =>
                score.passed === false && games[stage] !== true
        );
        const accountCreatedAt = dateToMillis(learner.createdAt);
        const hasBeenInactive = completedStages === 0
                && scores.length === 0
                && accountCreatedAt > 0
                && Date.now() - accountCreatedAt >= 7 * 24 * 60 * 60 * 1000;
        const needsSupport = unresolvedFailure || hasBeenInactive;
        const latestAssessment = scores.find((score) => score.assessment === true
                || score.stage === 'skills-assessment');

        return {
                progress: { ...progressData, games },
                scores,
                completedStages,
                latestByStage,
                latestAssessment,
                needsSupport,
                supportLabel: needsSupport ? 'Needs support' : completedStages === stageDefinitions.length
                        ? 'Stages complete'
                        : scores.length ? 'In progress' : 'No activity'
        };
};

const makeSupportBadge = (activity) => {
        const badge = document.createElement('span');
        badge.className = `support-badge ${activity.needsSupport ? 'needs-support' : 'on-track'}`;
        badge.textContent = activity.supportLabel;
        return badge;
};

const makeOverallProgress = (activity) => {
        const progress = document.createElement('div');
        progress.className = 'overall-progress';

        const label = document.createElement('span');
        label.textContent = 'Overall progress';
        const percentage = Math.round((activity.completedStages / stageDefinitions.length) * 100);
        const value = document.createElement('strong');
        value.textContent = `${percentage}%`;

        const bar = document.createElement('progress');
        bar.className = 'overall-progress-bar';
        bar.max = stageDefinitions.length;
        bar.value = activity.completedStages;
        bar.setAttribute(
                'aria-label',
                `Overall programme progress: ${activity.completedStages} of ${stageDefinitions.length} stages complete`
        );

        progress.append(label, value, bar);
        return progress;
};

const displayLearners = (learners) => {
        if (!learnerList) return;
        learnerList.replaceChildren();

        if (learnerCount) learnerCount.textContent = `${learners.length} learner${learners.length === 1 ? '' : 's'}`;
        const totalElement = document.getElementById('learnerTotal');
        const supportElement = document.getElementById('supportNeededTotal');
        if (totalElement) totalElement.textContent = String(learners.length);
        if (supportElement) {
                supportElement.textContent = String(learners.filter((learner) => learner.activity.needsSupport).length);
        }

        if (learners.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'muted';
                emptyMessage.textContent = 'No learners are currently registered.';
                learnerList.appendChild(emptyMessage);
                return;
        }

        learners.forEach((learner) => {
                const learnerCard = document.createElement('article');
                learnerCard.className = 'learner-card';

                const cardHeading = document.createElement('div');
                cardHeading.className = 'learner-card-heading';
                const name = document.createElement('h3');
                name.textContent = learner.displayName || learner.username || 'Unnamed learner';
                cardHeading.append(name, makeSupportBadge(learner.activity));

                const email = document.createElement('p');
                email.textContent = learner.email || 'No email available';
                const programme = document.createElement('p');
                programme.textContent = learner.programme || 'Programme not specified';
                const progressSummary = document.createElement('p');
                progressSummary.className = 'muted';
                progressSummary.textContent = `${learner.activity.completedStages} of ${stageDefinitions.length} stages complete · ${learner.activity.scores.length} recorded activities`;
                const overallProgress = makeOverallProgress(learner.activity);
                const viewButton = document.createElement('button');
                viewButton.type = 'button';
                viewButton.className = 'learner-open-button';
                viewButton.textContent = 'View learner activity';
                viewButton.addEventListener('click', () => openLearnerDetails(learner));

                learnerCard.append(cardHeading, email, programme, progressSummary, overallProgress, viewButton);
                learnerList.appendChild(learnerCard);
        });
};

const renderStageProgress = (activity, selectedStageKey = '') => {
        const container = document.getElementById('stageProgressList');
        container.replaceChildren();

        stageDefinitions
                .filter((stage) => !selectedStageKey || stage.key === selectedStageKey)
                .forEach((stage) => {
                const row = document.createElement('li');
                row.className = 'stage-progress-row';
                const number = document.createElement('span');
                number.className = 'stage-number';
                number.textContent = String(stageDefinitions.indexOf(stage) + 1).padStart(2, '0');
                const name = document.createElement('span');
                name.textContent = stage.label;
                const latestAttempt = activity.latestByStage.get(stage.key);
                const status = document.createElement('strong');

                if (activity.progress.games[stage.key] === true) {
                        status.textContent = latestAttempt
                                ? `Complete · latest ${latestAttempt.percentage}%`
                                : 'Complete';
                        status.className = 'stage-complete';
                } else if (latestAttempt) {
                        status.textContent = `Incomplete · latest ${latestAttempt.percentage}%`;
                        status.className = latestAttempt.passed === false ? 'stage-failed' : 'stage-pending';
                } else {
                        status.textContent = 'Not started';
                        status.className = 'stage-pending';
                }

                const printButton = document.createElement('button');
                printButton.type = 'button';
                printButton.className = 'stage-print-button';
                printButton.textContent = 'Print PDF';
                printButton.setAttribute('aria-label', `Print ${stage.label} report`);
                printButton.addEventListener('click', () => printLearnerReport(stage.key));

                row.append(number, name, status, printButton);
                container.appendChild(row);
        });
};

const showLearnerDetailSection = (sectionId) => {
        document.querySelectorAll('.learner-view-section').forEach((section) => {
                section.hidden = section.id !== sectionId;
        });
};

const escapeReportValue = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const printLearnerReport = (stageKey = null) => {
        if (!selectedLearner?.activity) {
                setMessage('Select a learner and load their activity before printing a report.', 'error');
                return;
        }

        const activity = selectedLearner.activity;
        const learnerName = selectedLearner.displayName || selectedLearner.username || 'Unnamed learner';
        const learnerEmail = selectedLearner.email || 'No email available';
        const stage = stageKey ? stageDefinitions.find((item) => item.key === stageKey) : null;
        const reportTitle = stage ? `${stage.label} Report` : 'Full Learner Progress Report';
        const reportScores = stage
                ? activity.scores.filter((score) => score.stage === stage.key)
                : activity.scores;
        const reportStages = stage ? stageDefinitions.filter((item) => item.key === stage.key) : stageDefinitions;
        const scoreRows = reportScores.length
                ? reportScores.map((score) => `
                        <tr>
                                <td>${escapeReportValue(score.game || stageLabel(score.stage))}</td>
                                <td>${escapeReportValue(score.score ?? 0)} / ${escapeReportValue(score.maxScore ?? 0)}</td>
                                <td>${escapeReportValue(score.percentage ?? 0)}%</td>
                                <td>${escapeReportValue(score.assessment || score.stage === 'skills-assessment'
                                        ? 'Assessment'
                                        : score.passed === true ? 'Passed' : score.passed === false ? 'Failed' : 'Attempt')}</td>
                                <td>${escapeReportValue(formatDate(score.completedAt))}</td>
                        </tr>
                `).join('')
                : '<tr><td colspan="5">No recorded attempts.</td></tr>';
        const stageRows = reportStages.map((item) => {
                const latestAttempt = activity.latestByStage.get(item.key);
                const completed = activity.progress.games[item.key] === true;
                const status = completed
                        ? `Complete${latestAttempt ? ` · latest score ${latestAttempt.percentage}%` : ''}`
                        : latestAttempt ? `Incomplete · latest score ${latestAttempt.percentage}%` : 'Not started';
                return `<tr><td>${escapeReportValue(item.label)}</td><td>${escapeReportValue(status)}</td></tr>`;
        }).join('');
        const reportBookings = stage ? [] : (selectedLearner.bookings || []);
        const bookingRows = reportBookings.length
                ? reportBookings.map((booking) => `
                        <tr>
                                <td>${escapeReportValue(booking.topic || 'Support session')}</td>
                                <td>${escapeReportValue(booking.preferredDate || 'To be arranged')}</td>
                                <td>${escapeReportValue(booking.status || 'pending')}</td>
                                <td>${escapeReportValue(booking.notes || 'No notes')}</td>
                        </tr>
                `).join('')
                : '<tr><td colspan="4">No support sessions recorded.</td></tr>';

        const printTarget = document.getElementById('printReport');
        printTarget.innerHTML = `
                <header class="print-report-header">
                        <p class="print-report-brand">LearnerHub · Facilitator Report</p>
                        <h1>${escapeReportValue(reportTitle)}</h1>
                        <p><strong>Learner:</strong> ${escapeReportValue(learnerName)}</p>
                        <p><strong>Email:</strong> ${escapeReportValue(learnerEmail)}</p>
                        <p><strong>Programme:</strong> ${escapeReportValue(selectedLearner.programme || 'Not specified')}</p>
                        <p><strong>Generated:</strong> ${escapeReportValue(formatDate(new Date()))}</p>
                </header>
                <section>
                        <h2>${stage ? 'Stage status' : 'Programme stage progress'}</h2>
                        <table><thead><tr><th>Stage</th><th>Status</th></tr></thead><tbody>${stageRows}</tbody></table>
                </section>
                <section>
                        <h2>${stage ? 'Stage attempts' : 'Game and assessment activity'}</h2>
                        <table><thead><tr><th>Activity</th><th>Score</th><th>Percentage</th><th>Result</th><th>Date</th></tr></thead><tbody>${scoreRows}</tbody></table>
                </section>
                ${stage ? '' : `
                        <section>
                                <h2>Support bookings</h2>
                                <table><thead><tr><th>Topic</th><th>Preferred date</th><th>Status</th><th>Notes</th></tr></thead><tbody>${bookingRows}</tbody></table>
                        </section>
                `}
                <footer class="print-report-footer">Confidential learner progress record</footer>
        `;

        const previousTitle = document.title;
        document.title = `${learnerName} - ${reportTitle}`;
        printTarget.hidden = false;
        window.addEventListener('afterprint', () => {
                printTarget.hidden = true;
                printTarget.replaceChildren();
                document.title = previousTitle;
        }, { once: true });
        window.print();
};

const renderActivities = (scores) => {
        const container = document.getElementById('learnerActivityList');
        container.replaceChildren();

        if (scores.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'muted';
                empty.textContent = 'No game or assessment attempts have been recorded.';
                container.appendChild(empty);
                return;
        }

        scores.forEach((score) => {
                const item = document.createElement('article');
                item.className = 'activity-item';
                const heading = document.createElement('div');
                heading.className = 'activity-item-heading';
                const title = document.createElement('h4');
                title.textContent = score.game || stageLabel(score.stage);
                const result = document.createElement('strong');
                result.textContent = score.assessment || score.stage === 'skills-assessment'
                        ? 'Assessment'
                        : score.passed === true ? 'Passed' : score.passed === false ? 'Failed' : 'Attempt';
                result.className = score.passed === false ? 'stage-failed' : 'stage-complete';
                heading.append(title, result);
                const detail = document.createElement('p');
                detail.textContent = `${score.score ?? 0} / ${score.maxScore ?? 0} · ${score.percentage ?? 0}% · ${formatDate(score.completedAt)}`;
                item.append(heading, detail);
                container.appendChild(item);
        });
};

const renderBookings = (bookings) => {
        const container = document.getElementById('learnerBookingsList');
        container.replaceChildren();

        if (bookings.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'muted';
                empty.textContent = 'No support sessions booked yet.';
                container.appendChild(empty);
                return;
        }

        bookings.forEach((booking) => {
                const item = document.createElement('article');
                item.className = 'activity-item';
                const heading = document.createElement('div');
                heading.className = 'activity-item-heading';
                const topic = document.createElement('h4');
                topic.textContent = booking.topic || 'Support session';
                const status = document.createElement('strong');
                status.textContent = booking.status || 'pending';
                heading.append(topic, status);
                const date = document.createElement('p');
                date.textContent = `${booking.preferredDate || 'Date to be confirmed'}${booking.notes ? ` · ${booking.notes}` : ''}`;
                item.append(heading, date);
                if (booking.status !== 'completed') {
                        const completeButton = document.createElement('button');
                        completeButton.type = 'button';
                        completeButton.className = 'complete-booking-button';
                        completeButton.textContent = 'Mark session complete';
                        completeButton.addEventListener('click', () => completeFacilitatorBooking(booking, completeButton));
                        item.appendChild(completeButton);
                }
                container.appendChild(item);
        });
};

const completeFacilitatorBooking = async (booking, button) => {
        if (!selectedLearner || !facilitatorId) return;

        button.disabled = true;
        try {
                await updateDoc(doc(db, 'bookings', booking.id), {
                        status: 'completed',
                        completedAt: serverTimestamp(),
                        completedBy: facilitatorId
                });
                setMessage('Support session marked complete.', 'success');
                await openLearnerDetails(selectedLearner);
        } catch (error) {
                console.error('Could not complete the booked session:', error);
                button.disabled = false;
                setMessage(error.code === 'permission-denied'
                        ? 'Only the booked learner or assigned facilitator can complete this session.'
                        : 'Could not complete this session. Check your connection and try again.', 'error');
        }
};

const renderAssessmentAssignments = (assignments) => {
        const container = document.getElementById('assessmentAssignmentsList');
        container.replaceChildren();

        if (assignments.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'muted';
                empty.textContent = 'No assessments have been assigned to this learner.';
                container.appendChild(empty);
                return;
        }

        assignments.forEach((assignment) => {
                const item = document.createElement('article');
                item.className = 'activity-item';
                const heading = document.createElement('div');
                heading.className = 'activity-item-heading';
                const title = document.createElement('h4');
                title.textContent = 'Software Development Skills Assessment';
                const status = document.createElement('strong');
                status.textContent = assignment.status === 'completed' ? 'Completed' : 'Awaiting completion';
                status.className = assignment.status === 'completed' ? 'stage-complete' : 'stage-pending';
                heading.append(title, status);
                const assignedDate = document.createElement('p');
                assignedDate.textContent = `Assigned ${formatDate(assignment.assignedAt)}`;
                item.append(heading, assignedDate);

                if (assignment.status === 'completed') {
                        const completedDate = document.createElement('p');
                        completedDate.textContent = `Completed ${formatDate(assignment.completedAt)}`;
                        item.appendChild(completedDate);
                }

                container.appendChild(item);
        });
};

const loadAssessmentAssignments = async (learner) => {
        const snapshot = await getDocs(query(
                collection(db, 'assessmentAssignments'),
                where('userId', '==', learner.id)
        ));
        const assignments = snapshot.docs
                .map((assignmentDocument) => ({ id: assignmentDocument.id, ...assignmentDocument.data() }))
                .sort((first, second) => dateToMillis(second.assignedAt) - dateToMillis(first.assignedAt));
        renderAssessmentAssignments(assignments);
};

const subscribeToAssessmentAssignments = (learner) => {
        if (unsubscribeAssessmentAssignments) unsubscribeAssessmentAssignments();

        const assignmentsQuery = query(
                collection(db, 'assessmentAssignments'),
                where('userId', '==', learner.id)
        );
        unsubscribeAssessmentAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
                const assignments = snapshot.docs
                        .map((assignmentDocument) => ({ id: assignmentDocument.id, ...assignmentDocument.data() }))
                        .sort((first, second) => dateToMillis(second.assignedAt) - dateToMillis(first.assignedAt));
                renderAssessmentAssignments(assignments);
        }, (error) => {
                console.error('Could not load assessment assignment status:', error);
                document.getElementById('assessmentAssignmentsList').textContent =
                        'Assessment assignments could not be loaded. Check facilitator Firestore access.';
        });
};

const openLearnerDetails = async (learner) => {
        selectedLearner = learner;
        learnerDetail.hidden = false;
        document.getElementById('selectedLearnerName').textContent = learner.displayName || learner.username || 'Unnamed learner';
        document.getElementById('selectedLearnerMeta').textContent = `${learner.email || 'No email'} · ${learner.programme || 'Programme not specified'}`;
        document.getElementById('stageProgressList').textContent = 'Loading stage progress...';
        document.getElementById('stageProgressSelector').value = '';
        document.getElementById('learnerViewSelector').value = '';
        showLearnerDetailSection('');
        document.getElementById('learnerActivityList').textContent = 'Loading recorded activity...';
        document.getElementById('learnerBookingsList').textContent = 'Loading support bookings...';
        document.getElementById('assessmentAssignmentsList').textContent = 'Loading assigned assessments...';
        subscribeToAssessmentAssignments(learner);
        learnerDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
                const activity = await loadLearnerActivity(learner);
                learner.activity = activity;
                learnerActivityCache.set(learner.id, activity);
                document.getElementById('selectedStageCount').textContent = `${activity.completedStages} / ${stageDefinitions.length} stages complete`;
                const overallProgress = Math.round((activity.completedStages / stageDefinitions.length) * 100);
                document.getElementById('selectedOverallProgress').textContent = `${overallProgress}%`;
                const progressBar = document.getElementById('selectedProgressBar');
                progressBar.max = stageDefinitions.length;
                progressBar.value = activity.completedStages;
                progressBar.setAttribute(
                        'aria-label',
                        `Overall programme progress: ${activity.completedStages} of ${stageDefinitions.length} stages complete`
                );
                document.getElementById('selectedSupportStatus').textContent = activity.supportLabel;
                document.getElementById('selectedSupportStatus').className = activity.needsSupport ? 'stage-failed' : 'stage-complete';
                document.getElementById('selectedAssessmentScore').textContent = activity.latestAssessment
                        ? `${activity.latestAssessment.percentage}% · ${formatDate(activity.latestAssessment.completedAt)}`
                        : 'No attempt';
                renderStageProgress(activity);
                renderActivities(activity.scores);

                const bookingsSnapshot = await getDocs(query(
                        collection(db, 'bookings'),
                        where('userId', '==', learner.id)
                ));
                const bookings = bookingsSnapshot.docs
                        .map((bookingDocument) => ({ id: bookingDocument.id, ...bookingDocument.data() }))
                        .sort((first, second) => (first.preferredDate || '').localeCompare(second.preferredDate || ''));
                learner.bookings = bookings;
                renderBookings(bookings);
        } catch (error) {
                console.error('Could not load learner activity:', error);
                document.getElementById('learnerActivityList').textContent = 'Learner activity could not be loaded. Check facilitator Firestore access.';
                document.getElementById('learnerBookingsList').textContent = 'Support bookings could not be loaded.';
                document.getElementById('assessmentAssignmentsList').textContent = 'Assessment assignments could not be loaded.';
                setMessage('Could not load this learner’s activity.', 'error');
        }
};

document.getElementById('printFullReport')?.addEventListener('click', () => printLearnerReport());

document.getElementById('stageProgressSelector')?.addEventListener('change', (event) => {
        if (selectedLearner?.activity) {
                renderStageProgress(selectedLearner.activity, event.target.value);
        }
});

document.getElementById('learnerViewSelector')?.addEventListener('change', (event) => {
        showLearnerDetailSection(event.target.value);
});

assessmentAssignmentForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedLearner || !facilitatorId) {
                setMessage('Select a learner before assigning an assessment.', 'error');
                return;
        }

        const submitButton = document.getElementById('assignAssessmentButton');
        submitButton.disabled = true;
        try {
                await addDoc(collection(db, 'assessmentAssignments'), {
                        userId: selectedLearner.id,
                        facilitatorId,
                        assessment: 'skills-assessment',
                        status: 'assigned',
                        assignedAt: serverTimestamp()
                });
                assessmentAssignmentForm.reset();
                setMessage('Assessment assigned to the learner.', 'success');
                await loadAssessmentAssignments(selectedLearner);
        } catch (error) {
                console.error('Could not assign assessment:', error);
                setMessage(error.code === 'permission-denied'
                        ? 'You do not have permission to assign this assessment.'
                        : 'Could not assign the assessment. Check your connection and try again.', 'error');
        } finally {
                submitButton.disabled = false;
        }
});


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

        const learnersWithActivity = await Promise.all(learners.map(async (learner) => {
                try {
                        const activity = learnerActivityCache.get(learner.id) || await loadLearnerActivity(learner);
                        learnerActivityCache.set(learner.id, activity);
                        return { ...learner, activity };
                } catch (error) {
                        console.error(`Could not load activity summary for ${learner.id}:`, error);
                        return {
                                ...learner,
                                activity: {
                                        scores: [],
                                        completedStages: 0,
                                        needsSupport: false,
                                        supportLabel: 'Progress unavailable',
                                        latestByStage: new Map(),
                                        progress: { games: {} }
                                }
                        };
                }
        }));

        displayLearners(learnersWithActivity);
};

document.getElementById('closeLearnerDetail')?.addEventListener('click', () => {
        if (unsubscribeAssessmentAssignments) {
                unsubscribeAssessmentAssignments();
                unsubscribeAssessmentAssignments = null;
        }
        learnerDetail.hidden = true;
        selectedLearner = null;
});

bookingForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedLearner || !facilitatorId) {
                setMessage('Select a learner before booking a support session.', 'error');
                return;
        }

        if (!bookingForm.reportValidity()) return;

        const submitButton = document.getElementById('bookSessionButton');
        const topic = document.getElementById('bookingTopic').value.trim();
        const preferredDate = document.getElementById('bookingDate').value;
        const notes = document.getElementById('bookingNotes').value.trim();
        if (!topic || !preferredDate) {
                setMessage('Enter a topic and preferred session date.', 'error');
                return;
        }

        submitButton.disabled = true;
        try {
                await addDoc(collection(db, 'bookings'), {
                        userId: selectedLearner.id,
                        learnerName: selectedLearner.displayName || selectedLearner.username || 'Learner',
                        facilitatorId,
                        createdBy: facilitatorId,
                        topic,
                        preferredDate,
                        notes,
                        status: 'pending',
                        createdAt: serverTimestamp()
                });

                bookingForm.reset();
                setMessage(`Support session booked for ${selectedLearner.displayName || selectedLearner.username || 'the learner'}.`, 'success');
                await openLearnerDetails(selectedLearner);
        } catch (error) {
                console.error('Could not book learner support session:', error);
                setMessage(error.code === 'permission-denied'
                        ? 'Firebase rules blocked this booking. Confirm the latest Firestore rules are published.'
                        : 'Could not book this support session. Check your connection and try again.', 'error');
        } finally {
                submitButton.disabled = false;
        }
});


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

                facilitatorId = user.uid;


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