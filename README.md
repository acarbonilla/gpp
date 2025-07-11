# 🏢 GatePassPro - Modern Visitor Management System

[![Django](https://img.shields.io/badge/Django-5.2.3-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive, modern visitor management system built with Django and React. Streamline your visitor check-in process, enhance security, and provide a professional experience for both hosts and visitors.

## ✨ **Features**

### 🎯 **Core Functionality**
- **Automated Visitor Invitations** - Send professional invitation links to visitors
- **Real-time Check-in/Check-out** - Streamlined visitor processing
- **Role-based Access Control** - Different interfaces for employees, lobby attendants, and admins
- **Walk-in Visit Management** - Handle unexpected visitors efficiently
- **Email Notifications** - Automated communication throughout the visit process

### 📊 **Analytics & Reporting**
- **Dashboard Metrics** - Real-time visitor statistics and trends
- **Comprehensive Reports** - Export visitor data for analysis
- **Department Analytics** - Track visitor patterns by team
- **Performance Insights** - Monitor check-in efficiency and no-show rates

### 🔒 **Security & Compliance**
- **JWT Authentication** - Secure user authentication
- **Role-based Permissions** - Granular access control
- **Audit Trail** - Complete logging of all visitor activities
- **Data Encryption** - Secure storage of visitor information
- **GDPR Compliance** - Privacy-focused data handling

### 📱 **User Experience**
- **Mobile-Responsive Design** - Works seamlessly on all devices
- **Real-time Updates** - Live status changes and notifications
- **Intuitive Interface** - Easy-to-use dashboard for all user types
- **Loading States** - Professional user feedback during operations

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Django Backend │    │   MySQL Database│
│                 │    │                 │    │                 │
│ • User Interface│◄──►│ • REST API      │◄──►│ • Visitor Data  │
│ • Real-time UI  │    │ • Authentication│    │ • User Accounts │
│ • Mobile Responsive│ │ • Business Logic│    │ • Visit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Quick Start**

### **Prerequisites**
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gatepasspro.git
   cd gatepasspro
   ```

2. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp env.example .env
   # Edit .env with your database and email settings
   
   # Run migrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Set up environment variables
   cp env.example .env
   # Edit .env with your API base URL
   ```

4. **Start the Application**
   ```bash
   # Backend (from project root)
   python manage.py runserver
   
   # Frontend (from frontend directory)
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

## 👥 **User Roles & Workflows**

### **Employee (Host)**
1. **Create Visit Request** → Send invitation to visitor
2. **Review Visitor Info** → Approve or reject visitor details
3. **Receive Notifications** → Get alerts when visitors arrive/leave
4. **View History** → Access complete visitor records

### **Lobby Attendant**
1. **View Today's Visitors** → See all scheduled visitors
2. **Check-in Visitors** → Process visitor arrivals
3. **Handle Walk-ins** → Create records for unexpected visitors
4. **Check-out Visitors** → Complete visit process

### **Visitor**
1. **Receive Invitation** → Get email with secure link
2. **Complete Form** → Provide required information
3. **Get Confirmation** → Receive approval notification
4. **Visit & Check-in** → Smooth arrival process

## 📋 **Complete Workflow**

For detailed workflow documentation, see [WORKFLOW_DOCUMENTATION.md](WORKFLOW_DOCUMENTATION.md)

## 🔧 **Configuration**

### **Environment Variables**

#### **Backend (.env)**
```bash
# Django Settings
SECRET_KEY=your-secret-key-here
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

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# CORS
PRODUCTION_DOMAINS=https://your-frontend-domain.com
```

#### **Frontend (.env)**
```bash
REACT_APP_API_BASE_URL=https://your-backend-domain.com
```

## 📊 **Features in Detail**

### **Visitor Management**
- **Automated Invitations** - Professional email invitations with secure links
- **Information Collection** - Streamlined visitor registration process
- **Approval Workflow** - Host review and approval of visitor details
- **Real-time Status** - Live updates of visitor status and location

### **Check-in/Check-out System**
- **Quick Check-in** - Fast visitor processing at reception
- **Status Tracking** - Real-time visitor location within facility
- **Automatic Notifications** - Instant alerts to hosts about visitor status
- **Complete Audit Trail** - Full record of visitor movements

### **Walk-in Management**
- **On-the-spot Registration** - Handle unexpected visitors efficiently
- **Immediate Approval** - Streamlined process for walk-in visits
- **Flexible Processing** - Convert scheduled visits to walk-ins when needed

### **Reporting & Analytics**
- **Dashboard Metrics** - Key performance indicators and trends
- **Custom Reports** - Exportable data for analysis and compliance
- **Department Insights** - Team-specific visitor patterns
- **Performance Tracking** - Monitor efficiency and identify improvements

## 🛠️ **Development**

### **Project Structure**
```
gatepasspro/
├── core/                   # Django app with main functionality
│   ├── models.py          # Database models
│   ├── views.py           # API endpoints
│   ├── serializers.py     # Data serialization
│   └── migrations/        # Database migrations
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── api/           # API integration
│   └── public/            # Static assets
├── gpp/                   # Django project settings
├── logs/                  # Application logs
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

### **API Endpoints**
- `POST /api/auth/login/` - User authentication
- `GET /api/dashboard-metrics/` - Dashboard statistics
- `POST /api/visit-requests/` - Create visit requests
- `GET /api/lobby/today-visitors/` - Today's visitor list
- `POST /api/lobby/checkin/` - Check-in visitors
- `POST /api/lobby/checkout/` - Check-out visitors

### **Database Schema**
- **Visitor** - Visitor information and details
- **VisitRequest** - Visit scheduling and status
- **VisitLog** - Check-in/check-out records
- **User** - System users and permissions

## 🚀 **Deployment**

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### **Production Checklist**
- [ ] Configure environment variables
- [ ] Set up production database
- [ ] Configure email settings
- [ ] Set up SSL certificates
- [ ] Configure logging
- [ ] Run database migrations
- [ ] Collect static files
- [ ] Set up monitoring

## 🧪 **Testing**

### **Backend Testing**
```bash
python manage.py test
```

### **Frontend Testing**
```bash
cd frontend
npm test
```

## 📈 **Performance**

### **Optimizations**
- **Database Indexes** - Optimized queries for fast performance
- **Caching** - Reduced database load
- **API Optimization** - Efficient data transfer
- **Frontend Optimization** - Fast loading and responsive UI

### **Monitoring**
- **Application Logs** - Comprehensive logging system
- **Error Tracking** - Automatic error reporting
- **Performance Metrics** - Real-time system monitoring
- **User Analytics** - Usage patterns and insights

## 🔒 **Security**

### **Security Features**
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access** - Granular permission control
- **Input Validation** - Comprehensive data validation
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Cross-site scripting prevention
- **CSRF Protection** - Cross-site request forgery protection

### **Data Protection**
- **Encryption** - Sensitive data encryption
- **Audit Logging** - Complete activity tracking
- **Access Control** - Restricted data access
- **Compliance** - GDPR and privacy compliance

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Django** - Powerful web framework
- **React** - Modern UI library
- **MySQL** - Reliable database system
- **Tailwind CSS** - Utility-first CSS framework

## 📞 **Support**

For support and questions:
- **Documentation**: [WORKFLOW_DOCUMENTATION.md](WORKFLOW_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/gatepasspro/issues)
- **Email**: support@gatepasspro.com

---

**Built with ❤️ for modern visitor management** 