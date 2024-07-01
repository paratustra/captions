import { NextResponse } from "next/server";
import { DEEPGRAM_API_KEY } from "@/server.config";

export const revalidate = 0;

export async function GET(request) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Deepgram API key is not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { key: DEEPGRAM_API_KEY },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error in authenticate route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
