# Feature Specification: Admin Management

**Feature Branch**: `009-admin-management`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "Centralized administrative system for managing church content and operations"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Staff Login (Priority: P1)

As a church staff member, I want to securely log into the administrative dashboard so that I can manage website content without unauthorized access.

**Why this priority**: Fundamental security requirement to protect sensitive information and prevent vandalism.

**Independent Test**: Can be tested by attempting to access `/admin` and verifying redirection to `/admin/login`, then successfully logging in with valid credentials.

**Acceptance Scenarios**:

1. **Given** I am an unauthenticated user, **When** I navigate to a protected admin path, **Then** I should be redirected to the login page.
2. **Given** I provide correct administrator credentials, **When** I submit the login form, **Then** I should be granted access to the dashboard.

---

### User Story 2 - Overview of Church Operations (Priority: P1)

As an administrator, I want to see a summary of active missions, projects, and new feedback so that I can quickly understand what needs my attention.

**Why this priority**: Provides the high-level situational awareness needed for efficient management.

**Independent Test**: Can be tested by viewing the dashboard cards and verifying the numbers match the actual records in the database.

**Acceptance Scenarios**:

1. **Given** I am on the admin dashboard, **When** new feedback is submitted, **Then** the feedback count on the dashboard should increase.
2. **Given** the dashboard cards, **When** I click on a card (e.g., "Missions"), **Then** I should be taken to the respective management page.

---

### User Story 3 - Configure Financial Reporting (Priority: P2)

As a financial administrator, I want to control which categories from Google Sheets are visible on the public site and how they are grouped, so that the financial reports are easy for the congregation to understand.

**Why this priority**: Crucial for effective financial transparency and clarity.

**Independent Test**: Can be tested by using the Admin Panel to hide a category and verifying it no longer appears on the public financial page.

**Acceptance Scenarios**:

1. **Given** a new category was imported from Google Sheets, **When** I uncheck "visible" in the admin panel, **Then** it should be excluded from the public report.
2. **Given** multiple related categories, **When** I enter an "aggregate into" label for them, **Then** they should be summed up under that single label on the public page.

---

### Edge Cases

- **Session Expiration**: If an administrator's session expires, they should be gracefully prompted to log in again when they attempt their next action.
- **Concurrent Updates**: If two admins edit the same mission simultaneously, the system should ideally handle the conflict or warn the second user.
- **Invalid Credentials**: The system should provide a generic error message for failed logins to prevent information leakage about account existence.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a secure authentication mechanism for admin access.
- **FR-002**: System MUST protect all `/admin` routes (except login) via server-side middleware.
- **FR-003**: System MUST provide a centralized dashboard displaying key operational statistics.
- **FR-004**: System MUST allow managing the visibility and aggregation of financial categories.
- **FR-005**: System MUST provide quick-action links for common tasks (New Mission, New Project).
- **FR-006**: System MUST persist configuration settings (like financial row visibility) in a persistent data store.
- **FR-007**: System MUST provide a feedback management interface to review and update submission statuses.

### Key Entities *(include if feature involves data)*

- **AdminSession**: Represents a logged-in state. Attributes: UserID, Expiry, Token.
- **AdminSetting**: Configuration values for the site. Attributes: Key, Value (JSON), Type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Unauthorized users are 100% blocked from accessing protected admin routes.
- **SC-002**: The admin dashboard loads in under 1 second, providing an immediate overview of site status.
- **SC-003**: Changes made in the admin panel (like category visibility) are reflected on the public site within 2 seconds.
- **SC-004**: Administrators report that the dashboard correctly summarizes the current state of missions and projects.