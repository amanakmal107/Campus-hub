# 🎓 CampusHub — Social Platform for College Students

A full-stack web application built for college students to connect, share knowledge, exchange textbooks, and collaborate.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Plain CSS |
| Backend | Node.js + Express.js |
| Database | PostgreSQL + `pg` library |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |
| File Uploads | Multer |

---

## 📁 Project Structure

```
campushub/
├── frontend/        # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── utils/
│   └── public/
├── backend/         # Node.js + Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── db/
│   │   └── utils/
│   └── uploads/
├── schema.sql       # Database schema
└── seed.sql         # Sample data
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm or yarn

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

### 3. Create the Database

```bash
psql -U postgres -c "CREATE DATABASE campushub;"
psql -U postgres -d campushub -f schema.sql
psql -U postgres -d campushub -f seed.sql
```

### 4. Run the Application

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173**
