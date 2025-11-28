import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "../config/db";

export async function POST(request: Request) {
  await connectDB();

  try {
    const res = NextResponse.json(
      { message: "Logged out successfully." },
      { status: 200 }
    );

    // Delete cookies by overwriting them
    res.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0), // expire immediately
    });

    res.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    });

    return res;

  } catch (error) {
    return NextResponse.json(
      { message: "Error logging out." },
      { status: 500 }
    );
  }
}
