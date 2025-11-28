import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ------------ PROTECTED ROUTES ONLY --------------- //
  const protectedRoutes = ["/dashboard"];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    // Public pages — allow
    return NextResponse.next();
  }

  // ------------ READ COOKIES --------------- //
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  let userId: string | null = null;

  // ------------ VERIFY ACCESS TOKEN --------------- //
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET) as JwtPayload;
      userId = decoded.userId;
    } catch {}
  }

  // ------------ IF NO ACCESS TOKEN, TRY REFRESH TOKEN --------------- //
  if (!userId && refreshToken) {
    try {
      const decodedRefresh = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as JwtPayload;
      userId = decodedRefresh.userId;

      // issue new access token
      const newAccessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      const res = NextResponse.next();
      res.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15,
        path: "/",
      });

      return res;
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // ------------ STILL NOT AUTHENTICATED --------------- //
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
