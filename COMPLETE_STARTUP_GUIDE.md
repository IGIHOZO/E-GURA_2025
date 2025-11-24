# 🚀 E-Gura Complete Startup Guide

## ❌ Current Issues

You're seeing these errors:
```
ERR_CONNECTION_REFUSED on port 5000  ← Backend NOT running
500 Internal Server Error on /api/analytics/track  ← Now FIXED ✅
```

---

## ✅ SOLUTION (Follow These Steps)

### Step 1: Start Backend Server

**I've already started it for you!** ✅

But if you need to restart it:

```bash
cd backend
npm run dev
```

**Expected output:**
```
🔌 Connecting to PostgreSQL...
✅ PostgreSQL connection established successfully
💓 Database heartbeat monitoring started
🚀 Server running on port 5000
✨ All systems operational!
```

### Step 2: Verify Backend is Running

<<<<<<< HEAD
Visit: https://egura.rw/api/health
=======
Visit: http://localhost:5000/api/health
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742

**Should show:**
```json
{
  "status": "ok",
  "database": "connected",
  "dbType": "PostgreSQL"
}
```

### Step 3: Refresh Your Frontend

1. Go to: http://localhost:4000
2. Press `Ctrl + F5` (hard refresh)
3. Homepage should now load products!

---

## 🎯 What Was Fixed

### 1. Backend Server ✅
- Started on port 5000
- Connected to PostgreSQL
- Auto-reconnect enabled
- Heartbeat monitoring active

### 2. Analytics Endpoint ✅
- Created `/api/analytics/track` route
- Now returns 200 instead of 500
- Logs events to console
- No more errors in browser

### 3. Database Connection ✅
- Auto-reconnect on disconnect
- Connection pooling optimized
- Heartbeat monitoring every 30s
- Graceful error handling

---

## 📋 Startup Checklist

Before using the app, ensure:

- [ ] PostgreSQL is running
  ```bash
  net start postgresql-x64-14
  ```

- [ ] Backend is running on port 5000
  ```bash
  cd backend
  npm run dev
  ```

- [ ] Frontend is running on port 4000
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🛠️ Quick Start Scripts

### Option 1: Use Batch Files (Windows)

**Start Backend Only:**
```
Double-click: START_BACKEND.bat
```

**Start Everything:**
```
Double-click: START_ALL.bat
```

**Check Status:**
```
Double-click: CHECK_SERVERS.bat
```

### Option 2: Manual Commands

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```

---

## 🔍 Troubleshooting

### Homepage Still Shows No Products?

**Check 1:** Is backend running?
```bash
<<<<<<< HEAD
curl https://egura.rw/api/health
=======
curl http://localhost:5000/api/health
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
```

**Check 2:** Are there products in database?
```bash
<<<<<<< HEAD
curl https://egura.rw/api/products?limit=10
=======
curl http://localhost:5000/api/products?limit=10
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
```

**Check 3:** Check browser console for errors
- Press `F12` in browser
- Look for any red errors
- Make sure you see `✅` messages, not `❌`

### Shop Page Not Loading?

**Same solution:** Backend must be running on port 5000!

### Still See 500 Errors?

Restart both servers:
```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

# Restart backend
cd backend
npm run dev

# Restart frontend (new terminal)
cd frontend
npm run dev
```

---

## 📊 What Each Port Does

| Port | Service | Purpose |
|------|---------|---------|
| 5000 | Backend API | Database, auth, products, orders |
| 4000 | Frontend | React app, user interface |
| 5432 | PostgreSQL | Database server |

**All THREE must be running!**

---

## 🎉 Success Indicators

### Backend Started Successfully:
```
✅ PostgreSQL connected successfully
💓 Database heartbeat monitoring started
🚀 Server running on port 5000
✨ All systems operational!
```

### Frontend Started Successfully:
```
VITE v4.x.x  ready in xxx ms
➜  Local:   http://localhost:4000/
➜  Network: use --host to expose
```

### Homepage Working:
- Products display on homepage
- No `ERR_CONNECTION_REFUSED` errors
- Flash deals section loads
- Trending products show

---

## 🔐 Admin Login

Once backend is running:

**URL:** http://localhost:4000/admin-login

**Credentials:**
- Username: `admin`
- Password: `admin123`

(Or whatever you set in your database)

---

## 📱 Test Your Setup

### 1. Backend Health Check
```bash
<<<<<<< HEAD
curl https://egura.rw/api/health
=======
curl http://localhost:5000/api/health
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
```

### 2. Get Products
```bash
<<<<<<< HEAD
curl https://egura.rw/api/products?limit=5
=======
curl http://localhost:5000/api/products?limit=5
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
```

### 3. Analytics Test
```bash
<<<<<<< HEAD
curl -X POST https://egura.rw/api/analytics/track \
=======
curl -X POST http://localhost:5000/api/analytics/track \
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
  -H "Content-Type: application/json" \
  -d '{"event_name":"test","event_data":{}}'
```

All should return JSON responses!

---

## 🚨 Common Errors & Fixes

### Error: "Port 5000 already in use"

**Fix:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID)
taskkill /PID <PID> /F

# Start backend again
cd backend
npm run dev
```

### Error: "Cannot connect to PostgreSQL"

**Fix:**
```bash
# Start PostgreSQL
net start postgresql-x64-14

# Test connection
cd backend
node scripts/check-database.js
```

### Error: "Module not found"

**Fix:**
```bash
# Reinstall dependencies
cd backend
npm install

cd ../frontend
npm install
```

---

## 💡 Pro Tips

### Tip 1: Keep Terminals Open
- Don't close backend terminal while using app
- Don't close frontend terminal while testing
- Each needs its own terminal window

### Tip 2: Hard Refresh After Changes
- Press `Ctrl + Shift + R` or `Ctrl + F5`
- Clears cache and reloads fresh data

### Tip 3: Check Logs
- Backend terminal shows API requests
- Frontend terminal shows build errors
- Browser console shows client errors

### Tip 4: Use Batch Files
- Easier than typing commands
- Auto-opens correct directories
- Keeps terminals organized

---

## 📁 Project Structure

```
deby/
├── backend/              ← API Server (Port 5000)
│   ├── routes/          ← API endpoints
│   ├── config/          ← Database config
│   ├── scripts/         ← Utility scripts
│   └── index.js         ← Main server file
│
├── frontend/            ← React App (Port 4000)
│   ├── src/            ← Components
│   └── package.json
│
├── START_BACKEND.bat    ← Quick start backend
├── START_ALL.bat        ← Start everything
└── CHECK_SERVERS.bat    ← Check status
```

---

## ✅ Final Checklist

Before reporting issues:

- [ ] PostgreSQL is running
- [ ] Backend shows "All systems operational!"
- [ ] Frontend shows local server URL
<<<<<<< HEAD
- [ ] https://egura.rw/api/health returns OK
=======
- [ ] http://localhost:5000/api/health returns OK
>>>>>>> 1a15362f9dae7bb17aa91f0abab9fb8ce9627742
- [ ] Browser console shows no ERR_CONNECTION_REFUSED
- [ ] Hard refreshed browser (Ctrl+F5)

If ALL checked ✅ = Everything should work!

---

## 🎊 Summary

**What I fixed:**
1. ✅ Started your backend server
2. ✅ Created analytics endpoint  
3. ✅ Fixed 500 errors
4. ✅ Database auto-reconnect working

**What you need to do:**
1. Keep backend running (port 5000)
2. Hard refresh browser (Ctrl+F5)
3. Check homepage loads products

**Your app should now work perfectly!** 🚀

---

**Need Help?**
1. Run: `CHECK_SERVERS.bat`
2. Check all services are ✅
3. Follow troubleshooting steps above

---

**Last Updated:** October 19, 2025  
**Status:** ✅ Backend Running  
**Analytics:** ✅ Fixed  
**Database:** ✅ Connected with auto-reconnect
