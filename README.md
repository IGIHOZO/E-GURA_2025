# E-Gura Store

Rwanda's Premier Online Shopping Platform

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete instructions.

## 📁 Project Structure

```
egura/
├── backend/              # Node.js/Express API
│   ├── config/          # Database & app configuration
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   └── index.js         # Entry point
├── frontend/            # React/Vite app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── utils/       # Utilities
│   └── dist/            # Production build
├── ecosystem.config.js  # PM2 configuration
└── deploy-digitalocean.sh  # Deployment script
```

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Payment:** InTouch Pay (Mobile Money)
- **Hosting:** DigitalOcean Ubuntu VPS
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt

## 📊 Performance

- **Bundle Size:** ~207 KB (gzipped)
- **API Response:** <100 ms
- **Page Load:** 1.5-2.5 seconds
- **Google PageSpeed:** 85-95/100

See [PERFORMANCE_TEST_REPORT.md](./PERFORMANCE_TEST_REPORT.md) for detailed metrics.

## 🌍 Features

- ✅ Mobile-first responsive design
- ✅ PWA support (offline capability)
- ✅ Mobile money payment integration
- ✅ Admin dashboard
- ✅ Product management
- ✅ Order tracking
- ✅ Customer accounts
- ✅ Image optimization
- ✅ SEO optimized

## 📝 License

Copyright © 2025 E-Gura Store. All rights reserved.
