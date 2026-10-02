# CampusOps: Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Java 21 LTS & Maven 3.9+ (for local backend development)
- Local MySQL 8 on port 3306

---

## Docker Compose Quickstart

1. Navigate to the `deploy/` directory:
   ```bash
   cd deploy
   ```

2. Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `.env`:
   ```ini
   MYSQL_ROOT_PASSWORD=rootpass123
   MYSQL_DATABASE=bidtobid
   MYSQL_USER=nav
   MYSQL_PASSWORD=navdiv123
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. Launch all containers:
   ```bash
   docker compose up --build -d
   ```

5. Services will be available at:
   - **Frontend Application**: `http://localhost:3000` (or `http://localhost` in docker-compose production)
   - **Backend API**: `http://localhost:8080/api/v1`
   - **Database**: `localhost:3306`

---

## Local Development Setup

### Backend (Spring Boot 3)
```bash
cd backend
mvn clean test
mvn spring-boot:run
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
