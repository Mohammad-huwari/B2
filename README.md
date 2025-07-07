 B2
💸🔒 B2Crypto — Secure Crypto Education & Advisory Platform

A fully functional RESTful back-end API for **B2Crypto**, a secure online crypto education & advisory system built with **Node.js**, **Express**, and **MongoDB**.

Users can sign up, authenticate, purchase paid crypto courses, stream video content securely, and get personalized investment advice.  
Admins manage users, paid content, and orders with full role-based access.

---

 🚀 Features

✅ JWT Authentication & Role-Based Authorization (Admin / Customer)  
✅ Sign Up, Log In, Forgot Password & Reset Password  
✅ Protect & Restrict Routes with `protect` & `restrictTo` middleware  
✅ Paid Crypto Courses with secure video streaming  
✅ Investment advisory booking (paid)  
✅ CRUD operations for Users (Admin only)  
✅ CRUD operations for Courses (Admin only)  
✅ Order Management:
   - Purchase Course
   - Verify Payment
   - Track Purchases per User
✅ Mongoose relationships & advanced population  
✅ Secure environment variables with `dotenv`

---

🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT
- bcryptjs
- validator
- Nodemailer (optional for real email confirmations)

---

 ⚙️ Getting Started

 1️⃣ Clone the repo


⚡ Note: Don’t forget to create your .env file with your database URI and JWT secret before running.
```bash
git clone https://github.com/Mohammad-huwari/B2.git
cd B2
npm install
npm run dev
