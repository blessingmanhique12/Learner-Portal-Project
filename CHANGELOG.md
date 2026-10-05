
# Blessing

### Added
- User Stories
- Wireframes completed: landing page, learner dashboard, support request form

# CHANGELOG

All notable changes and updates to the SkillsTrack Learner Support Portal project are documented here.

## [0.1.0] - 2026-08-19

### Added

- User Stories
- Wireframes completed: Landing Page, Learner Dashboard, and Support Request Form
- Initial Pseudocode

## [0.2.0] - 2026-08-25

### Added

- Client Brief
- Requirements
- Updated Landing Page Pseudocode with application logic
- Landing Page wireframe structure based on the updated pseudocode
- Task completion checkbox logic
- Progress calculation logic
- Outstanding and overdue task calculations
- Dashboard summary calculations

### Updated

- Improved the Landing Page pseudocode to include system logic and user interactions.
- Added logic for updating task status through the checkbox.
- Added logic for recalculating learner progress when a task is completed or uncompleted.

### Updated

* Edited the User Stories to include two points of view: **Learner** and **Assessor**.
* Added separate user stories and acceptance criteria to clearly represent the needs and actions of both users.
## Blessing

### Added
- User Stories
- Wireframes completed: landing page, learner dashboard, support request form

All notable changes and updates to the SkillsTrack Learner Support Portal project are documented here.

## [0.1.0] - 2026-08-19

### Added

- User Stories
- Wireframes completed: landing page, learner dashboard, support request form
- Wireframes completed: Landing Page, Learner Dashboard, and Support Request Form
- Initial Pseudocode

## [0.2.0] - 2026-08-25

### Added

- Client Brief
- Requirements
- Updated Landing Page Pseudocode with application logic
- Landing Page wireframe structure based on the updated pseudocode
- Task completion checkbox logic
- Progress calculation logic
- Outstanding and overdue task calculations
- Dashboard summary calculations

### Updated

- Improved the Landing Page pseudocode to include system logic and user interactions.
- Added logic for updating task status through the checkbox.
- Added logic for recalculating learner progress when a task is completed or uncompleted.
* Edited the User Stories to include two points of view: **Learner** and **Assessor**.
* Added separate user stories and acceptance criteria to clearly represent the needs and actions of both users.

## [0.3.0] - 26 August 2026

### Added

* UI Design for the Learner Landing Page

## [0.4.0]- 03 October 2026

### Fixed (learner-progress.js)
- Overdue Tasks counter always showed 0. It is now calculated from each task's due date (incomplete tasks with a past due date).
- "Book New Session" button did nothing. Added the booking form, which saves to Firestore (`bookings`) and appears in My Support Bookings.
- Support Bookings counter counted every booking. It now counts upcoming sessions only (not completed or cancelled).
- "Preview empty states" only opened a generic popup. It now switches the dashboard to its real empty states and back, without touching saved data.
- Assessment progress bar stayed stuck if the quiz was closed part-way. It now resets on close.
- Home navigation now scrolls to the top of the page.

### Added (learner-progress.js)
- Empty state for My Goals ("No goals yet.").
- Helper functions for the overdue check, upcoming bookings and empty-state preview.
- `addDoc` import from Firestore.

### Removed (learner-progress.js)
- Leftover "DELETE BUTTONS" block after `renderGoals`. It was old code that did nothing.
- Unused `overdue: false` property on new tasks.

### Changed (learner-progress.css)
- Layout now fills the whole screen: side borders and width cap removed, navy page background.
- Header is sticky and slightly taller.
- Content is capped at 1400px wide on very large monitors.
- Larger text, buttons, icons, stat numbers, checkboxes and task rows for readability.
- Slightly larger spacing between and inside cards.
- Removed the phone rule that shrank task rows.

### Unchanged
- learner-progress.html (no changes needed).

### To check
- Firestore rules must allow learners to create documents in `bookings` (and in `scores` and `learnerProgress` for the quiz).
- Quiz behaviour depends on `QuizGame.js` and `ProgressManager.js`, which haven't been reviewed yet.
 
