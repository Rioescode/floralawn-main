import { NextResponse } from "next/server";

export async function POST(req) {
  return NextResponse.json({ 
    message: "This endpoint is not in use" 
  }, { status: 200 });
}
