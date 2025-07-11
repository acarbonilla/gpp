# GatePassPro Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Create production database (MySQL recommended)
- [ ] Set up SSL certificate for HTTPS
- [ ] Configure domain names
- [ ] Set up email service (Gmail SMTP recommended)

### 2. Environment Variables

#### Backend (.env file)
```bash
# Copy env.example to .env and update values
SECRET_KEY=your-secure-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DB_NAME=gatepasspro_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# CORS
PRODUCTION_DOMAINS=https://your-frontend-domain.com

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

#### Frontend (.env file)
```bash
# Copy frontend/env.example to frontend/.env
REACT_APP_API_BASE_URL=https://your-backend-domain.com
```

### 3. Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE gatepasspro_db;
CREATE USER 'gatepasspro_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON gatepasspro_db.* TO 'gatepasspro_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Create lobby attendant user
python manage.py shell
from django.contrib.auth.models import User, Group
user = User.objects.create_user('attendant', 'attendant@company.com', 'secure_password')
group = Group.objects.get(name='lobby_attendant')
user.groups.add(group)
exit()
```

### 4. Backend Deployment

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Collect Static Files
```bash
python manage.py collectstatic
```

#### Run with Gunicorn
```bash
pip install gunicorn
gunicorn --bind 0.0.0.0:8000 gpp.wsgi:application
```

#### With Nginx (recommended)
```nginx
server {
    listen 80;
    server_name your-backend-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-backend-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /path/to/your/staticfiles/;
    }
}
```

### 5. Frontend Deployment

#### Build Production Version
```bash
cd frontend
npm install
npm run build
```

#### Deploy to Web Server
- Upload `build/` folder contents to your web server
- Configure web server to serve React app

#### With Nginx
```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-frontend-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /path/to/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. Security Checklist
- [ ] HTTPS enabled
- [ ] Strong SECRET_KEY
- [ ] DEBUG=False
- [ ] Proper CORS settings
- [ ] Database credentials secured
- [ ] Email credentials secured
- [ ] SSL certificate valid
- [ ] Firewall configured

### 7. Testing
- [ ] Login/logout functionality
- [ ] Walk-in visit creation
- [ ] Check-in/check-out process
- [ ] Report generation
- [ ] Mobile responsiveness
- [ ] Email notifications

### 8. Monitoring
- [ ] Set up error logging
- [ ] Monitor application performance
- [ ] Set up backup procedures
- [ ] Configure health checks

## 🔧 Troubleshooting

### Common Issues
1. **CORS errors**: Check PRODUCTION_DOMAINS in backend .env
2. **API connection**: Verify REACT_APP_API_BASE_URL in frontend .env
3. **Database connection**: Check database credentials and permissions
4. **Email not sending**: Verify SMTP settings and app passwords

### Support
For issues, check:
- Django logs: `tail -f /var/log/django.log`
- Nginx logs: `tail -f /var/log/nginx/error.log`
- Application logs: Check your deployment platform logs 