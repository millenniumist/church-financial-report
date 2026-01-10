# Feature Specification: Project Tracking

**Feature Branch**: `005-project-tracking`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "Tracking and displaying church development projects and fundraising progress"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monitor Fundraising Progress (Priority: P1)

As a church member, I want to see the progress of current development projects so that I can see how my donations are contributing to the church's growth.

**Why this priority**: Motivates support and provides transparency on large-scale initiatives.

**Independent Test**: Can be tested by visiting the projects page and verifying that each project displays a progress bar and accurate financial figures.

**Acceptance Scenarios**:

1. **Given** a project with a target of 1,000,000 THB and current funding of 500,000 THB, **When** I view the projects page, **Then** I should see a progress bar filled at 50%.
2. **Given** a project card, **When** I look at the details, **Then** I should see the target amount, current amount, and the remaining amount needed.

---

### User Story 2 - Learn About Development Goals (Priority: P1)

As a donor, I want to read descriptions and see images of future projects so that I understand the purpose and impact of the fundraising.

**Why this priority**: Essential for building trust and interest in specific causes.

**Independent Test**: Can be tested by verifying that project descriptions and image carousels are correctly rendered for active projects.

**Acceptance Scenarios**:

1. **Given** a project has multiple photos, **When** I view the project, **Then** I should be able to swipe or click through an image carousel.
2. **Given** a project with a description, **When** it is displayed, **Then** the text should be clear and informative.

---

### User Story 3 - Admin: Update Project Status (Priority: P2)

As an administrator, I want to update the current funding amount and priority of projects so that the community sees the most up-to-date information.

**Why this priority**: Ensures the accuracy of progress tracking.

**Independent Test**: Can be tested via the admin panel by changing a project's current amount and verifying the update on the public projects page.

**Acceptance Scenarios**:

1. **Given** a donation was received, **When** I update the current amount in the admin panel, **Then** the public progress bar should update immediately.
2. **Given** a new project is ready, **When** I create it and set it to "active", **Then** it should appear on the projects page according to its priority level.

---

### Edge Cases

- **Goal Reached**: When a project reaches 100% of its goal, the system should still display it (perhaps marked as "Funded") or allow administrators to move it to a "Completed" status.
- **Zero Target**: If a project is created with a target of 0 (invalid state), the system should handle it gracefully without crashing, perhaps showing a fallback state.
- **Inactive Projects**: Projects marked as inactive should not be visible to the public, even if they have active funding records.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list of active development projects.
- **FR-002**: System MUST calculate and display a visual progress bar for each project.
- **FR-003**: System MUST show the Target Amount, Current Amount, and Remaining Balance for each project.
- **FR-004**: System MUST support image carousels for project-related media.
- **FR-005**: System MUST allow sorting projects by priority level.
- **FR-006**: System MUST provide an administrative CRUD interface for project management.
- **FR-007**: System MUST format all currency values according to Thai standards (฿ and commas).

### Key Entities *(include if feature involves data)*

- **FutureProject**: Represents a fundraising initiative. Key attributes: Name, Description, Target Amount, Current Amount, Priority, IsActive, Images (URL Array).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Progress bars accurately reflect the percentage of funding to within 1%.
- **SC-002**: Administrators can update a project's current funding amount in under 30 seconds.
- **SC-003**: The projects page remains responsive and readable on screens as small as 320px wide.
- **SC-004**: Currency formatting is consistent across all project cards.