import bcryptjs from "bcryptjs";
import User from "../models/user.model";
import { connectDB } from "../config/db";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// Simple in-memory rate limiting
const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  await connectDB();

  const body = await request.json();
  const { email, password } = body;

  const ip = request.headers.get("x-forwarded-for") || "local";
  const now = Date.now();

  if (!loginAttempts[ip]) loginAttempts[ip] = { count: 0, lastAttempt: now };
  const attempt = loginAttempts[ip];

  // Too many attempts
  if (attempt.count >= MAX_ATTEMPTS && now - attempt.lastAttempt < BLOCK_TIME) {
    return NextResponse.json({ message: "Too many attempts. Try again later." }, { status: 429 });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      attempt.count++;
      attempt.lastAttempt = now;
      return NextResponse.json({ message: "Invalid credentials." }, { status: 400 });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      attempt.count++;
      attempt.lastAttempt = now;
      return NextResponse.json({ message: "Invalid credentials." }, { status: 400 });
    }

    // Reset login attempts if correct
    loginAttempts[ip] = { count: 0, lastAttempt: now };

    // --------------------------------
    // GENERATE JWT TOKENS
    // --------------------------------
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );

    // --------------------------------
    // SET COOKIES WITH NextResponse
    // --------------------------------
    const res = NextResponse.json(
      {
        message: "Logged in successfully.",
        user: { ...user.toObject(), password: undefined },
      },
      { status: 200 }
    );

    res.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15, // 15 min
    });

    res.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;

  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
