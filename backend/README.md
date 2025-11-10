# 🧠 Jibbit Squad Backend API
Backend for the Applicant Tracking System (ATS) — a capstone project designed to help job applicants generate resumes, track applications, and manage their professional profiles with the assistance of AI and web scraping.
This repository contains the Node.js + Express + MongoDB backend API used by the frontend webapp.

# 🚀 Tech Stack
- Node.js — JavaScript runtime
- Express.js — Web server framework
- MongoDB Atlas — Cloud NoSQL database
- Mongoose — ODM for MongoDB
- JWT (jsonwebtoken) — Authentication tokens
- bcrypt — Password hashing
- PM2 — Process manager for server uptime
- AWS EC2 — Hosting environment (Ubuntu instance)

# 🧾 API Documentation

Full documentation for all endpoints is available in  
👉 [docs/API_REFERENCE.md](docs/API_REFERENCE.md)


Includes:
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/users/me` (GET/PUT)
- Error formats, HTTP codes, and example JSON responses

# 🧱 Project Structure
  ```
  backend/
├── controllers/
│   ├── authController.js
|   ├── profileController.js
│   └── userController.js
├── middleware/
│   └── auth.js
├── models/
│   └── User.js
├── routes/
│   ├── authRoutes.js
|   ├── userProfileRoutes.js
│   └── userRoutes.js
├── utils/
|   ├── email.js
│   └── responseHandler.js
├── server.js
└── package.json
```

