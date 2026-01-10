# Feature Specification: Contact & Feedback

**Feature Branch**: `008-contact-feedback`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "Managing church contact information and user feedback"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Church Location (Priority: P1)

As a visitor, I want to find the church's address and see it on a map so that I can easily navigate to the church.

**Why this priority**: Essential for physical attendance and finding the church.

**Independent Test**: Can be tested by visiting the contact page and verifying the address is displayed and the Google Maps iframe is loaded with the correct location.

**Acceptance Scenarios**:

1. **Given** the church's location is configured, **When** I view the contact page, **Then** I should see the full address in Thai.
2. **Given** the map section, **When** I click "Open in Google Maps", **Then** I should be redirected to the Google Maps application/website with the church's coordinates.

---

### User Story 2 - Reach Out via Phone or Email (Priority: P1)

As someone with a specific question, I want to see the church's phone number and email so that I can contact them directly.

**Why this priority**: Basic communication channel for the community.

**Independent Test**: Can be tested by clicking on the phone or email links on the contact page and verifying they trigger the respective communication apps.

**Acceptance Scenarios**:

1. **Given** contact details are available, **When** I look at the contact cards, **Then** I should see a clickable phone number and a clickable email address.

---

### User Story 3 - Submit Feedback or Comments (Priority: P2)

As a member of the congregation, I want to submit feedback or suggestions to the church leaders so that I can contribute to the community's improvement.

**Why this priority**: Encourages community participation and provides a structured channel for communication.

**Independent Test**: Can be tested by filling out the feedback form and verifying that a success message appears and the data is stored in the database.

**Acceptance Scenarios**:

1. **Given** the feedback form, **When** I enter my name, category (e.g., "Suggestion"), and message, and click submit, **Then** the system should validate the input and save the feedback.
2. **Given** a successful submission, **When** the process completes, **Then** I should see a confirmation message thanking me for my input.

---

### User Story 4 - Admin: Manage Feedback (Priority: P2)

As an administrator, I want to view and manage submitted feedback so that I can respond to concerns and track suggestions.

**Why this priority**: Ensures that user input is actually processed and acted upon.

**Independent Test**: Can be tested via the admin panel by viewing the list of feedbacks and marking them as "reviewed" or "processed".

**Acceptance Scenarios**:

1. **Given** new feedback has been submitted, **When** I log into the admin panel, **Then** I should see the new entry in the feedback management section.
2. **Given** a piece of feedback, **When** I update its status, **Then** the change should be persisted in the database.

---

### Edge Cases

- **Invalid Form Submission**: If a user tries to submit an empty feedback form, the system should show validation errors.
- **Bot Spam**: The system should implement basic protection (like rate limiting) to prevent automated bots from flooding the feedback database.
- **Missing Contact Data**: If contact information is missing from the database, the page should show a fallback state rather than crashing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display church address, phone number, and email.
- **FR-002**: System MUST integrate an interactive Google Map for location visualization.
- **FR-003**: System MUST provide a public feedback form with fields for Name, Category, and Message.
- **FR-004**: System MUST store submitted feedback in the database with a timestamp.
- **FR-005**: System MUST provide an administrative interface to list and manage feedback.
- **FR-006**: System MUST link to the church's social media profiles (Facebook, YouTube).
- **FR-007**: System MUST provide clickable links for phone (tel:) and email (mailto:) for mobile ease-of-use.

### Key Entities *(include if feature involves data)*

- **ContactInfo**: Represents the church's public details. Attributes: Address, Phone, Email, Social Links, Map Embed URL.
- **Feedback**: Represents a user submission. Attributes: Name, Category, Content, Status (New/Reviewed), CreatedAt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of submitted feedbacks are correctly captured and visible in the admin panel.
- **SC-002**: Users can find a contact method (phone/email/form) within 3 seconds of opening the contact page.
- **SC-003**: The feedback form submission takes less than 2 seconds to process on a standard connection.
- **SC-004**: The Google Maps integration is fully interactive and loads correctly on both desktop and mobile.