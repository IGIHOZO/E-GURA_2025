# 🚀 Quick Deployment Checklist

## Before You Start
- [ ] DigitalOcean account created
- [ ] Domain egura.rw registered and DNS configured
- [ ] Cloudinary account set up
- [ ] All credentials ready

## Droplet Setup (5 minutes)
- [ ] Create Ubuntu 22.04 Droplet ($12/month, 2GB RAM)
- [ ] Add SSH key
- [ ] Note down Droplet IP address
- [ ] Point domain A records to Droplet IP

## DNS Configuration
```
A     egura.rw       →  YOUR_DROPLET_IP
A     www.egura.rw   →  YOUR_DROPLET_IP
```

## On Your VPS (30 minutes)

### 1. Connect
```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Upload Project
```bash
# Option A: Git clone
git clone YOUR_REPO_URL /var/www/egura

# Option B: SCP from local
scp -r ./deby root@YOUR_IP:/var/www/egura
```

### 3. Run Deployment
```bash
cd /var/www/egura
chmod +x deploy-digitalocean.sh
./deploy-digitalocean.sh
```

### 4. Configure Environment
```bash
nano /var/www/egura/backend/.env
```

Update:
- POSTGRES_PASSWORD
- JWT_SECRET (generate with: openssl rand -base64 32)
- CLOUDINARY credentials
- BASE_URL=https://egura.rw

### 5. Setup SSL
```bash
sudo certbot --nginx -d egura.rw -d www.egura.rw
```

### 6. Verify
```bash
pm2 status
pm2 logs egura-backend
curl https://egura.rw/api/health
```

## Post-Deployment (10 minutes)

- [ ] Test website: https://egura.rw
- [ ] Test API: https://egura.rw/api/health
- [ ] Test admin login
- [ ] Upload test product
- [ ] Test payment flow
- [ ] Check SSL certificate
- [ ] Setup monitoring

## Monitoring Setup

```bash
# Install monitoring
pm2 install pm2-logrotate

# View metrics
pm2 monit
```

## Backup Setup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-egura.sh
```

Paste:
```bash
#!/bin/bash
pg_dump egura_store | gzip > /var/backups/egura_$(date +%Y%m%d).sql.gz
find /var/backups -name "egura_*.sql.gz" -mtime +7 -delete
```

Schedule:
```bash
sudo chmod +x /usr/local/bin/backup-egura.sh
(crontab -l ; echo "0 2 * * * /usr/local/bin/backup-egura.sh") | crontab -
```

## 🎉 Done!

Your site should now be live at **https://egura.rw**

## 📞 Need Help?

Check:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Full deployment guide
- [PERFORMANCE_TEST_REPORT.md](./PERFORMANCE_TEST_REPORT.md) - Performance metrics
- PM2 logs: `pm2 logs egura-backend`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`

## 🔄 Update Application

```bash
cd /var/www/egura
git pull
cd backend && npm install --production
cd ../frontend && npm install && npm run build
pm2 restart egura-backend
sudo systemctl reload nginx
```

---

**Total Time:** ~45 minutes  
**Monthly Cost:** ~$12-20  
**Difficulty:** Medium
