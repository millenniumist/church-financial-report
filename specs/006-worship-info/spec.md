# Feature Specification: Worship Info

**Feature Branch**: `006-worship-info`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "Providing worship schedules and information for visitors and members"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Service Times (Priority: P1)

As a member or visitor, I want to know exactly when and where the Sunday worship service takes place so that I can attend on time.

**Why this priority**: Fundamental information for participating in church life.

**Independent Test**: Can be tested by visiting the worship page and verifying that at least one Sunday service time is displayed.

**Acceptance Scenarios**:

1. **Given** service times are configured in the system, **When** I view the worship page, **Then** I should see the day, event name, and time clearly displayed in a prominent card.
2. **Given** there is a Facebook Live link, **When** I look at the service times, **Then** I should also see an option to watch the service online.

---

### User Story 2 - Explore Weekly Activities (Priority: P2)

As a member looking to deepen my involvement, I want to see a schedule of weekday activities like prayer nights and home visits so that I can join them.

**Why this priority**: Encourages participation beyond Sunday services.

**Independent Test**: Can be tested by checking the "Weekly Activities" section for visiting times, prayer nights, etc.

**Acceptance Scenarios**:

1. **Given** weekly activities exist in the database, **When** I scroll to the activities section, **Then** I should see cards for "Visiting", "Home Worship", and "Prayer Night" with their respective times.

---

### User Story 3 - Information for New Visitors (Priority: P2)

As someone who hasn't been to this church before, I want to know what to expect during a service so that I feel comfortable attending for the first time.

**Why this priority**: Lowers the barrier for new people to visit the church.

**Independent Test**: Can be tested by verifying the "What to Expect" and "First Time Visitors" sections provide helpful, welcoming content.

**Acceptance Scenarios**:

1. **Given** I am a first-time visitor, **When** I read the "What to Expect" section, **Then** I should see information about music, sermons, prayer, and fellowship.
2. **Given** I have questions about visiting, **When** I read the "First Time Visitors" card, **Then** I should see encouraging text about attire and where to find help.

---

### Edge Cases

- **No Data Configured**: If no worship times are found in the database, the system should show a helpful message advising users to contact the administrator or check back later.
- **Link Unavailable**: If the Facebook Live link is missing from the configuration, the "Watch Live" section should be hidden entirely.
- **Holiday Schedule Changes**: The system should allow administrators to easily update these times for special holidays (e.g., Christmas or Easter).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display Sunday worship service times from the database.
- **FR-002**: System MUST display a schedule of recurring weekly activities.
- **FR-003**: System MUST provide a dedicated section with information specifically for first-time visitors.
- **FR-004**: System MUST describe the core components of the worship service (Music, Sermon, Prayer, etc.).
- **FR-005**: System MUST provide a direct link to the church's Facebook Live stream if available.
- **FR-006**: System MUST fetch information from the unified "Contact/Site Info" data source.
- **FR-007**: System MUST use a welcoming and professional design suitable for a spiritual community.

### Key Entities *(include if feature involves data)*

- **WorshipTime**: Represents a scheduled service or activity. Attributes: Day, Event Name, Time.
- **SocialLink**: Configuration for external platforms. Attribute: Facebook Live URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visitors can find the primary Sunday service time within 5 seconds of landing on the worship page.
- **SC-002**: 100% of information displayed on the worship page is synchronized with the latest admin settings.
- **SC-003**: The page loads in under 1.5 seconds due to efficient database queries.
- **SC-004**: The "First Time?" section is visually distinct and easy to locate.