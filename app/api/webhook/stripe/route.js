import { NextResponse } from "next/server";

export async function POST(req) {
  return NextResponse.json({ 
    message: "Stripe webhooks are not used in this application" 
  }, { status: 200 });
}
