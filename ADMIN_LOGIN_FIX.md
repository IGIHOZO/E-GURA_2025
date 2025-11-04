# 🔐 Admin Login Fix - Quick Guide

## ❌ Current Error

```
ERR_CONNECTION_REFUSED on http://localhost:5000
```

**Cause:** Backend server is not running!

---

## ✅ Quick Fix (2 Steps)

### Step 1: Start Backend Server

**Option A - Use Batch File (Easiest)**
```
Double-click: START_BACKEND.bat
```

**Option B - Manual Start**
```bash
cd backend
npm run dev
```

**Expected Output:**
```
🔌 Connecting to PostgreSQL...
✅ PostgreSQL connected successfully
💓 Database heartbeat monitoring started
🚀 Server running on port 5000
✨ All systems operational!
```

### Step 2: Try Login Again

1. Go to: http://localhost:4000/admin-login
2. Enter credentials
3. Click Login

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 🚀 Start Everything at Once

**Double-click:** `START_ALL.bat`

This starts:
- ✅ Backend (Port 5000)
- ✅ Frontend (Port 4000)

---

## 🔍 Check Server Status

**Double-click:** `CHECK_SERVERS.bat`

This checks:
- Backend status
- Frontend status  
- PostgreSQL status

---

## 🛠️ Troubleshooting

### Error: "PostgreSQL connection failed"

**Solution 1 - Start PostgreSQL:**
```bash
net start postgresql-x64-14
```

**Solution 2 - Check Database:**
```bash
cd backend
node scripts/check-database.js
```

### Error: "Port 5000 already in use"

**Solution - Kill the process:**
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Error: "Cannot find module"

**Solution - Reinstall dependencies:**
```bash
cd backend
npm install
```

---

## 📊 Analytics Errors (Port 4000)

**Error:**
```
POST http://localhost:4000/api/analytics/track 500
```

This is a **separate issue** (non-critical). Your analytics endpoint needs fixing, but login should work once backend is running.

**To fix analytics later:**
1. Check if you have `/api/analytics/track` route in backend
2. Or disable analytics in development

---

## ✅ Summary

**Main Issue:** Backend server not running

**Quick Fix:**
```bash
cd backend
npm run dev
```

**Then login at:** http://localhost:4000/admin-login

---

## 🎯 Permanent Solution

### Create npm script for easy startup:

Add to `package.json` (root directory):
```json
{
  "scripts": {
    "start:backend": "cd backend && npm run dev",
    "start:frontend": "cd frontend && npm run dev",
    "start:all": "npm-run-all --parallel start:backend start:frontend"
  }
}
```

Then run:
```bash
npm run start:all
```

---

**Last Updated:** October 19, 2025  
**Status:** Backend server needs to be running on port 5000
