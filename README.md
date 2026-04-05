# 🚀 BiasharaOS

**A modern, multi-tenant Kenyan Business Operating System** A comprehensive, enterprise-grade platform built for SMEs, featuring seamless integrations for digital payments, statutory tax compliance, and omni-channel customer communication.

[![React & Vite](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?logo=react&logoColor=white)](#)
[![Node.js & Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?logo=nodedotjs&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql&logoColor=white)](#)
[![Dockerized](https://img.shields.io/badge/Infrastructure-Docker-2496ED?logo=docker&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Core Features

### 💳 FinTech & Billing
* **M-Pesa Integration:** Fully integrated Daraja API supporting STK Push, C2B, and B2C transactions for automated reconciliation.
* **KRA eTIMS Compliance:** Automated generation and push of electronic tax invoices directly to the Kenya Revenue Authority.

### 📢 Communication & CRM
* **WhatsApp Business API:** Integrated messaging for instant customer engagement and automated notifications.
* **Africastalking SMS & Voice:** Reliable SMS and voice infrastructure for alerts and OTPs.

### 🔐 Security & Architecture
* **Role-Based Access Control (RBAC):** Secure JWT authentication with granular permissions for cashiers, managers, and admins.
* **High-Performance Caching:** Redis implementation for optimized data retrieval and session management.
* **Type-Safe ORM:** Prisma integration ensuring robust database schema management and query safety.

---

## 🛠️ Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| **Frontend** | React + Vite + TypeScript           |
| **Backend** | Node.js + Express + Prisma          |
| **Database** | PostgreSQL                          |
| **Cache** | Redis                               |
| **Container** | Docker + Docker Compose             |
| **Deployment** | Vercel (Frontend) + Docker (Backend)|

---

## 🚀 Quick Start (Local Development)

### Prerequisites
Ensure you have the following installed on your machine:
* [Docker](https://www.docker.com/) & Docker Compose
* [Node.js](https://nodejs.org/) (v18+)
* Git

### 1. Clone the repository
bash
git clone [https://github.com/nyoikepaul/biashara-os.git](https://github.com/nyoikepaul/biashara-os.git)
cd biashara-os

Configure Environment Variables
Create a .env file in the root directory for the backend and another in the frontend/ directory. Use the templates below.
Backend (/.env)

JWT_SECRET=biashara-super-secret-key-change-in-production-32chars
API_URL=http://localhost:3001
FRONTEND_URL=[https://biashara-os-ten.vercel.app](https://biashara-os-ten.vercel.app)

# M-Pesa Configuration
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919

# Add specific keys for eTIMS, Africastalking, WhatsApp, etc.


Frontend (/frontend/.env)

VITE_API_URL=http://localhost:3001

Spin up the Backend Services
docker compose up --build -d

Start the frontend
cd frontend
npm install
npm run dev -- --host


**Docker Commands**



  Start all services
docker compose up --build -d

 View API logs
docker compose logs -f api

 Restart only API
docker compose restart api

 Stop everything
docker compose down

 Full rebuild
docker compose up --build -d

**Deployment**


  Frontend → Vercel
Backend → Recommended: Railway, Render, or any VPS with Docker










**Contributing**



  Fork the repo
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request





**License**


  MIT License — see LICENSE for details.



Made with love  for Kenyan businesses





<img width="1366" height="724" alt="image" src="https://github.com/user-attachments/assets/c0728edd-ec1c-4957-8c3f-267057390ca3" />




















