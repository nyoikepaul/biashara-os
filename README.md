<img width="1364" height="727" alt="image" src="https://github.com/user-attachments/assets/2d1d0780-1e43-4d50-8f45-9369a48008d5" />
# Biashara OS

**A modern Kenyan Business Operating System**  
Full-stack platform for SMEs with integrated payments, tax compliance, and communication tools.

![Biashara OS Banner](https://via.placeholder.com/1200x400/0A66C2/FFFFFF?text=Biashara+OS)

## ✨ Features

- **M-Pesa Integration** (Daraja API - STK Push, C2B, B2C)
- **KRA eTIMS** compliance (Electronic Tax Invoice Management System)
- **Africastalking SMS & Voice**
- **WhatsApp Business API** integration
- **JWT Authentication** + Role-based access
- **PostgreSQL** + **Redis** backend
- **Fully Dockerized** backend (API + DB + Redis)
- **Vite + React** frontend (deployed on Vercel)
- **Prisma ORM** for type-safe database access

## 🛠 Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Frontend      | React + Vite + TypeScript           |
| Backend       | Node.js + Express + Prisma          |
| Database      | PostgreSQL                          |
| Cache         | Redis                               |
| Container     | Docker + Docker Compose             |
| Deployment    | Vercel (Frontend) + Docker (Backend)|

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
bash
git clone https://github.com/nyoikepaul/biashara-os.git
cd biashara-os

### 2.Start the backend with Docker
docker compose up --build -d

### 3. Start the frontend
cd frontend
npm install
npm run dev -- --host

### 4. Project Structure
biashara-os/
├── backend/          # Node.js + Prisma API
├── frontend/         # Vite + React frontend
├── nginx/            # Nginx configuration
├── prisma/           # Database schema & migrations
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md

### 5.Environment Variables
JWT_SECRET=biashara-super-secret-key-change-in-production-32chars

API_URL=http://localhost:3001
FRONTEND_URL=https://biashara-os-ten.vercel.app

MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
# ... add other keys (ETIMS, Africastalking, WhatsApp, etc.)

### 6.Frontend .env:
API_URL=http://localhost:3001

### 7.Docker Commands
 # Start all services
docker compose up --build -d

# View API logs
docker compose logs -f api

# Restart only API
docker compose restart api

# Stop everything
docker compose down

# Full rebuild
docker compose up --build -d

### 7.Deployment
Frontend → Vercel
Backend → Recommended: Railway, Render, or any VPS with Docker

### 8.Contributing
Fork the repo
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

### 9.License
MIT License — see LICENSE for details.

Made with  for Kenyan businesses




















