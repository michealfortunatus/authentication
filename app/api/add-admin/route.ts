import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectDB } from "../config/db";
import User from "../models/user.model";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export async function POST(req: Request) {
  await connectDB();

  const cookieStore = cookies();
  const token = (await cookieStore).get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let adminId: string;

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
    adminId = decoded.userId;
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const adminUser = await User.findById(adminId);
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const user = await User.findOneAndUpdate(
    { email },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    return NextResponse.json(
      { message: "User with this email does not exist" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "User promoted to admin",
    admin: {
      email: user.email,
      role: user.role,
    },
  });
}
