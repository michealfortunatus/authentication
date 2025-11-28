# AppX Authentication System

A Next.js 14 authentication system with MongoDB, JWT access/refresh tokens, protected dashboard, and rate-limited login.

---

## Features

- Sign-up with validation and unique email
- Login with short-lived access token (15 min) and long-lived refresh token (7 days)
- Logout with full cookie invalidation
- Protected dashboard (server-side check)
- Rate-limiting on login to prevent brute-force attacks
- Responsive, simple UI with real API error messages
- JWT rotation & secure cookies

---

## Demo Credentials

Email: demo@demo.com

Password: Password123



---

## Environment Variables

Create a `.env` file in the root:

```env
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_random_access_token_secret
REFRESH_TOKEN_SECRET=your_random_refresh_token_secret
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

---



| Method | Endpoint        | Description                  |
| ------ | --------------- | ---------------------------- |
| POST   | /api/sign-up    | Register new user            |
| POST   | /api/log-in     | Login user                   |
| POST   | /api/log-out    | Logout user                  |
| GET    | /api/fetch-user | Fetch current logged-in user |


---


