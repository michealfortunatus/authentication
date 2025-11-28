

#  Authentication System

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

```
Email: demo@demo.com
Password: Password123
```

---

## Environment Variables

Create a `.env.local` file in the root:

```env
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_random_access_token_secret
REFRESH_TOKEN_SECRET=your_random_refresh_token_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### How to Get Environment Variables

1. **MongoDB URI**: 
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster and get your connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

2. **Access & Refresh Token Secrets**:
   - Generate random strings (at least 32 characters)
   - Use: `openssl rand -base64 32` or any random string generator

3. **Base URL**:
   - Local: `http://localhost:3000`
   - Production: `https://your-app.vercel.app`

---

## Local Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/your-username/authentication.git
cd authentication
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/auth-db
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_min_32_chars
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_min_32_chars
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## Project Structure

```
authentication/
├── app/
│   ├── api/
│   │   ├── config/          # Configuration files
│   │   ├── fetch-user/      # GET endpoint to fetch logged-in user
│   │   ├── log-in/          # POST endpoint for user login
│   │   ├── log-out/         # POST endpoint for user logout
│   │   ├── models/          # MongoDB models (User schema)
│   │   ├── sign-up/         # POST endpoint for user registration
│   │   └── Utils/           # Utility functions (JWT, validation)
│   ├── login/               # Login page
│   ├── sign-up/             # Sign-up page
│   ├── favicon.ico
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page
├── node_modules/
├── providers/               # Context providers (Auth, etc.)
├── public/                  # Static assets
├── .env.local              # Environment variables (create this)
├── .gitignore
├── eslint.config.mjs
├── middleware.ts           # Next.js middleware for route protection
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

### Key Directories Explained

- **`app/api/`** - Backend API routes (serverless functions)
  - **`config/`** - Database connection and app configuration
  - **`models/`** - Mongoose schemas (User model)
  - **`Utils/`** - Helper functions (JWT generation, password hashing)
  - **`fetch-user/`**, **`log-in/`**, **`log-out/`**, **`sign-up/`** - API endpoints

- **`app/login/`** - Login page UI
- **`app/sign-up/`** - Registration page UI
- **`middleware.ts`** - Route protection logic (redirects unauthorized users)
- **`providers/`** - React context providers for global state management

---

## API Endpoints

### Base URL
- **Local**: `http://localhost:3000`
- **Production**: `https://your-app.vercel.app`

### Authentication Endpoints

| Method | Endpoint           | Description                       | Auth Required |
| ------ | ------------------ | --------------------------------- | ------------- |
| POST   | `/api/sign-up`     | Register new user                 | No            |
| POST   | `/api/log-in`      | Login user                        | No            |
| POST   | `/api/log-out`     | Logout user                       | Yes           |
| GET    | `/api/fetch-user`  | Fetch current logged-in user      | Yes           |

---

### API Request/Response Examples

#### 1. Sign Up

**Endpoint**: `POST /api/sign-up`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Success Response** (201):
```json
{
  "message": "User created successfully",
  "user": {
    "id": "648a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response** (400):
```json
{
  "error": "Email already exists"
}
```

---

#### 2. Log In

**Endpoint**: `POST /api/log-in`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Success Response** (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": "648a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Headers Set**:
- `Set-Cookie: accessToken=xxx; HttpOnly; Secure; SameSite=Strict; Max-Age=900`
- `Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`

**Error Response** (401):
```json
{
  "error": "Invalid credentials"
}
```

**Rate Limit Response** (429):
```json
{
  "error": "Too many login attempts. Please try again later."
}
```

---

#### 3. Fetch User

**Endpoint**: `GET /api/fetch-user`

**Headers Required**:
```
Cookie: accessToken=xxx
```

**Success Response** (200):
```json
{
  "user": {
    "id": "648a1b2c3d4e5f6g7h8i9j0k",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response** (401):
```json
{
  "error": "Unauthorized"
}
```

---

#### 4. Log Out

**Endpoint**: `POST /api/log-out`

**Headers Required**:
```
Cookie: accessToken=xxx; refreshToken=xxx
```

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

**Headers Set**:
- `Set-Cookie: accessToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
- `Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0`

---

## File Structure Details

### API Routes (`app/api/`)

```
api/
├── config/
│   └── db.ts              # MongoDB connection setup
├── models/
│   └── User.ts            # User schema (name, email, password)
├── Utils/
│   ├── jwt.ts             # JWT token generation & verification
│   ├── hash.ts            # Password hashing with bcrypt
│   └── validation.ts      # Input validation helpers
├── sign-up/
│   └── route.ts           # POST handler for registration
├── log-in/
│   └── route.ts           # POST handler for login (with rate limiting)
├── log-out/
│   └── route.ts           # POST handler for logout
└── fetch-user/
    └── route.ts           # GET handler to fetch current user
```

### Pages (`app/`)

```
app/
├── login/
│   └── page.tsx           # Login form UI
├── sign-up/
│   └── page.tsx           # Registration form UI
├── layout.tsx             # Root layout with providers
├── page.tsx               # Landing/home page
└── globals.css            # TailwindCSS styles
```

### Middleware (`middleware.ts`)

Protects routes by checking for valid access tokens:
- Redirects unauthenticated users to `/login`
- Allows access to public routes (`/`, `/login`, `/sign-up`)

---

## Testing the API

### Using cURL

**Sign Up**:
```bash
curl -X POST http://localhost:3000/api/sign-up \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Password123"}'
```

**Log In**:
```bash
curl -X POST http://localhost:3000/api/log-in \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"Password123"}'
```

**Fetch User**:
```bash
curl -X GET http://localhost:3000/api/fetch-user \
  -b cookies.txt
```

**Log Out**:
```bash
curl -X POST http://localhost:3000/api/log-out \
  -b cookies.txt
```

### Using Postman

1. Import the collection
2. Set base URL to `http://localhost:3000`
3. For authenticated requests, Postman will automatically handle cookies after login

---

## Security Features

- **JWT Tokens**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- **HttpOnly Cookies**: Tokens stored in HttpOnly cookies (not accessible via JavaScript)
- **Rate Limiting**: 5 login attempts per 15 minutes per IP
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Server-side validation for all inputs
- **Middleware Protection**: Automatic route protection via Next.js middleware

---

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   ```env
   MONGO_URI=your_production_mongodb_uri
   ACCESS_TOKEN_SECRET=your_production_access_secret
   REFRESH_TOKEN_SECRET=your_production_refresh_secret
   NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
   ```
4. Deploy

---

## Troubleshooting

### Common Issues

**Issue**: MongoDB connection error
- **Solution**: Check your MongoDB URI and ensure IP whitelist includes your IP (or allow all: `0.0.0.0/0`)

**Issue**: JWT token invalid
- **Solution**: Clear cookies and login again. Verify `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` match in `.env.local`

**Issue**: CORS errors
- **Solution**: Update `NEXT_PUBLIC_BASE_URL` to match your domain

**Issue**: Rate limiting on local development
- **Solution**: Wait 15 minutes or restart the server to reset rate limits

**Issue**: TypeScript errors
- **Solution**: Run `npm install` to ensure all types are installed

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Styling**: Tailwind CSS
- **Rate Limiting**: Custom middleware


---

## License

This project is licensed under the MIT License.

