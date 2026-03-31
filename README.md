<img width="1364" height="727" alt="image" src="https://github.com/user-attachments/assets/2d1d0780-1e43-4d50-8f45-9369a48008d5" />
markdown

# Biashara OS

**A modern Kenyan Business Operating System**  
Full-stack platform for SMEs with integrated payments, tax compliance, and communication tools.

![Biashara OS](https://via.placeholder.com/800x400/0A66C2/FFFFFF?text=Biashara+OS)

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

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React + Vite + TypeScript           |
| Backend     | Node.js + Express + Prisma          |
| Database    | PostgreSQL                          |
| Cache       | Redis                               |
| Container   | Docker + Docker Compose             |
| Deployment  | Vercel (Frontend) + Docker (Backend)|

## 🚀 Quick Start (Local Development)

### 1. Clone the repo
bash
git clone https://github.com/nyoikepaul/biashara-os.git
cd biashara-os

2. Start the backend with Dockerbash

docker compose up --build -d

3. Start the frontendbash

cd frontend
npm install
npm run dev -- --host

Frontend will be available at: http://localhost:5174 (or the network URL shown in terminal)Backend API: http://localhost:3001 Project Structure

biashara-os/
├── backend/          # Node.js + Prisma API
├── frontend/         # Vite + React frontend
├── nginx/            # Nginx configuration
├── prisma/           # Database schema
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md

 Environment VariablesCopy .env.example to .env in the root and in the frontend folder.Root .env (for Docker backend):env

JWT_SECRET=biashara-super-secret-key-change-in-production-32chars

API_URL=http://localhost:3001
FRONTEND_URL=https://your-vercel-domain.vercel.app

MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
# ... other MPESA, ETIMS, Africastalking, WhatsApp keys

Frontend .env:env

API_URL=http://localhost:3001

 Docker Commandsbash

# Start all services
docker compose up --build -d

# View logs
docker compose logs -f api

# Restart only API after changes
docker compose restart api

# Stop everything
docker compose down

# Rebuild everything
docker compose up --build -d

 DeploymentFrontend (Vercel)Already deployed → https://biashara-os-ten.vercel.appBackend (Recommended)Railway
Render
Fly.io
DigitalOcean App Platform

Or keep running on a VPS with Docker. ContributingFork the repo
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

 LicenseThis project is licensed under the MIT License - see LICENSE for details.Made with  for Kenyan businesses

---

### What to do now:

1. Paste the above into `README.md`
2. Run:
   bash
   git add README.md
   git commit -m "docs: add comprehensive README"
   git push origin main


