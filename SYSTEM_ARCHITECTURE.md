# System Architecture Document

## Overview

This document provides a comprehensive overview of the cc-financial system architecture. The system is a Next.js-based web application designed for managing church financial data, projects, missions, bulletins, and administrative content. It integrates with Google Sheets for financial data synchronization and supports multilingual content management.

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.7 with React 19.2.1
- **Styling**: Tailwind CSS v4.1.16
- **UI Components**: Radix UI components
- **Animations**: Framer Motion v12.23.24
- **3D Graphics**: Three.js v0.180.0 with React Three Fiber
- **Charts**: Recharts v3.2.1

### Backend
- **Runtime**: Node.js 20 (Alpine Linux in Docker)
- **Database**: PostgreSQL with Prisma ORM v6.19.0
- **Authentication**: Custom session-based auth with HTTP-only cookies
- **API**: Next.js API routes with middleware logging
- **Caching**: Built-in Next.js caching with custom cache layer

### External Integrations
- **Google Sheets**: Financial data source via Google APIs
- **Cloudinary**: Image storage and management
- **Elasticsearch**: Log aggregation and analysis

### Development & Deployment
- **Build Tool**: Turbopack (Next.js built-in)
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for self-hosting
- **Monitoring**: Health checks and automated failover
- **Backup/Restore**: Automated database and file backups

## Database Schema

The system uses PostgreSQL with the following core models:

### Core Models
- **FinancialRecord**: Monthly financial data (income, expenses, balance)
- **FutureProject**: Fundraising projects with progress tracking
- **Mission**: Church missions with multilingual content
- **ContactInfo**: Church contact information
- **NavigationItem**: Site navigation structure
- **PageContent**: Dynamic page content sections
- **Bulletin**: Church bulletins with file management

### Supporting Models
- **FinancialCategory**: Income/expense categories with visibility settings
- **CategorySettings**: Year-specific category configurations
- **PathConfig**: Dynamic route enablement/disablement configuration

All models include standard audit fields (createdAt, updatedAt) and use CUID for primary keys.

## Application Structure

### Frontend Pages
- **Public Pages**: Home, About, Financial, Ministries, Missions, Projects, Bulletins, Contact, Worship
- **Admin Panel**: Protected routes for content management
  - Authentication (/admin/login)
  - CRUD operations for all content types
  - File upload management

### API Endpoints
- **Public APIs**:
  - `/api/financial-data`: Financial overview with caching
  - `/api/categories`: Financial categories listing
  - `/api/projects`: Project listings
  - `/api/missions`: Mission content
  - `/api/bulletins`: Bulletin management
  - `/api/navigation`: Site navigation
  - `/api/contact`: Contact information
  - `/api/page-content`: Dynamic content
  - `/api/health`: System health checks

- **Admin APIs**:
  - `/api/admin/*`: CRUD operations for all models
  - `/api/admin/config/paths`: Route configuration management
  - `/api/admin/login/logout`: Authentication
  - `/api/admin/upload`: File uploads to Cloudinary

- **System APIs**:
  - `/api/sync-financial`: Google Sheets synchronization
  - `/api/debug-sheets`: Development debugging

## Authentication & Authorization

### Authentication Mechanism
- Simple username/password authentication
- Session-based with HTTP-only cookies (24-hour expiry)
- Secure cookie settings (httpOnly, secure in production, sameSite strict)
- Automatic redirect to login for protected routes

### Admin Panel Security
- Route-level protection using middleware
- Session verification on every admin page load
- API key authentication for sensitive operations (financial sync)

## External Integrations

### Google Sheets Integration
- **Purpose**: Source of truth for financial data
- **Authentication**: Service account with readonly access
- **Data Flow**: Scheduled/API-triggered sync to database
- **Active Sheet**: "Monthly" (financial data with income/expense categories)
- **Available Function**: "Project" sheet reader exists but not currently used
- **Processing**: Automatic category detection and data parsing

### Cloudinary Integration
- **Purpose**: Image storage and optimization
- **Features**: Automatic uploads, transformations, CDN delivery
- **Usage**: Bulletin files, mission images, project photos
- **Backup**: Local file storage with Cloudinary URLs

### Elasticsearch Integration
- **Purpose**: Centralized logging and monitoring
- **Configuration**: Pino logger with Elasticsearch transport
- **Features**: Structured logging, search, and analytics
- **Optional**: Can be disabled for simpler deployments

### Deployment Architecture

### GitOps Deployment (Push-Driven)
- **Mechanism**: GitHub webhook triggers deployment on Raspberry Pi
- **Components**:
  - `webhook.py`: Listens for GitHub push events
  - `deploy.sh`: Orchestrates build and deployment
  - `bootstrap.sh`: One-time server provisioning
- **Features**:
  - **Versioned Releases**: Deploys to timestamped folders
  - **Multi-Stack Support**: Configurable via `stacks.conf`
  - **Automatic Rollback**: Reverts to previous release on failure
  - **Polling Fallback**: Background timer checks for updates if webhook fails

### Containerization
- **Multi-stage Docker build**:
  - Dependencies stage: Node.js Alpine with package installation
  - Builder stage: Application build and Prisma generation
  - Runner stage: Production runtime with non-root user

- **Docker Compose Setup**:

### Infrastructure Features
- **Health Monitoring**: Automated health checks with Discord notifications and MQTT publishing
- **Backup System**: Database dumps and file backups with automated scripts
- **Cleanup Management**: Automated log rotation and file cleanup
- **Hot-swap Database**: Automatic failover to secondary database with configurable thresholds
- **Centralized Logging**: Elasticsearch integration with health check filtering
- **Remote Access**: Tailscale VPN for secure external connectivity

### Port Configuration
- **Application Port**: 8358 (configurable via PORT environment variable)
- **Health Checks**: Integrated `/api/health` endpoint
- **External Access**: Nginx reverse proxy recommended

### Database Hot-Swap Failover

The system implements automatic database failover with the following architecture:

```
┌─────────────────────────────────────────┐
│  Application (Next.js + Prisma)        │
├─────────────────────────────────────────┤
│  Database Connection Manager            │
│  - Health Checks (30s intervals)        │
│  - Failure Detection (3 failures)       │
│  - Automatic Failover/Failback          │
└──────────┬──────────────────┬───────────┘
           │                  │
    ┌──────▼──────┐    ┌─────▼──────────┐
    │   Primary   │    │   Secondary    │
    │  Database   │    │   Database     │
    │ (Local Pi)  │    │ (Cloud/Backup) │
    └─────────────┘    └────────────────┘
```

**Configuration Variables:**
- `DATABASE_URL`: Primary database connection string
- `DATABASE_URL_SECONDARY`: Secondary database for failover (enables hot-swap)
- `DB_HEALTH_CHECK_INTERVAL`: Health check frequency (default: 30000ms)
- `DB_CONNECTION_TIMEOUT`: Connection timeout (default: 5000ms)
- `DB_FAILURE_THRESHOLD`: Failures before failover (default: 3)
- `DB_PRIMARY_RETRY_INTERVAL`: Primary retry interval when on secondary (default: 120000ms)

**Example Configuration:**
```bash
DATABASE_URL="postgresql://ccfinapp:****@localhost:5432/cc_financial"
DATABASE_URL_SECONDARY="postgresql://user:****@cloud-db-host:5432/cc_financial"
```

**Failover Process:**
1. Continuous health checks every 30 seconds
2. After 3 consecutive failures, automatic switch to secondary
3. Automatic failback when primary recovers
4. Zero downtime with seamless switching

### Health Monitoring & Alerting

**Health Monitor Service:**
- **Container Status**: Docker container running state
- **HTTP Availability**: Application endpoint responsiveness
- **Response Time**: HTTP response time tracking
- **System Metrics**: Memory and CPU usage
- **Database Connectivity**: Primary/secondary database status

**Discord Notifications:**
- **Bot Integration**: Pre-configured Discord bot for alerts
- **Alert Triggers**: Container crashes, HTTP failures, state changes
- **Cooldown Period**: 5-minute minimum between duplicate alerts
- **Recovery Alerts**: Automatic notifications when issues resolve

**Configuration:**
```bash
# Health Monitor
ENABLE_HEALTH_MONITOR=true
APP_URL=http://localhost:8358
CONTAINER_NAME=nextjs-app
HEALTH_ENDPOINT=/api/health
CHECK_INTERVAL=60000

# Discord Bot
DISCORD_BOT_TOKEN=<discord-bot-token>      # Use the value stored in deployment/.env
DISCORD_CHANNEL_ID=<discord-channel-id>    # Use the channel ID stored in deployment/.env
```

**MQTT Publishing for Home Assistant:**
- **Broker**: Local MQTT server (Mosquitto)
- **Topics**: `homeassistant/sensor/cc-church/*`
- **Sensors**: Status, response time, memory, CPU, uptime
- **Discovery**: Automatic Home Assistant device discovery

**Configuration:**
```bash
MQTT_BROKER=mqtt://192.168.x.x:1883
MQTT_TOPIC=homeassistant/sensor/cc-church
MQTT_USERNAME=<mqtt-username>
MQTT_PASSWORD=<mqtt-password>
```

### Centralized Logging with Elasticsearch

**Logging Architecture:**
- **Pino Logger**: Structured JSON logging with ECS compliance
- **Elasticsearch Transport**: Direct shipping to Elasticsearch cluster
- **Health Check Filtering**: Automatic exclusion of health endpoints from logs
- **Kibana Integration**: Web interface for log analysis and visualization

**Configuration:**
```bash
# Elasticsearch
ENABLE_ELASTICSEARCH=true
ELASTICSEARCH_VERSION=8.11.0
ELASTICSEARCH_NODE=http://localhost:9200

# Logging
LOG_LEVEL=info
LOG_BODY_LIMIT=4096
```

**Log Filtering:**
- Health check endpoints (`/api/health`) automatically excluded
- Sensitive headers redacted (authorization, cookies, API keys)
- Request/response body truncation for large payloads
- Structured fields for Kibana analysis

### Remote Access & Networking

**Tailscale VPN:**
- **Purpose**: Secure remote access without port forwarding
- **Configuration**: Optional installation during deployment
- **Authentication**: Pre-auth keys or manual device approval
- **Use Cases**: Remote MQTT access, SSH via domain

**Configuration:**
```bash
ENABLE_TAILSCALE=false
TAILSCALE_AUTH_KEY=tskey-auth-xxxxxxxxxx  # Optional pre-auth key
```

**Network Architecture:**
```
Internet → Cloudflare Tunnel → Tailscale → Local Network → Application
                                      │
                                      └─ MQTT Broker (1883)
                                      └─ SSH (22)
                                      └─ Application (8358)
```

### Backup & Recovery

**Automated Backup System:**
- **Database Backups**: PostgreSQL dumps with encryption
- **File Backups**: Bulletin files and user uploads
- **Schedule**: Cron-based automated backups
- **Storage**: Local and optional cloud storage

**Configuration:**
- Backup scripts in `deployment/scripts/`
- Cron job setup via `setup-cron.sh`
- Encryption for sensitive data

## System Architecture Diagrams

### Complete System Overview

```mermaid
graph TB
    subgraph "Users & Access"
        WEB[🌐 Web Users<br/>Public Access]
        ADMIN[👑 Admin Users<br/>Protected Access]
        REMOTE[📱 Remote Access<br/>Tailscale VPN]
    end

    subgraph "Edge & Security"
        CF[☁️ Cloudflare<br/>CDN, DNS, WAF<br/>Tunnel]
        CF_WORKER[⚡ Cloudflare Worker<br/>External Health Monitor<br/>Edge Network]
        TS[🔒 Tailscale<br/>Zero-Trust Network]
        FW[🛡️ Firewall<br/>UFW Rules]
    end

    subgraph "Application Stack"
        NEXT[⚛️ Next.js App<br/>Port 8358<br/>React 19 + API Routes]
        HEALTH[💓 Health Monitor<br/>Discord + MQTT]
    end

    subgraph "Data & Storage"
        POSTGRES[(🐘 PostgreSQL<br/>Primary + Hot-swap<br/>Prisma ORM)]
        ELASTIC[(🔍 Elasticsearch<br/>Centralized Logs<br/>Kibana UI)]
    end

    subgraph "External Integrations"
        GSHEETS[📊 Google Sheets<br/>Financial Data Source<br/>Service Account Auth]
        CLOUDINARY[☁️ Cloudinary<br/>File Storage & CDN<br/>Image Optimization]
        DISCORD[💬 Discord<br/>Health Alerts<br/>Bot Integration]
        HOMEA[🏠 Home Assistant<br/>MQTT Sensors<br/>Smart Home]
    end

    subgraph "Infrastructure"
        RASPI[🖥️ Raspberry Pi<br/>Local Server<br/>Docker Host]
        DOCKER[🐳 Docker Engine<br/>Container Runtime<br/>Compose Orchestration]
        MQTT_BROKER[(📡 Mosquitto<br/>MQTT Broker<br/>Port 1883)]
        BACKUP[💾 Backup System<br/>Automated Scripts<br/>Encrypted Storage]
    end

    subgraph "Development & CI/CD"
        GIT[📚 Git Repository<br/>Source Control<br/>Version Management]
        BUILD[🔨 Docker Build<br/>Multi-stage<br/>Production Images]
        DEPLOY[🚀 Auto Deploy<br/>Remote Scripts<br/>Zero-downtime]
    end

    WEB --> CF
    ADMIN --> CF
    REMOTE --> TS

    CF --> TS
    TS --> FW
    FW --> NEXT

    NEXT --> POSTGRES
    NEXT --> ELASTIC

    NEXT --> GSHEETS
    NEXT --> CLOUDINARY

    HEALTH --> DISCORD
    HEALTH --> HOMEA
    HEALTH --> MQTT_BROKER

    RASPI --> DOCKER
    DOCKER --> NEXT
    DOCKER --> HEALTH
    DOCKER --> MQTT_BROKER
    DOCKER --> ELASTIC

    GIT --> BUILD
    BUILD --> DEPLOY
    DEPLOY --> RASPI

    BACKUP -.-> POSTGRES
    BACKUP -.-> ELASTIC
    BACKUP -.-> DOCKER

    style NEXT fill:#e1f5fe
    style POSTGRES fill:#f3e5f5
    style HEALTH fill:#e8f5e8
    style RASPI fill:#fff3e0
```

### High-Level System Architecture

```mermaid
graph TB
    subgraph "User Layer"
        U[Users]
        A[Admins]
    end

    subgraph "Edge Layer"
        CF[Cloudflare<br/>CDN & DNS]
        TS[Tailscale VPN<br/>Remote Access]
    end

    subgraph "Application Layer"
        NJS[Next.js App<br/>Port 8358]
        HM[Health Monitor<br/>Service]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Primary)]
        PGS[(PostgreSQL<br/>Secondary<br/>Hot-swap)]
        ES[(Elasticsearch<br/>Logs)]
    end

    subgraph "External Services"
        GS[Google Sheets<br/>Financial Data]
        CL[Cloudinary<br/>File Storage]
        DC[Discord<br/>Notifications]
        HA[Home Assistant<br/>MQTT]
    end

    subgraph "Infrastructure"
        PI[Raspberry Pi<br/>Local Server]
        MQTT[(Mosquitto<br/>MQTT Broker)]
        DK[Docker<br/>Containers]
    end

    U --> CF
    A --> CF
    CF --> TS
    TS --> NJS
    NJS --> HM
    NJS --> PG
    NJS --> PGS
    NJS --> GS
    NJS --> CL
    HM --> DC
    HM --> MQTT
    MQTT --> HA
    NJS --> ES
    PG -.-> PGS
    PI --> DK
    DK --> NJS
    DK --> HM
    DK --> MQTT
```

### Database Hot-Swap Architecture

```mermaid
graph TD
    subgraph "Application"
        APP[Next.js + Prisma]
        CM[Connection Manager]
    end

    subgraph "Health Monitoring"
        HC[Health Checks<br/>30s intervals]
        FD[Failure Detection<br/>3 consecutive failures]
        FO[Automatic Failover]
        FB[Automatic Failback]
    end

    subgraph "Databases"
        P[(Primary DB<br/>Local PostgreSQL)]
        S[(Secondary DB<br/>Cloud PostgreSQL)]
    end

    APP --> CM
    CM --> HC
    HC --> FD
    FD --> FO
    FO --> P
    FO --> S
    FB --> P
    FB --> S

    P -.->|Failover| S
    S -.->|Failback| P
```

### Health Monitoring & Alerting Flow

```mermaid
graph TD
    subgraph "Internal Monitoring (Local)"
        HM[Health Monitor<br/>Service] --> CHK{Health Checks}
        CHK -->|Every 60s| CNT[Container Status]
        CHK -->|Every 60s| HTTP[HTTP Response]
        CHK -->|Every 60s| MET[Memory/CPU Metrics]

        CNT --> AGG[Aggregate Results]
        HTTP --> AGG
        MET --> AGG

        AGG --> DEC{Status Decision}
        DEC -->|Healthy| MQTT[Publish to MQTT]
        DEC -->|Unhealthy| ALERT[Send Discord Alert]
    end

    subgraph "External Monitoring (Cloudflare Edge)"
        CF_WORKER[⚡ Cloudflare Worker<br/>Health Watcher] --> EXT_CHK{External Health Check}
        EXT_CHK -->|Every 60s| EXT_HTTP[HTTP from Internet<br/>millenniumist.dpdns.org]
        EXT_HTTP --> EXT_DEC{External Status}
        EXT_DEC -->|Unhealthy| EXT_ALERT[Discord Alert<br/>External Monitor]
        EXT_DEC -->|Recovered| EXT_REC[Recovery Alert]
    end

    subgraph "Alerting & Integration"
        ALERT --> DC[Discord Channel]
        EXT_ALERT --> DC
        EXT_REC --> DC
        MQTT --> HA[Home Assistant<br/>Dashboard]
    end

    DEC -->|State Change| REC[Recovery Alert<br/>When fixed]
    REC --> DC
```

### Data Synchronization Architecture

```mermaid
graph TD
    subgraph "Data Sources"
        GS[Google Sheets<br/>Monthly Financial Data<br/>Sheet]
    end

    subgraph "Sync Process"
        API[Sync API<br/>/api/sync-financial]
        AUTH[API Key Auth<br/>Required]
        PARSE[Parse Sheets Data<br/>Categories & Values]
        VAL[Validate Data<br/>Structure]
        UPS[Upsert to Database<br/>Financial Records]
    end

    subgraph "Storage"
        DB[(PostgreSQL<br/>Financial Records)]
    end

    GS --> API
    API --> AUTH
    AUTH --> PARSE
    PARSE --> VAL
    VAL --> UPS
    UPS --> DB
```

### Logging & Monitoring Architecture

```mermaid
graph TD
    subgraph "Application Logs"
        PIN[Pino Logger<br/>Structured JSON<br/>Console Output]
        FIL[Health Check Filter<br/>Exclude /api/health]
        RED[Data Redaction<br/>Sensitive Headers]
    end

    subgraph "Transport Layer"
        EST[pino-elasticsearch<br/>Not Configured]
        MQTT2[MQTT Publisher<br/>Health Metrics]
    end

    subgraph "Storage & Analysis"
        ES[(Elasticsearch<br/>Log Storage)]
        KIB[Kibana<br/>Log Analysis]
        HA2[Home Assistant<br/>Health Dashboard]
    end

    subgraph "Alerting"
        DC2[Discord Bot<br/>Health Alerts]
    end

    PIN --> FIL
    FIL --> RED
    RED -.-> EST
    EST -.-> ES
    ES --> KIB

    PIN --> MQTT2
    MQTT2 --> HA2

    FIL --> DC2

    style EST fill:#ffcccc,stroke:#ff0000,stroke-dasharray: 5 5
```

### Network & Security Architecture

```mermaid
graph TD
    subgraph "Internet"
        USR[Users]
        ADM[Admins]
    end

    subgraph "Edge Security"
        CF2[Cloudflare<br/>WAF & DDoS]
        TS2[Tailscale<br/>VPN Gateway]
    end

    subgraph "Local Network"
        FW[Firewall<br/>UFW]
        APP2[Application<br/>Port 8358]
    end

    subgraph "Internal Services"
        DB2[(PostgreSQL)]
        MQTT3[(MQTT Broker<br/>Port 1883)]
        ES2[(Elasticsearch<br/>Port 9200)]
    end

    USR --> CF2
    ADM --> CF2
    CF2 --> TS2
    TS2 --> FW
    FW --> APP2
    APP2 --> DB2
    APP2 --> MQTT3
    APP2 --> ES2
```

### API Architecture & Data Flow

```mermaid
graph TD
    subgraph "Client Layer"
        WEB[Web Browser<br/>Next.js Client]
        ADM2[Admin Panel<br/>React Components]
    end

    subgraph "API Layer"
        PUB[Public APIs<br/>No Auth Required]
        ADM3[Admin APIs<br/>Session Auth Required]
        SYS[System APIs<br/>API Key Required]
    end

    subgraph "Business Logic"
        AUTH[Authentication<br/>Session Management]
        FIN[Financial Service<br/>Data Processing]
        CONT[Content Management<br/>CRUD Operations]
        SYNC[Data Synchronization<br/>Google Sheets]
    end

    subgraph "Data Access"
        PRIS[Prisma ORM<br/>Database Queries]
        EXT[External APIs<br/>Google, Cloudinary]
    end

    subgraph "Storage"
        DB3[(PostgreSQL<br/>Primary)]
        DB4[(PostgreSQL<br/>Secondary)]
        GS3[Google Sheets]
        CL2[Cloudinary]
        ES3[Elasticsearch]
    end

    WEB --> PUB
    ADM2 --> ADM3
    ADM2 --> SYS

    PUB --> AUTH
    ADM3 --> AUTH
    SYS --> AUTH

    AUTH --> PRIS
    FIN --> PRIS
    CONT --> PRIS
    SYNC --> PRIS

    PRIS --> DB3
    PRIS --> DB4

    FIN --> EXT
    CONT --> EXT
    SYNC --> EXT

    EXT --> GS3
    EXT --> CL2
    EXT --> ES3
```

### Component Architecture

```mermaid
graph TD
    subgraph "Page Components"
        LAND[Landing Pages<br/>Hero, Promo, Footer]
        FIN2[Financial Pages<br/>Charts, Tables, Display]
        ADM4[Admin Pages<br/>CRUD Interfaces]
        PUB2[Public Pages<br/>About, Ministries, etc.]
    end

    subgraph "UI Components"
        CHART[Chart Components<br/>Recharts Integration]
        FORM[Form Components<br/>Admin CRUD Forms]
        DISP[Display Components<br/>Data Visualization]
        NAV[Navigation<br/>Sticky Nav, Menus]
    end

    subgraph "Shared Components"
        LAYOUT[Layout Components<br/>PageWrapper, AnimatedSection]
        UTIL[Utility Components<br/>ImageCarousel, ShaderBackground]
        UI[UI Library<br/>Radix UI + Tailwind]
    end

    subgraph "Business Logic"
        HOOK[Custom Hooks<br/>Data Fetching, State]
        UTIL2[Utility Functions<br/>Date, Format, Validation]
        API[API Client<br/>Fetch Wrappers]
    end

    subgraph "External Libraries"
        NEXT[Next.js<br/>Framework]
        REACT[React 19<br/>Runtime]
        TAIL[Tailwind CSS<br/>Styling]
        FRAM[Framer Motion<br/>Animations]
        THREE[Three.js<br/>3D Graphics]
    end

    LAND --> UI
    FIN2 --> UI
    ADM4 --> UI
    PUB2 --> UI

    UI --> LAYOUT
    UI --> UTIL
    UI --> CHART
    UI --> FORM
    UI --> DISP
    UI --> NAV

    LAYOUT --> HOOK
    UTIL --> HOOK
    CHART --> HOOK
    FORM --> HOOK

    HOOK --> UTIL2
    HOOK --> API

    API --> NEXT
    UTIL2 --> NEXT
    HOOK --> REACT
    UI --> TAIL
    UTIL --> FRAM
    UTIL --> THREE
```

### Deployment & CI/CD Architecture

```mermaid
graph TD
    subgraph "Development"
        GIT[Git Repository<br/>Source Code]
        LOCAL[Local Development<br/>Docker Compose]
    end

    subgraph "Build Process"
        DOCKER[Docker Build<br/>Multi-stage]
    end

    subgraph "Deployment"
        REMOTE[Raspberry Pi<br/>Target Server]
        DOCKER2[Docker Compose<br/>Production Stack]
    end

    subgraph "Infrastructure Setup"
        POSTGRES[PostgreSQL Setup<br/>Auto-install]
        ELASTIC[Elasticsearch Setup<br/>Optional]
        MQTT4[Mosquitto Setup<br/>MQTT Broker]
        TAIL[Tailscale Setup<br/>VPN - Optional]
    end

    subgraph "Monitoring"
        HEALTH[Health Monitor<br/>Auto-start]
        LOGS[Centralized Logging<br/>Elasticsearch]
        ALERTS[Discord Alerts<br/>Health Notifications]
    end

    GIT --> DOCKER
    DOCKER --> REMOTE

    REMOTE --> DOCKER2

    DOCKER2 --> POSTGRES
    DOCKER2 --> ELASTIC
    DOCKER2 --> MQTT4
    DOCKER2 --> TAIL

    POSTGRES --> HEALTH
    ELASTIC --> LOGS
    MQTT4 --> ALERTS

    LOCAL -.->|Development| DOCKER
```

## Environment Configuration Reference

**Core Application:**
```bash
# Database (credentials redacted)
DATABASE_URL="postgresql://ccfinapp:****@localhost:5432/cc_financial"
DATABASE_URL_SECONDARY="postgresql://user:****@cloud-db-host:5432/cc_financial"

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=****  # Change from default

# External Services
GOOGLE_SHEETS_SPREADSHEET_ID=****  # Your spreadsheet ID
GOOGLE_SERVICE_ACCOUNT_JSON="****"  # Or GOOGLE_SERVICE_ACCOUNT_PATH

CLOUDINARY_CLOUD_NAME=****
CLOUDINARY_API_KEY=****
CLOUDINARY_API_SECRET=****

# Sync Security
SYNC_API_KEY=****  # Secure API key for sync operations
```

**Deployment & Infrastructure:**
```bash
# Container
NODE_ENV=production
PORT=8358
NEXT_TELEMETRY_DISABLED=1

# Health & Monitoring
ENABLE_HEALTH_MONITOR=true
CHECK_INTERVAL=60000
DISCORD_CHANNEL_ID=****  # Your Discord channel ID

# MQTT (credentials redacted)
MQTT_BROKER=mqtt://192.168.x.x:1883
MQTT_USERNAME=ccchurch
MQTT_PASSWORD=****

# Elasticsearch
ENABLE_ELASTICSEARCH=true
ELASTICSEARCH_NODE=http://localhost:9200

# Remote Access
ENABLE_TAILSCALE=false
TAILSCALE_AUTH_KEY=****  # Optional pre-auth key

# GitOps (Deployment)
WEBHOOK_SECRET=****      # Secret for GitHub webhook signature
ROLLBACK_MODE=failed     # 'failed' or 'all'
SYNC_PATHS=content/site-data.json # Files to persist across deploys
```

## Centralized Logging with Elasticsearch

### Current Logging Architecture

**Pino Logger Configuration:**
- **Structured Logging**: JSON format with ECS compliance (logs to stdout/stderr)
- **Transport Layer**: Pino logs to console output only
- **Health Check Filtering**: Automatic exclusion of `/api/health` endpoints from logging
- **Sensitive Data Protection**: Header redaction and body truncation

**Note**: While `pino-elasticsearch` is installed as a dependency, it's not actively configured in the Pino logger setup. Pino currently provides structured logging to console output without direct Elasticsearch integration.

**Log Structure:**
```json
{
  "level": 30,
  "time": 1638360000000,
  "app": "cc-church-api",
  "env": "production",
  "event_type": "api_request",
  "http_method": "GET",
  "api_path": "/api/financial-data",
  "user_agent": "Mozilla/5.0...",
  "event": {
    "category": "web",
    "type": ["request"],
    "dataset": "cc-church.api",
    "kind": "event"
  },
  "url": {
    "full": "http://localhost:8358/api/financial-data?year=2024",
    "path": "/api/financial-data",
    "domain": "localhost"
  }
}
```

**Configuration Variables:**
- `LOG_LEVEL`: Logging verbosity (default: 'info')
- `LOG_BODY_LIMIT`: Maximum body size to log (default: 4096 bytes)
- `ELASTICSEARCH_NODE`: Elasticsearch endpoint
- `ELASTICSEARCH_ENABLED`: Enable/disable Elasticsearch transport

**Kibana Integration:**
- **Index Pattern**: `cc-church-logs-*`
- **Dashboards**: Pre-configured for API analytics
- **Filtering**: Health checks automatically excluded
- **Retention**: Configurable index lifecycle management

## Discord Notification System

### Alert Architecture

**Discord Bot Integration:**
- **Pre-configured Bot**: Ready-to-use Discord application
- **Channel-based Alerts**: Configurable notification channels
- **Rich Embeds**: Formatted messages with health status details
- **Cooldown Management**: Prevents alert spam

**Alert Types:**
- **Health Alerts**: Application becomes unhealthy
- **Recovery Alerts**: Application returns to healthy state
- **State Changes**: Any status transitions

**Alert Format:**
```
🚨 **CC Church Application Health Alert**

The application health check detected an issue

| Field | Value |
|-------|-------|
| Overall Status | `UNHEALTHY` |
| Container | ❌ Stopped |
| HTTP | ❌ Unavailable |
| Memory Usage | 0 MB |
| CPU Usage | 0.0% |
| Timestamp | 2025-01-14 10:30:00 |
```

**Configuration:**
```bash
DISCORD_BOT_TOKEN=<discord-bot-token>      # Use the value stored in deployment/.env
DISCORD_CHANNEL_ID=<discord-channel-id>    # Use the channel ID stored in deployment/.env
```

### Cloudflare Worker External Health Monitor

**Overview:**
- **Location**: Cloudflare's global edge network (independent of local infrastructure)
- **Purpose**: External monitoring from the internet perspective
- **Frequency**: Every 1 minute via cron trigger
- **Storage**: Cloudflare KV for state persistence
- **Independence**: Completely separate from local health monitor

**Architecture:**
```
🌐 Internet → ⚡ Cloudflare Edge → 🔍 Health Check → 📊 State Analysis → 💬 Discord Alert
```

**Key Features:**
- **External Perspective**: Monitors from outside local network/firewall
- **Edge Computing**: Runs on Cloudflare's global network (200+ locations)
- **State Persistence**: Uses Cloudflare KV to track health state between runs
- **Alert Differentiation**: Clearly marked as "External Monitor" in alerts
- **Independent Failure Detection**: Can detect issues that internal monitor might miss

**Configuration:**
```javascript
// wrangler.toml
name = "cc-church-health-watcher"
main = "health-watcher.js"
triggers = { crons = ["* * * * *"] }  // Every minute

// Environment Variables (Cloudflare Secrets)
DISCORD_BOT_TOKEN=****  // Bot token for alerts
DISCORD_CHANNEL_ID=**** // Discord channel ID
```

**Alert Examples:**
- **Down Alert**: "🚨 CC Church Application Down (External Monitor)"
- **Recovery Alert**: "✅ CC Church Application Recovered"

**Deployment:**
- **Platform**: Cloudflare Workers
- **Scheduling**: Cron triggers
- **Secrets**: Managed via `wrangler secret put`
- **KV Storage**: For state persistence between executions

## MQTT Integration

### Health Monitoring via MQTT

**MQTT Publishing:**
- **Broker**: Local Mosquitto MQTT server
- **Topics**: `homeassistant/sensor/cc-church/*`
- **QoS**: Quality of Service level 1 (at least once delivery)
- **Discovery**: Publishes Home Assistant MQTT discovery configs

**Published Sensors:**
- `sensor.cc_church_status`: Overall health status ("healthy"/"unhealthy")
- `sensor.cc_church_response_time`: HTTP response time in milliseconds
- `sensor.cc_church_memory_usage`: Container memory usage in MB
- `sensor.cc_church_cpu_usage`: Container CPU usage percentage
- `sensor.cc_church_uptime`: Container uptime in seconds

**Note**: The MQTT topics use Home Assistant naming conventions for compatibility, but **Home Assistant is not deployed** as part of this system. The MQTT data can be consumed by any MQTT client or home automation system that supports these topics.

**Example MQTT Client Configuration:**
```bash
# Subscribe to all church sensors
mosquitto_sub -h localhost -t "homeassistant/sensor/cc-church/#" -u ccchurch -P secure-password

# Example sensor data:
# homeassistant/sensor/cc-church/status → "healthy"
# homeassistant/sensor/cc-church/response_time → "45"
# homeassistant/sensor/cc-church/memory_usage → "256"
```

**MQTT Security:**
- **Authentication**: Username/password required
- **Network Isolation**: Local network only (Tailscale for remote)
- **Topic Namespacing**: Church-specific topic prefixes

## Advanced Features

### Cloudflare Integration

**Deployment Options:**
- **Cloudflare Pages**: Static site hosting
- **Cloudflare Workers**: Edge computing for API routes
- **Cloudflare Tunnel**: Secure remote access
- **Cloudflare R2**: Alternative to Cloudinary for file storage

**Configuration:**
```bash
# Cloudflare
CF_ZONE_ID=your-zone-id
CF_ACCOUNT_ID=your-account-id
CF_API_TOKEN=your-api-token
```

### Backup & Disaster Recovery

**Automated Backup System:**
- **Database Backups**: Encrypted PostgreSQL dumps
- **File Backups**: Bulletin PDFs and images
- **Schedule**: Daily automated backups via cron
- **Retention**: Configurable backup history

**Scripts Available:**
- `backup.sh`: Full system backup
- `restore.sh`: Point-in-time recovery
- `cleanup-all.sh`: Automated cleanup of old backups

### Performance Monitoring

**Application Metrics:**
- **Response Times**: API endpoint performance tracking
- **Error Rates**: Application error monitoring
- **Database Queries**: Slow query detection
- **Memory Usage**: Application memory profiling

**Infrastructure Metrics:**
- **Container Stats**: Docker resource usage
- **Network I/O**: Traffic monitoring
- **Disk Usage**: Storage capacity tracking
- **System Load**: CPU and memory system-wide

## Security Considerations

### Authentication & Authorization
- **Session Security**: HTTP-only cookies with secure flags
- **API Key Protection**: Sensitive operations require API keys
- **Password Policies**: Configurable admin credentials

### Data Protection
- **Encryption**: Database connections with SSL/TLS
- **Credential Management**: Environment variable storage
- **Log Sanitization**: Sensitive data redaction
- **Backup Encryption**: Encrypted backup files

### Network Security
- **Firewall Rules**: Restricted database access
- **VPN Access**: Tailscale for remote administration
- **API Security**: Input validation and sanitization
- **CORS Configuration**: Proper cross-origin policies


## Data Flow Architecture

```mermaid
graph TB
    A[User Browser] --> B[Next.js Frontend]
    B --> C[API Routes]
    C --> D[Database Layer]
    C --> E[External Services]

    D --> F[(PostgreSQL)]
    E --> G[Google Sheets]
    E --> H[Cloudinary]
    E --> I[Elasticsearch]

    J[Admin Panel] --> C
    K[Cron Jobs] --> L[Sync API]
    L --> C

    M[File Uploads] --> H
    N[Financial Data] --> G
```

### Data Synchronization Flow

```mermaid
sequenceDiagram
    participant U as User/Admin
    participant A as API Route
    participant G as Google Sheets
    participant P as Prisma
    participant DB as PostgreSQL

    U->>A: Trigger sync (/api/sync-financial)
    A->>G: Fetch data with service account
    G-->>A: Return spreadsheet data
    A->>A: Parse and process data
    A->>P: Create/update records
    P->>DB: Execute queries
    DB-->>P: Confirmation
    P-->>A: Success response
    A-->>U: Sync results
```

## Component Architecture

### UI Components
- **Landing Components**: Hero, promo, navigation, footer
- **Data Visualization**: Charts, tables, financial displays
- **Admin Components**: Forms, lists, navigation
- **Shared Components**: Page wrapper, animated sections

### Key Components
- **FinancialCharts**: Recharts-based visualizations (`IncomeChartSection`, `ExpenseChartSection`, `MonthlyTrendChartSection`)
- **ImageCarousel**: Cloudinary-powered image galleries
- **AdminPanel**: Complete admin interface
- **ShaderBackground**: Three.js background effects
- **LightweightBackground**: CSS-based performant alternative background

## Security Considerations

### Authentication Security
- HTTP-only cookies prevent XSS attacks
- Secure flag in production
- SameSite protection against CSRF
- Session expiry limits exposure

### API Security
- API key authentication for sensitive operations
- Input validation and sanitization
- CORS configuration

### Data Security
- Service account credentials for Google APIs
- Environment variable configuration
- No sensitive data in client-side code
- Encrypted database connections

## Performance Optimizations

### Caching Strategy
- Next.js built-in caching for API responses
- Custom cache layer for expensive operations
- CDN integration via Cloudinary
- Database query optimization with indexes

### Build Optimizations
- Turbopack for fast development builds
- Multi-stage Docker builds for minimal images
- Static asset optimization
- Code splitting and lazy loading

## Monitoring & Maintenance

### Health Monitoring
- Database connectivity checks
- External service availability
- Automated failover systems
- System resource monitoring

### Backup & Recovery
- Automated database backups
- File system snapshots
- Point-in-time recovery
- Disaster recovery procedures

### Log Management
- Structured logging with Pino
- Elasticsearch integration for analysis
- Log rotation and cleanup
- Error tracking and alerting

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Database connection pooling via Prisma
- CDN for static assets

### Database Scaling
- PostgreSQL with connection limits
- Read replicas (not configured)
- Query optimization and indexing
- Data partitioning strategies

### External Service Limits
- Google Sheets API quotas
- Cloudinary usage limits
- Elasticsearch cluster scaling

## Development Workflow

### Local Development
- Docker Compose for full stack
- Hot reload with Turbopack
- Environment-specific configurations
- Development database seeding

### Deployment Pipeline
- Docker image building
- Environment variable management
- Database migrations
- Health checks and rollbacks
