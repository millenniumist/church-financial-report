# CC Financial - Monorepo

A Next.js financial tracking application with self-hosting deployment infrastructure.

## 📁 Repository Structure

```
cc-financial/                      # Monorepo root
├── app/                          # Next.js application
│   ├── app/                      # Next.js App Router pages
│   ├── components/               # React components
│   ├── lib/                      # Utilities and data fetching
│   ├── prisma/                   # Database schema and migrations
│   ├── public/                   # Static assets
│   ├── package.json              # App dependencies
│   └── Dockerfile                # Production Docker image
│
├── deployment/                   # Self-hosting infrastructure
│   ├── deploy-local.sh           # Deploy to local machine
│   ├── deploy-remote.sh          # Deploy to remote host (e.g., Raspberry Pi)
│   ├── docker-compose.selfhost.yml
│   ├── config.example.sh         # Configuration template
│   ├── cloudflare/               # Cloudflare tunnel configuration
│   └── DEPLOY-README.md          # Detailed deployment guide
│
├── docs/                         # Documentation
├── scripts/                      # Utility scripts
└── README.md                     # This file
```

## 🚀 Quick Start

### Development

```bash
# Install dependencies
cd app
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Testing

```bash
cd app
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 🐳 Deployment

This monorepo includes a complete self-hosting solution with Docker and Cloudflare Tunnel.

### Prerequisites

- Docker (Colima or Docker Desktop)
- cloudflared CLI (for Cloudflare Tunnel)
- Google Sheets service account credentials

### Local Deployment

Deploy the application on your local machine:

```bash
# 1. Configure deployment
cd deployment
cp config.example.sh config.sh
# Edit config.sh with your settings

# 2. Set up Cloudflare Tunnel
# See deployment/cloudflare/README.md

# 3. Deploy
./deploy-local.sh
```

Your app will be accessible via:
- Local: http://localhost:8358
- Public: https://your-domain.com (via Cloudflare Tunnel)

### Remote Deployment

Deploy to a remote host (e.g., Raspberry Pi):

```bash
cd deployment

# 1. Configure remote connection
cp .env.example .env
# Add: hostIp, username, password

# 2. Deploy
./deploy-remote.sh
```

See [deployment/DEPLOY-README.md](deployment/DEPLOY-README.md) for detailed instructions.

## 📊 Features

- **Financial Tracking**: Sync financial data from Google Sheets
- **Mission Management**: Create and manage mission projects
- **Admin Panel**: Full-featured admin interface for content management
- **Image Management**: Cloudinary integration for image uploads
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Admin authentication for protected routes

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma
- **Deployment**: Docker, Cloudflare Tunnel
- **Image Storage**: Cloudinary
- **Data Source**: Google Sheets API

## 📚 Documentation

- [TDD Guide](docs/TDD_GUIDE.md) - Test-driven development practices
- [Admin Panel Setup](ADMIN_PANEL_SETUP.md) - Admin interface configuration
- [Google Sheets Sync](GOOGLE_APPS_SCRIPT_SYNC.md) - Financial data synchronization
- [Deployment Guide](deployment/DEPLOY-README.md) - Detailed deployment instructions

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example`):

```bash
DATABASE_URL="postgresql://..."           # PostgreSQL connection string
GOOGLE_SHEETS_SPREADSHEET_ID="..."       # Google Sheets ID
GOOGLE_SERVICE_ACCOUNT_PATH="./privatekey-gsheet.json"  # Service account credentials
```

### Deployment Configuration

Deployment settings (see `deployment/config.example.sh`):

```bash
CLOUDFLARE_TUNNEL_NAME="your-tunnel"     # Cloudflare tunnel name
DOMAIN="your-domain.com"                 # Your public domain
CONTAINER_NAME="nextjs-app"              # Docker container name
APP_PORT="8358"                          # Application port
```

## 🧪 Testing

The project uses Jest and React Testing Library:

```bash
cd app
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

Private project - All rights reserved

## 🆘 Support

For deployment issues, see [deployment/DEPLOY-README.md](deployment/DEPLOY-README.md)

For development questions, check the documentation in the `docs/` directory.
