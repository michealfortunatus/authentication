import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectDB } from "../config/db";
import User from "../models/user.model";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export async function GET() {
  await connectDB();

  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("access_token")?.value || null;
  const refreshToken = (await cookieStore).get("refresh_token")?.value || null;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  let userId: string | null = null;

  // --- Validate access token ---
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as JwtPayload;
      userId = decoded.userId;
    } catch {
      // expired or invalid
    }
  }

  const res = NextResponse.next();

  // --- Validate refresh token if access token invalid ---
  if (!userId && refreshToken) {
    try {
      const decodedRefresh = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;
      userId = decodedRefresh.userId;

      // Issue new access token
      const newAccessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      res.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15,
        path: "/",
      });
    } catch {
      return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
    }
  }

  if (!userId) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  const user = await User.findById(userId).select("-password");
  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user }, { status: 200 });
}
