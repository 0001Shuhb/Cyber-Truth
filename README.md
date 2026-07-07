# PhishGuard - AI-Powered Phishing Detection Platform

> An advanced phishing detection system using Machine Learning and AI to protect users from email scams, malicious URLs, and fake websites in real-time.

[![GitHub](https://img.shields.io/badge/GitHub-Cyber--Truth-blue?logo=github)](https://github.com/0001Shuhb/Cyber-Truth)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.0-blue?logo=react)](https://react.dev/)

---

## 📋 Overview

PhishGuard is an intelligent cybersecurity platform designed to detect and neutralize phishing threats before they reach users. It combines:
- **Machine Learning Models** for pattern recognition
- **Real-time Threat Analysis** of URLs and emails
- **Web Scanning** for malicious websites
- **SSL Certificate Validation**
- **WHOIS Domain Lookup**
- **AI-Powered Threat Intelligence**

---

## ✨ Features

### Email Security
- ✅ Advanced email phishing detection
- ✅ Malicious attachment scanning
- ✅ Sender authentication verification
- ✅ Spam pattern analysis

### URL & Web Scanning
- ✅ Real-time URL threat detection
- ✅ Website malware scanning
- ✅ SSL certificate validation
- ✅ Domain reputation checking
- ✅ WHOIS domain information

### Intelligence & Analytics
- ✅ Threat intelligence dashboard
- ✅ Risk assessment metrics
- ✅ Scan history tracking
- ✅ Detailed threat reports
- ✅ Export reports (PDF)

### Administration
- ✅ User management
- ✅ Audit logs
- ✅ System health monitoring
- ✅ Role-based access control (RBAC)

---

## 🛠️ Tech Stack

### Frontend
- **React 18.0** - UI Library
- **Vite 8.1.3** - Build tool & dev server
- **Tailwind CSS 3.0** - Utility-first CSS
- **React Router 7.16** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Framer Motion** - Animations

### Backend
- **Python 3.11** - Programming language
- **Flask 3.1.3** - Web framework
- **SQLAlchemy 2.0** - ORM
- **PostgreSQL/SQLite** - Database
- **Celery 5.6** - Async task queue
- **PyJWT** - JWT authentication
- **Flask-CORS** - CORS support
- **Rate Limiting** - Prevent abuse

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline
- **Alembic** - Database migrations

---

## 📦 Prerequisites

Before you begin, ensure you have:
- **Python 3.11+** installed
- **Node.js 18+** and npm
- **Git** installed
- **Virtual Environment** (venv or conda)
- **4GB RAM** minimum
- **200MB** free disk space

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/0001Shuhb/Cyber-Truth.git
cd Cyber-Truth
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
# DATABASE_URL, SECRET_KEY, etc.
```

#### Initialize Database
```bash
# Create tables
python -c "from app import create_app; app = create_app(); app.app_context().push()"
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

---

## ⚡ Quick Start

### Option 1: Batch File (Windows)
```bash
# From project root
start.bat
```

### Option 2: Manual Start

#### Terminal 1 - Backend
```bash
cd backend
..\\.venv\\Scripts\\activate
python run.py
```
Backend runs on: `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

#### Terminal 3 - Celery Worker (Optional)
```bash
cd backend
..\\.venv\\Scripts\\activate
python celery_worker.py
```

---

## 📁 Project Structure

```
phishguard/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models (User, Scan, Report)
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── ml/              # ML models & training
│   │   └── utils/           # Helper functions
│   ├── tests/               # Unit tests
│   ├── requirements.txt     # Python dependencies
│   └── run.py              # Flask entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # State management
│   │   └── styles/          # CSS files
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite config
├── docker/                  # Docker configurations
├── docs/                    # Documentation
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Scanning
- `POST /api/scan/url` - Scan URL
- `POST /api/scan/email` - Scan email
- `POST /api/scan/website` - Scan website
- `GET /api/scan/history` - Get scan history
- `GET /api/scan/{id}` - Get scan details

### Reports
- `GET /api/report/list` - List all reports
- `GET /api/report/{id}` - Get report details
- `POST /api/report/{id}/export` - Export report (PDF)

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/logs` - Audit logs

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in backend root:

```env
# Flask
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///phishguard.db
# or PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/phishguard

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_EXPIRES=3600

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
pytest tests/ -v
```

### Run Tests with Coverage
```bash
pytest tests/ --cov=app --cov-report=html
```

### Run Specific Test
```bash
pytest tests/test_auth.py -v
```

---

## 🐳 Docker Deployment

### Build Images
```bash
docker-compose -f docker/docker-compose.yml build
```

### Run Containers
```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Access Services
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:5000`

### View Logs
```bash
docker-compose -f docker/docker-compose.yml logs -f
```

### Stop Services
```bash
docker-compose -f docker/docker-compose.yml down
```

---

## 📊 ML Models

### Email Model
- Trained on phishing email patterns
- Features: Sender reputation, links, content analysis
- Accuracy: ~94%

### URL Model
- Detects malicious URL patterns
- Features: Domain age, SSL certificate, page content
- Accuracy: ~92%

### Training
```bash
cd backend/app/ml
python train_email_model.py
python train_url_model.py
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Python: PEP 8
- JavaScript: Prettier formatting
- Commit messages: Conventional Commits

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Repository**: [Cyber-Truth](https://github.com/0001Shuhb/Cyber-Truth)
- **Issues**: [Report Issues](https://github.com/0001Shuhb/Cyber-Truth/issues)
- **Documentation**: See `/docs` folder

---

## 💬 Support

For help and questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review API reference in `/docs/api_reference.md`

---

## 🎯 Roadmap

- [ ] Mobile app (iOS & Android)
- [ ] Browser extension
- [ ] API integrations (Slack, Teams)
- [ ] Advanced ML model enhancements
- [ ] Real-time threat streaming
- [ ] Community threat database

---

## 👨‍💻 Author

**Shuhb** - [@0001Shuhb](https://github.com/0001Shuhb)

---

**Built with ❤️ for cybersecurity**