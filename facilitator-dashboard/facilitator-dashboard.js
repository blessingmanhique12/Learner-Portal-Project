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

class FacilitatorDashboard {
    constructor() {
        this.loginPath = '../login-page/login.html';

        this.welcome = document.getElementById('facilitatorWelcome');
        this.roleValue = document.getElementById('roleValue');
        this.message = document.getElementById('dashboardMessage');
        this.dashboard = document.getElementById('facilitatorDashboard');
        this.loadingScreen = document.getElementById('facilitatorLoading');
        this.logoutButton = document.getElementById('logoutButton');

        this.learnerList = document.getElementById('learnerList');
        this.learnerCount = document.getElementById('learnerCount');
        this.learnerDetail = document.getElementById('learnerDetail');
        this.bookingForm = document.getElementById('bookingForm');
        this.assessmentAssignmentForm = document.getElementById('assessmentAssignmentForm');
        this.bookingDateInput = document.getElementById('bookingDate');
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        if (this.bookingDateInput) this.bookingDateInput.min = today.toISOString().slice(0, 10);
        this.stageDefinitions = [
                { key: 'html', label: 'Stage 1: HTML Quiz' },
                { key: 'rps', label: 'Stage 2: Rock, Paper, Scissors' },
                { key: 'css', label: 'Stage 3: CSS Quiz' },
                { key: 'chess', label: 'Stage 4: Chess' },
                { key: 'javascript', label: 'Stage 5: JavaScript Quiz' }
        ];

        this.facilitatorId = null;
        this.selectedLearner = null;
        this.unsubscribeAssessmentAssignments = null;
        this.unsubscribeBookings = null;
        this.unsubscribeAllBookings = null;
        this.bookingMessageUnsubscribes = new Map();
        this.learnerActivityCache = new Map();
        this.learnersById = new Map();

        this.init();
    }

    setMessage = (text, type = '') => {
        if (!this.message) {
                return;
        }

        this.message.textContent = text;
        this.message.className = type
                ? `message ${type}`
                : 'message';
    };
    showDashboard = () => {
        this.dashboard.hidden = false;
        this.loadingScreen.hidden = true;
    };
    redirectToLogin = () => {
        localStorage.removeItem('learnerHubUser');
        window.location.href = this.loginPath;
    };
    stageLabel = (stage) =>
        this.stageDefinitions.find((item) => item.key === stage)?.label || stage;
    dateToMillis = (dateValue) => {
        if (!dateValue) return 0;
        if (typeof dateValue.toMillis === 'function') return dateValue.toMillis();
        const parsedDate = new Date(dateValue).getTime();
        return Number.isFinite(parsedDate) ? parsedDate : 0;
    };
    formatDate = (dateValue) => {
        const timestamp = this.dateToMillis(dateValue);
        return timestamp ? new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
        }).format(timestamp) : 'Date not recorded';
    };
    loadLearnerActivity = async (learner) => {
        const [progressSnapshot, scoresSnapshot] = await Promise.all([
                getDoc(doc(db, 'learnerProgress', learner.id)),
                getDocs(query(collection(db, 'scores'), where('userId', '==', learner.id)))
        ]);

        const progressData = progressSnapshot.exists() ? progressSnapshot.data() : {};
        const games = progressData.games || {};
        const scores = scoresSnapshot.docs
                .map((scoreDocument) => ({ id: scoreDocument.id, ...scoreDocument.data() }))
                .sort((first, second) => this.dateToMillis(second.completedAt) - this.dateToMillis(first.completedAt));
        const latestByStage = new Map();

        scores.forEach((score) => {
                if (score.stage !== 'skills-assessment' && !latestByStage.has(score.stage)) {
                        latestByStage.set(score.stage, score);
                }
        });

        const completedStages = this.stageDefinitions.filter((stage) => games[stage.key] === true).length;
        const unresolvedFailure = [...latestByStage.entries()].some(([stage, score]) =>
                score.passed === false && games[stage] !== true
        );
        const accountCreatedAt = this.dateToMillis(learner.createdAt);
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
                supportLabel: needsSupport ? 'Needs support' : completedStages === this.stageDefinitions.length
                        ? 'Stages complete'
                        : scores.length ? 'In progress' : 'No activity'
        };
    };
    makeSupportBadge = (activity) => {
        const badge = document.createElement('span');
        badge.className = `support-badge ${activity.needsSupport ? 'needs-support' : 'on-track'}`;
        badge.textContent = activity.supportLabel;
        return badge;
    };
    makeOverallProgress = (activity) => {
        const progress = document.createElement('div');
        progress.className = 'overall-progress';

        const label = document.createElement('span');
        label.textContent = 'Overall progress';
        const percentage = Math.round((activity.completedStages / this.stageDefinitions.length) * 100);
        const value = document.createElement('strong');
        value.textContent = `${percentage}%`;

        const bar = document.createElement('progress');
        bar.className = 'overall-progress-bar';
        bar.max = this.stageDefinitions.length;
        bar.value = activity.completedStages;
        bar.setAttribute(
                'aria-label',
                `Overall programme progress: ${activity.completedStages} of ${this.stageDefinitions.length} stages complete`
        );

        progress.append(label, value, bar);
        return progress;
    };
    displayLearners = (learners) => {
        if (!this.learnerList) return;
        this.learnerList.replaceChildren();

        if (this.learnerCount) this.learnerCount.textContent = `${learners.length} learner${learners.length === 1 ? '' : 's'}`;
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
                this.learnerList.appendChild(emptyMessage);
                return;
        }

        learners.forEach((learner) => {
                const learnerCard = document.createElement('article');
                learnerCard.className = 'learner-card';

                const cardHeading = document.createElement('div');
                cardHeading.className = 'learner-card-heading';
                const name = document.createElement('h3');
                name.textContent = learner.displayName || learner.username || 'Unnamed learner';
                cardHeading.append(name, this.makeSupportBadge(learner.activity));

                const email = document.createElement('p');
                email.textContent = learner.email || 'No email available';
                const programme = document.createElement('p');
                programme.textContent = learner.programme || 'Programme not specified';
                const progressSummary = document.createElement('p');
                progressSummary.className = 'muted';
                progressSummary.textContent = `${learner.activity.completedStages} of ${this.stageDefinitions.length} stages complete · ${learner.activity.scores.length} recorded activities`;
                const overallProgress = this.makeOverallProgress(learner.activity);
                const viewButton = document.createElement('button');
                viewButton.type = 'button';
                viewButton.className = 'learner-open-button';
                viewButton.textContent = 'View learner activity';
                viewButton.addEventListener('click', () => this.openLearnerDetails(learner));

                learnerCard.append(cardHeading, email, programme, progressSummary, overallProgress, viewButton);
                this.learnerList.appendChild(learnerCard);
        });
    };
    renderStageProgress = (activity, selectedStageKey = '') => {
        const container = document.getElementById('stageProgressList');
        container.replaceChildren();

        this.stageDefinitions
                .filter((stage) => !selectedStageKey || stage.key === selectedStageKey)
                .forEach((stage) => {
                const row = document.createElement('li');
                row.className = 'stage-progress-row';
                const number = document.createElement('span');
                number.className = 'stage-number';
                number.textContent = String(this.stageDefinitions.indexOf(stage) + 1).padStart(2, '0');
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
                printButton.addEventListener('click', () => this.printLearnerReport(stage.key));

                row.append(number, name, status, printButton);
                container.appendChild(row);
        });
    };
    showLearnerDetailSection = (sectionId) => {
        document.querySelectorAll('.learner-view-section').forEach((section) => {
                section.hidden = section.id !== sectionId;
        });
    };
    escapeReportValue = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    printLearnerReport = (stageKey = null) => {
        if (!this.selectedLearner?.activity) {
                this.setMessage('Select a learner and load their activity before printing a report.', 'error');
                return;
        }

        const activity = this.selectedLearner.activity;
        const learnerName = this.selectedLearner.displayName || this.selectedLearner.username || 'Unnamed learner';
        const learnerEmail = this.selectedLearner.email || 'No email available';
        const stage = stageKey ? this.stageDefinitions.find((item) => item.key === stageKey) : null;
        const reportTitle = stage ? `${stage.label} Report` : 'Full Learner Progress Report';
        const reportScores = stage
                ? activity.scores.filter((score) => score.stage === stage.key)
                : activity.scores;
        const reportStages = stage ? this.stageDefinitions.filter((item) => item.key === stage.key) : this.stageDefinitions;
        const scoreRows = reportScores.length
                ? reportScores.map((score) => `
                        <tr>
                                <td>${this.escapeReportValue(score.game || this.stageLabel(score.stage))}</td>
                                <td>${this.escapeReportValue(score.score ?? 0)} / ${this.escapeReportValue(score.maxScore ?? 0)}</td>
                                <td>${this.escapeReportValue(score.percentage ?? 0)}%</td>
                                <td>${this.escapeReportValue(score.assessment || score.stage === 'skills-assessment'
                                        ? 'Assessment'
                                        : score.passed === true ? 'Passed' : score.passed === false ? 'Failed' : 'Attempt')}</td>
                                <td>${this.escapeReportValue(this.formatDate(score.completedAt))}</td>
                        </tr>
                `).join('')
                : '<tr><td colspan="5">No recorded attempts.</td></tr>';
        const stageRows = reportStages.map((item) => {
                const latestAttempt = activity.latestByStage.get(item.key);
                const completed = activity.progress.games[item.key] === true;
                const status = completed
                        ? `Complete${latestAttempt ? ` · latest score ${latestAttempt.percentage}%` : ''}`
                        : latestAttempt ? `Incomplete · latest score ${latestAttempt.percentage}%` : 'Not started';
                return `<tr><td>${this.escapeReportValue(item.label)}</td><td>${this.escapeReportValue(status)}</td></tr>`;
        }).join('');
        const reportBookings = stage ? [] : (this.selectedLearner.bookings || []);
        const bookingRows = reportBookings.length
                ? reportBookings.map((booking) => `
                        <tr>
                                <td>${this.escapeReportValue(booking.topic || 'Support session')}</td>
                                <td>${this.escapeReportValue(booking.preferredDate || 'To be arranged')}</td>
                                <td>${this.escapeReportValue(booking.status || 'pending')}</td>
                                <td>${this.escapeReportValue(booking.notes || 'No notes')}</td>
                        </tr>
                `).join('')
                : '<tr><td colspan="4">No support sessions recorded.</td></tr>';

        const printTarget = document.getElementById('printReport');
        printTarget.innerHTML = `
                <header class="print-report-header">
                        <p class="print-report-brand">LearnerHub · Facilitator Report</p>
                        <h1>${this.escapeReportValue(reportTitle)}</h1>
                        <p><strong>Learner:</strong> ${this.escapeReportValue(learnerName)}</p>
                        <p><strong>Email:</strong> ${this.escapeReportValue(learnerEmail)}</p>
                        <p><strong>Programme:</strong> ${this.escapeReportValue(this.selectedLearner.programme || 'Not specified')}</p>
                        <p><strong>Generated:</strong> ${this.escapeReportValue(this.formatDate(new Date()))}</p>
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
    renderActivities = (scores) => {
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
                title.textContent = score.game || this.stageLabel(score.stage);
                const result = document.createElement('strong');
                result.textContent = score.assessment || score.stage === 'skills-assessment'
                        ? 'Assessment'
                        : score.passed === true ? 'Passed' : score.passed === false ? 'Failed' : 'Attempt';
                result.className = score.passed === false ? 'stage-failed' : 'stage-complete';
                heading.append(title, result);
                const detail = document.createElement('p');
                detail.textContent = `${score.score ?? 0} / ${score.maxScore ?? 0} · ${score.percentage ?? 0}% · ${this.formatDate(score.completedAt)}`;
                item.append(heading, detail);
                container.appendChild(item);
        });
    };
    renderBookings = (bookings) => {
        const container = document.getElementById('learnerBookingsList');
        this.bookingMessageUnsubscribes.forEach((unsubscribe) => unsubscribe());
        this.bookingMessageUnsubscribes.clear();
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

                if (['pending', 'confirmed'].includes(booking.status || 'pending')) {
                        const editForm = document.createElement('form');
                        editForm.className = 'booking-edit-form';
                        const topicLabel = document.createElement('label');
                        topicLabel.textContent = 'Session topic';
                        const topicInput = document.createElement('input');
                        topicInput.required = true;
                        topicInput.maxLength = 100;
                        topicInput.value = booking.topic || '';
                        topicLabel.appendChild(topicInput);
                        const preferredDateLabel = document.createElement('label');
                        preferredDateLabel.textContent = 'Preferred date';
                        const preferredDate = document.createElement('input');
                        preferredDate.type = 'date';
                        preferredDate.required = true;
                        preferredDate.value = booking.preferredDate || '';
                        preferredDateLabel.appendChild(preferredDate);
                        const statusLabel = document.createElement('label');
                        statusLabel.textContent = 'Status';
                        const statusInput = document.createElement('select');
                        ['pending', 'confirmed', 'cancelled'].forEach((value) => {
                                const option = document.createElement('option');
                                option.value = value;
                                option.textContent = value[0].toUpperCase() + value.slice(1);
                                option.selected = (booking.status || 'pending') === value;
                                statusInput.appendChild(option);
                        });
                        statusLabel.appendChild(statusInput);
                        const notesLabel = document.createElement('label');
                        notesLabel.textContent = 'Session notes for the learner';
                        const notesInput = document.createElement('textarea');
                        notesInput.maxLength = 500;
                        notesInput.rows = 2;
                        notesInput.value = booking.notes || '';
                        notesLabel.appendChild(notesInput);
                        const saveButton = document.createElement('button');
                        saveButton.type = 'submit';
                        saveButton.textContent = 'Save booking update';
                        editForm.append(topicLabel, preferredDateLabel, statusLabel, notesLabel, saveButton);
                        item.appendChild(editForm);
                        editForm.addEventListener('submit', (event) => {
                                event.preventDefault();
                                this.updateFacilitatorBooking(booking, {
                                        topic: topicInput.value.trim(),
                                        preferredDate: preferredDate.value,
                                        notes: notesInput.value.trim(),
                                        status: statusInput.value
                                }, saveButton);
                        });
                }

                const thread = document.createElement('section');
                thread.className = 'booking-thread';
                const threadHeading = document.createElement('h4');
                threadHeading.textContent = 'Conversation with learner';
                const messages = document.createElement('div');
                messages.className = 'booking-messages';
                messages.setAttribute('aria-live', 'polite');
                messages.textContent = 'Loading conversation...';
                thread.append(threadHeading, messages);
                const replyForm = document.createElement('form');
                replyForm.className = 'booking-reply-form';
                const reply = document.createElement('textarea');
                reply.required = true;
                reply.maxLength = 1000;
                reply.rows = 2;
                reply.placeholder = 'Write a message to the learner';
                reply.setAttribute('aria-label', 'Message to the learner');
                const sendButton = document.createElement('button');
                sendButton.type = 'submit';
                sendButton.textContent = 'Send response';
                replyForm.append(reply, sendButton);
                thread.appendChild(replyForm);
                item.appendChild(thread);
                this.subscribeToBookingMessages(booking, messages);
                replyForm.addEventListener('submit', (event) => {
                        event.preventDefault();
                        this.sendBookingMessage(booking, reply, sendButton);
                });

                if (['pending', 'confirmed'].includes(booking.status || 'pending')) {
                        const completeButton = document.createElement('button');
                        completeButton.type = 'button';
                        completeButton.className = 'complete-booking-button';
                        completeButton.textContent = 'Mark session complete';
                        completeButton.addEventListener('click', () => this.completeFacilitatorBooking(booking, completeButton));
                        item.appendChild(completeButton);
                }
                container.appendChild(item);
        });
    };
    completeFacilitatorBooking = async (booking, button) => {
        if (!this.selectedLearner || !this.facilitatorId) return;

        button.disabled = true;
        try {
                if (booking.facilitatorId !== this.facilitatorId) {
                        await updateDoc(doc(db, 'bookings', booking.id), {
                                facilitatorId: this.facilitatorId,
                                updatedAt: serverTimestamp(),
                                updatedBy: this.facilitatorId
                        });
                }
                await updateDoc(doc(db, 'bookings', booking.id), {
                        status: 'completed',
                        completedAt: serverTimestamp(),
                        completedBy: this.facilitatorId
                });
                this.setMessage('Support session marked complete.', 'success');
                await this.openLearnerDetails(this.selectedLearner);
        } catch (error) {
                console.error('Could not complete the booked session:', error);
                button.disabled = false;
                this.setMessage(error.code === 'permission-denied'
                        ? 'Only the booked learner or assigned facilitator can complete this session.'
                        : 'Could not complete this session. Check your connection and try again.', 'error');
        }
    };
    subscribeToBookingMessages = (booking, container) => {
        const messagesQuery = query(collection(db, 'bookings', booking.id, 'messages'));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                const messages = snapshot.docs
                        .map((messageDocument) => ({ id: messageDocument.id, ...messageDocument.data() }))
                        .sort((first, second) => this.dateToMillis(first.createdAt) - this.dateToMillis(second.createdAt));
                container.replaceChildren();
                if (messages.length === 0) {
                        container.textContent = 'No messages yet. Send the learner a response.';
                        return;
                }

                messages.forEach((message) => {
                        const entry = document.createElement('article');
                        entry.className = `booking-message ${message.authorRole === 'facilitator' ? 'from-facilitator' : 'from-learner'}`;
                        const author = document.createElement('strong');
                        author.textContent = message.authorRole === 'facilitator' ? 'You' : message.authorName || 'Learner';
                        const text = document.createElement('p');
                        text.textContent = message.text;
                        entry.append(author, text);
                        container.appendChild(entry);
                });
        }, (error) => {
                console.error('Could not load support booking conversation:', error);
                container.textContent = error.code === 'permission-denied'
                        ? 'This booking conversation is assigned to another facilitator.'
                        : 'Messages could not be loaded. Please try again later.';
        });
        this.bookingMessageUnsubscribes.set(booking.id, unsubscribe);
    };
    updateFacilitatorBooking = async (booking, changes, button) => {
        if (!this.facilitatorId) return;
        button.disabled = true;
        try {
                await updateDoc(doc(db, 'bookings', booking.id), {
                        ...changes,
                        facilitatorId: this.facilitatorId,
                        updatedAt: serverTimestamp(),
                        updatedBy: this.facilitatorId
                });
                this.setMessage('Booking details updated. The learner can see the changes now.', 'success');
        } catch (error) {
                console.error('Could not update support booking:', error);
                this.setMessage(error.code === 'permission-denied'
                        ? 'This booking is assigned to another facilitator or the latest Firestore rules are not published.'
                        : 'Could not update the booking. Check your connection and try again.', 'error');
        } finally {
                button.disabled = false;
        }
    };
    sendBookingMessage = async (booking, input, button) => {
        const text = input.value.trim();
        if (!text || !this.facilitatorId) return;
        button.disabled = true;
        try {
                if (booking.facilitatorId !== this.facilitatorId) {
                        await updateDoc(doc(db, 'bookings', booking.id), {
                                facilitatorId: this.facilitatorId,
                                updatedAt: serverTimestamp(),
                                updatedBy: this.facilitatorId
                        });
                }
                const user = auth.currentUser;
                const profileSnapshot = await getDoc(doc(db, 'registrations', this.facilitatorId));
                const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};
                await addDoc(collection(db, 'bookings', booking.id, 'messages'), {
                        authorId: this.facilitatorId,
                        authorName: profile.displayName || profile.username || user?.displayName || 'Facilitator',
                        authorRole: 'facilitator',
                        text,
                        createdAt: serverTimestamp()
                });
                input.value = '';
        } catch (error) {
                console.error('Could not respond to support booking:', error);
                this.setMessage(error.code === 'permission-denied'
                        ? 'This booking is assigned to another facilitator or the latest Firestore rules are not published.'
                        : 'Could not send the response. Check your connection and try again.', 'error');
        } finally {
                button.disabled = false;
        }
    };
    renderAssessmentAssignments = (assignments) => {
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
                assignedDate.textContent = `Assigned ${this.formatDate(assignment.assignedAt)}`;
                item.append(heading, assignedDate);

                if (assignment.status === 'completed') {
                        const completedDate = document.createElement('p');
                        completedDate.textContent = `Completed ${this.formatDate(assignment.completedAt)}`;
                        item.appendChild(completedDate);
                }

                container.appendChild(item);
        });
    };
    loadAssessmentAssignments = async (learner) => {
        const snapshot = await getDocs(query(
                collection(db, 'assessmentAssignments'),
                where('userId', '==', learner.id)
        ));
        const assignments = snapshot.docs
                .map((assignmentDocument) => ({ id: assignmentDocument.id, ...assignmentDocument.data() }))
                .sort((first, second) => this.dateToMillis(second.assignedAt) - this.dateToMillis(first.assignedAt));
        this.renderAssessmentAssignments(assignments);
    };
    subscribeToAssessmentAssignments = (learner) => {
        if (this.unsubscribeAssessmentAssignments) this.unsubscribeAssessmentAssignments();

        const assignmentsQuery = query(
                collection(db, 'assessmentAssignments'),
                where('userId', '==', learner.id)
        );
        this.unsubscribeAssessmentAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
                const assignments = snapshot.docs
                        .map((assignmentDocument) => ({ id: assignmentDocument.id, ...assignmentDocument.data() }))
                        .sort((first, second) => this.dateToMillis(second.assignedAt) - this.dateToMillis(first.assignedAt));
                this.renderAssessmentAssignments(assignments);
        }, (error) => {
                console.error('Could not load assessment assignment status:', error);
                document.getElementById('assessmentAssignmentsList').textContent =
                        error.code === 'permission-denied'
                                ? 'Assessment status access was denied. Publish the latest firestore.rules and confirm this account has the facilitator role.'
                                : 'Assessment assignments could not be loaded. Check your connection and try again.';
        });
    };
    openLearnerDetails = async (learner) => {
        this.selectedLearner = learner;
        if (this.unsubscribeBookings) this.unsubscribeBookings();
        this.bookingMessageUnsubscribes.forEach((unsubscribe) => unsubscribe());
        this.bookingMessageUnsubscribes.clear();
        this.learnerDetail.hidden = false;
        document.getElementById('selectedLearnerName').textContent = learner.displayName || learner.username || 'Unnamed learner';
        document.getElementById('selectedLearnerMeta').textContent = `${learner.email || 'No email'} · ${learner.programme || 'Programme not specified'}`;
        document.getElementById('stageProgressList').textContent = 'Loading stage progress...';
        document.getElementById('stageProgressSelector').value = '';
        document.getElementById('learnerViewSelector').value = '';
        this.showLearnerDetailSection('');
        document.getElementById('learnerActivityList').textContent = 'Loading recorded activity...';
        document.getElementById('learnerBookingsList').textContent = 'Loading support bookings...';
        document.getElementById('assessmentAssignmentsList').textContent = 'Loading assigned assessments...';
        this.subscribeToAssessmentAssignments(learner);
        this.learnerDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });

        try {
                const activity = await this.loadLearnerActivity(learner);
                learner.activity = activity;
                this.learnerActivityCache.set(learner.id, activity);
                document.getElementById('selectedStageCount').textContent = `${activity.completedStages} / ${this.stageDefinitions.length} stages complete`;
                const overallProgress = Math.round((activity.completedStages / this.stageDefinitions.length) * 100);
                document.getElementById('selectedOverallProgress').textContent = `${overallProgress}%`;
                const progressBar = document.getElementById('selectedProgressBar');
                progressBar.max = this.stageDefinitions.length;
                progressBar.value = activity.completedStages;
                progressBar.setAttribute(
                        'aria-label',
                        `Overall programme progress: ${activity.completedStages} of ${this.stageDefinitions.length} stages complete`
                );
                document.getElementById('selectedSupportStatus').textContent = activity.supportLabel;
                document.getElementById('selectedSupportStatus').className = activity.needsSupport ? 'stage-failed' : 'stage-complete';
                document.getElementById('selectedAssessmentScore').textContent = activity.latestAssessment
                        ? `${activity.latestAssessment.percentage}% · ${this.formatDate(activity.latestAssessment.completedAt)}`
                        : 'No attempt';
                this.renderStageProgress(activity);
                this.renderActivities(activity.scores);

                this.subscribeToLearnerBookings(learner);
        } catch (error) {
                console.error('Could not load learner activity:', error);
                document.getElementById('learnerActivityList').textContent = 'Learner activity could not be loaded. Check facilitator Firestore access.';
                document.getElementById('learnerBookingsList').textContent = 'Support bookings could not be loaded.';
                document.getElementById('assessmentAssignmentsList').textContent = 'Assessment assignments could not be loaded.';
                this.setMessage('Could not load this learner’s activity.', 'error');
        }
    };
    subscribeToLearnerBookings = (learner) => {
        const learnerBookingsQuery = query(
                collection(db, 'bookings'),
                where('userId', '==', learner.id)
        );
        this.unsubscribeBookings = onSnapshot(learnerBookingsQuery, (snapshot) => {
                const bookings = snapshot.docs
                        .map((bookingDocument) => ({ id: bookingDocument.id, ...bookingDocument.data() }))
                        .sort((first, second) => (first.preferredDate || '').localeCompare(second.preferredDate || ''));
                learner.bookings = bookings;
                this.renderBookings(bookings);
        }, (error) => {
                console.error('Could not subscribe to learner support bookings:', error);
                document.getElementById('learnerBookingsList').textContent =
                        error.code === 'permission-denied'
                                ? 'Support booking access was denied. Confirm facilitator Firestore access.'
                                : 'Support bookings could not be loaded. Check your connection and try again.';
        });
    };
    subscribeToAllBookings = () => {
        if (this.unsubscribeAllBookings) this.unsubscribeAllBookings();

        this.unsubscribeAllBookings = onSnapshot(query(collection(db, 'bookings')), (snapshot) => {
                const bookings = snapshot.docs
                        .map((bookingDocument) => ({ id: bookingDocument.id, ...bookingDocument.data() }))
                        .sort((first, second) =>
                                this.dateToMillis(second.createdAt) - this.dateToMillis(first.createdAt)
                        );
                this.renderSupportBookingInbox(bookings);
        }, (error) => {
                console.error('Could not load the support booking inbox:', error);
                document.getElementById('supportBookingInbox').textContent =
                        error.code === 'permission-denied'
                                ? 'Support booking access was denied. Confirm the latest Firestore rules are published and this account has the facilitator role.'
                                : 'Support bookings could not be loaded. Check your connection and try again.';
                document.getElementById('supportBookingCount').textContent = 'Unavailable';
        });
    };
    renderSupportBookingInbox = (bookings) => {
        const container = document.getElementById('supportBookingInbox');
        const count = document.getElementById('supportBookingCount');
        if (!container || !count) return;

        count.textContent = `${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'}`;
        container.replaceChildren();
        if (bookings.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'muted';
                empty.textContent = 'No learner support bookings yet.';
                container.appendChild(empty);
                return;
        }

        bookings.forEach((booking) => {
                const learner = this.learnersById.get(booking.userId);
                const card = document.createElement('article');
                card.className = 'support-booking-card';

                const heading = document.createElement('div');
                heading.className = 'activity-item-heading';
                const topic = document.createElement('h3');
                topic.textContent = booking.topic || 'Support session';
                const status = document.createElement('strong');
                status.className = `booking-inbox-status ${String(booking.status || 'pending').toLowerCase()}`;
                status.textContent = booking.status || 'pending';
                heading.append(topic, status);

                const learnerName = document.createElement('p');
                learnerName.className = 'support-booking-learner';
                learnerName.textContent = `Learner: ${learner?.displayName || learner?.username || booking.learnerName || 'Learner'}`;
                const date = document.createElement('p');
                date.textContent = `Preferred date: ${booking.preferredDate || 'To be arranged'}`;
                const notes = document.createElement('p');
                notes.textContent = booking.notes || 'No additional notes.';
                const openButton = document.createElement('button');
                openButton.type = 'button';
                openButton.className = 'learner-open-button';
                openButton.textContent = 'View and respond';
                openButton.disabled = !learner;
                openButton.title = learner ? '' : 'This learner profile could not be loaded.';
                openButton.addEventListener('click', async () => {
                        if (!learner) return;
                        await this.openLearnerDetails(learner);
                        document.getElementById('learnerViewSelector').value = 'bookingsSection';
                        this.showLearnerDetailSection('bookingsSection');
                        document.getElementById('bookingsSection').scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                        });
                });
                card.append(heading, learnerName, date, notes, openButton);
                container.appendChild(card);
        });
    };
    loadLearners = async () => {

        if (!this.learnerList) {
                return;
        }

        this.learnerList.innerHTML = `
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
                        const activity = this.learnerActivityCache.get(learner.id) || await this.loadLearnerActivity(learner);
                        this.learnerActivityCache.set(learner.id, activity);
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

        this.learnersById = new Map(learnersWithActivity.map((learner) => [learner.id, learner]));
        this.displayLearners(learnersWithActivity);
    };

    init() {
        document.getElementById('printFullReport')?.addEventListener('click', () => this.printLearnerReport());

        document.getElementById('stageProgressSelector')?.addEventListener('change', (event) => {
                if (this.selectedLearner?.activity) {
                        this.renderStageProgress(this.selectedLearner.activity, event.target.value);
                }
        });

        document.getElementById('learnerViewSelector')?.addEventListener('change', (event) => {
                this.showLearnerDetailSection(event.target.value);
        });

        this.assessmentAssignmentForm?.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!this.selectedLearner || !this.facilitatorId) {
                        this.setMessage('Select a learner before assigning an assessment.', 'error');
                        return;
                }

                const submitButton = document.getElementById('assignAssessmentButton');
                const learner = this.selectedLearner;
                submitButton.disabled = true;
                try {
                        await addDoc(collection(db, 'assessmentAssignments'), {
                                userId: learner.id,
                                facilitatorId: this.facilitatorId,
                                assessment: document.getElementById('assessmentType').value,
                                status: 'assigned',
                                assignedAt: serverTimestamp()
                        });
                        this.assessmentAssignmentForm.reset();
                        this.setMessage('Assessment assigned to the learner.', 'success');
                } catch (error) {
                        console.error('Could not assign assessment:', error);
                        this.setMessage(error.code === 'permission-denied'
                                ? 'Assignment was blocked by Firestore. Publish the latest firestore.rules and confirm your account is registered as a facilitator.'
                                : 'Could not assign the assessment. Check your connection and try again.', 'error');
                } finally {
                        submitButton.disabled = false;
                }
        });

        document.getElementById('closeLearnerDetail')?.addEventListener('click', () => {
                if (this.unsubscribeAssessmentAssignments) {
                        this.unsubscribeAssessmentAssignments();
                        this.unsubscribeAssessmentAssignments = null;
                }
                if (this.unsubscribeBookings) {
                        this.unsubscribeBookings();
                        this.unsubscribeBookings = null;
                }
                this.bookingMessageUnsubscribes.forEach((unsubscribe) => unsubscribe());
                this.bookingMessageUnsubscribes.clear();
                this.learnerDetail.hidden = true;
                this.selectedLearner = null;
        });

        this.bookingForm?.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!this.selectedLearner || !this.facilitatorId) {
                        this.setMessage('Select a learner before booking a support session.', 'error');
                        return;
                }

                if (!this.bookingForm.reportValidity()) return;

                const submitButton = document.getElementById('bookSessionButton');
                const topic = document.getElementById('bookingTopic').value.trim();
                const preferredDate = document.getElementById('bookingDate').value;
                const notes = document.getElementById('bookingNotes').value.trim();
                if (!topic || !preferredDate) {
                        this.setMessage('Enter a topic and preferred session date.', 'error');
                        return;
                }

                submitButton.disabled = true;
                try {
                        await addDoc(collection(db, 'bookings'), {
                                userId: this.selectedLearner.id,
                                learnerName: this.selectedLearner.displayName || this.selectedLearner.username || 'Learner',
                                facilitatorId: this.facilitatorId,
                                createdBy: this.facilitatorId,
                                topic,
                                preferredDate,
                                notes,
                                status: 'pending',
                                createdAt: serverTimestamp()
                        });

                        this.bookingForm.reset();
                        this.setMessage(`Support session booked for ${this.selectedLearner.displayName || this.selectedLearner.username || 'the learner'}.`, 'success');
                        await this.openLearnerDetails(this.selectedLearner);
                } catch (error) {
                        console.error('Could not book learner support session:', error);
                        this.setMessage(error.code === 'permission-denied'
                                ? 'Firebase rules blocked this booking. Confirm the latest Firestore rules are published.'
                                : 'Could not book this support session. Check your connection and try again.', 'error');
                } finally {
                        submitButton.disabled = false;
                }
        });

        onAuthStateChanged(auth, async (user) => {

                if (!user) {
                        this.redirectToLogin();
                        return;
                }

                try {

                        const profileSnapshot = await getDoc(
                                doc(db, 'registrations', user.uid)
                        );

                        if (!profileSnapshot.exists()) {

                                await signOut(auth);

                                this.redirectToLogin();

                                return;
                        }

                        const profile = profileSnapshot.data();

                        if (profile.role !== 'facilitator') {

                                await signOut(auth);

                                this.redirectToLogin();

                                return;
                        }

                        this.facilitatorId = user.uid;

                        const displayName =
                                profile.displayName ||
                                profile.username ||
                                user.displayName ||
                                user.email;

                        if (this.welcome) {
                                this.welcome.textContent =
                                        `Welcome, ${displayName}.`;
                        }

                        if (this.roleValue) {
                                this.roleValue.textContent =
                                        profile.role;
                        }

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

                        await this.loadLearners();
                        this.subscribeToAllBookings();

                        this.setMessage('Firebase session connected.');
                        this.showDashboard();

                } catch (error) {

                        console.error(
                                'Facilitator dashboard error:',
                                error
                        );

                        this.setMessage(
                                error.message ||
                                'Could not load the facilitator dashboard.',
                                'error'
                        );
                        this.showDashboard();
                }
        });

        if (this.logoutButton) {

                this.logoutButton.addEventListener('click', async () => {

                        try {

                                await signOut(auth);

                                this.redirectToLogin();

                        } catch (error) {

                                console.error(
                                        'Logout error:',
                                        error
                                );

                                this.setMessage(
                                        'Could not sign out. Please try again.',
                                        'error'
                                );
                        }
                });
        }
    }
}

new FacilitatorDashboard();
