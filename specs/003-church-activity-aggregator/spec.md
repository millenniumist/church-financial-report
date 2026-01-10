# Feature Specification: Church Activity Aggregator

**Feature Branch**: `003-church-activity-aggregator`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "Aggregating and displaying church activities and events from the main church website"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Church Ministries (Priority: P1)

As a visitor to the website, I want to see a list of regular church activities and cell groups so that I can find a community to join.

**Why this priority**: Essential for newcomer engagement and community building.

**Independent Test**: Can be tested by visiting the ministries page and verifying the "Main Activities" section contains correctly titled items with their schedules.

**Acceptance Scenarios**:

1. **Given** there are recurring ministries on the main website, **When** I view the ministries page, **Then** I should see a grid of ministry cards displaying titles and schedules.
2. **Given** a ministry card, **When** I read the description, **Then** it should provide a helpful summary of what the activity is about.

---

### User Story 2 - Stay Updated on Special Events (Priority: P1)

As a church member, I want to see upcoming special events and one-time gatherings so that I can prepare and participate.

**Why this priority**: Keeps members informed about important seasonal or special occasions.

**Independent Test**: Can be tested by checking the "Special Events" section for recent data synced from the main site's events page.

**Acceptance Scenarios**:

1. **Given** there are upcoming events in the church calendar, **When** I visit the ministries page, **Then** I should see them listed with their specific dates and times.
2. **Given** a special event card, **When** it is displayed, **Then** it should highlight the date clearly.

---

### User Story 3 - Automated Content Refresh (Priority: P2)

As a site administrator, I want the activity data to be automatically updated from the main church website so that I don't have to manually maintain two different sites.

**Why this priority**: Reduces administrative overhead and ensures consistency across platforms.

**Independent Test**: Can be tested by running the extraction script and verifying the `site-data.json` file is updated with current content from the source URL.

**Acceptance Scenarios**:

1. **Given** the source website has been updated with a new event, **When** the aggregation script runs, **Then** the new event should appear on the ministries page without manual intervention.

---

### Edge Cases

- **Source Site Down**: If the main church website is unreachable, the system should serve the last successfully aggregated data rather than showing an error.
- **Empty Sections**: If there are no upcoming events, the system should display a placeholder message encouraging users to check social media for updates.
- **Changed Source Structure**: If the main website changes its HTML structure, the aggregator should gracefully handle missing fields and log the issue for developers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST scrape content from the specified source URL (www.chonburichurch.com).
- **FR-002**: System MUST parse "Recurring Ministries" (Main Activities) from the source.
- **FR-003**: System MUST parse "Upcoming Events" (Special Events) from the source.
- **FR-004**: System MUST store the aggregated data in a local JSON format for fast access.
- **FR-005**: System MUST display ministries and events in a responsive, mobile-friendly layout.
- **FR-006**: System MUST include a timestamp of the last data extraction.
- **FR-007**: System MUST provide fallback content when no data is available from the source.

### Key Entities *(include if feature involves data)*

- **Ministry**: Represents a recurring activity. Attributes: Title, Schedule, Description.
- **Event**: Represents a specific upcoming occasion. Attributes: Title, Date, Schedule, Description.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Data synchronization from the source website completes in under 15 seconds.
- **SC-002**: The ministries page displays at least 5 regular activities if they exist on the source site.
- **SC-003**: 100% of special events listed on the source site are accurately reflected on the aggregator page.
- **SC-004**: Page load time for the ministries section is under 1.5 seconds (using local cache).