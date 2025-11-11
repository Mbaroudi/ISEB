import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const userDataCookie = request.cookies.get("user_data");

    if (!userDataCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userDataCookie.value);
    return NextResponse.json({ user: userData });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 401 }
    );
  }
}
