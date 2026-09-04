# CLAUDE.md - Role B: Exchange & Logistics

## Project Scope & Constraints
* **Transaction Model:** In-person exchange ONLY. No pickup boxes, no postal shipping.
* **Item Listing:** Search and manual lookup ONLY. No barcode scanning functionality.
* **Monetization:** Free to build, free to use. No in-app payment rails or processing.
* **Tech Stack:** React Native (Expo), Firebase (Firestore & Cloud Functions), Expo Notifications.

## Developer Role & Focus
You are developing **Role B — Exchange & Logistics**. Prioritize the following modules, screens, and backend state machines.

### 1. Core Workflow States (`requests` collection)
`Requested` ➔ `Under Negotiation` ➔ `Confirmed` ➔ `Completed` / `Overdue`

### 2. Required Tasks & Components

#### Frontend Screens (Expo / React Native)
* **Borrow Request Screen:**
  * UI to trigger a borrow action.
  * Writes a new document to the `requests` collection with `status: "Requested"`.
* **Negotiation UI:**
  * Input fields for proposed due date.
  * Action buttons for Accept / Counter.
  * Updates document `status` to `Under Negotiation` or `Confirmed`.
* **In-Person Meetup Confirmation Screen:**
  * Input fields for agreed time and agreed place.
  * UI to confirm the physical exchange handover.

#### Backend & Cloud Engineering (Firebase)
* **State Transition Cloud Function:**
  * Server-side Firestore trigger or HTTPS Callable function.
  * Validates and enforces strict status transitions (e.g., cannot skip from `Requested` to `Confirmed`).
  * Blocks client-side spoofing of request states.
* **Scheduled Notifications Function:**
  * PubSub/Scheduled Cloud Function running daily.
  * Checks for upcoming return deadlines and overdue items.
  * Triggers push notifications via **Expo Notifications API**.

## Common Commands
* `npm run start` / `npx expo start` - Start the Expo development server
* `npm run lint` - Run code linter
* `npm run test` - Execute frontend test suites
* `cd functions && npm run build` - Compile Firebase Cloud Functions
* `firebase emulators:start` - Run local Firebase emulator suite
* `firebase deploy --only functions` - Deploy backend logic to production

## Code Style & Guidelines
* **State Changes:** Never update `requests.status` directly from the client without passing through the validation function wrapper or strict Firestore rules.
* **Date Handling:** Always use Firestore Timestamps for database storage; convert to local ISO strings/dates only on the UI layer.
* **Component Structure:** Keep UI views separate from Firebase mutation hooks to maintain testability.
