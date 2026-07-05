import { createClient } from "@deepgram/sdk";

// Node SDK; the token must be minted fresh on every request, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Short-lived token handed to the browser so the master key never leaves the
// server. Deepgram's default TTL is 30s; the connection stays authenticated
// once the handshake succeeds, so a small window is plenty.
const TOKEN_TTL_SECONDS = 60;

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "DEEPGRAM_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const deepgram = createClient(apiKey);
    const { result, error } = await deepgram.auth.grantToken({
      ttl_seconds: TOKEN_TTL_SECONDS,
    });

    if (error) {
      console.error("Failed to grant Deepgram token:", error);
      return Response.json({ error: "Failed to grant token" }, { status: 502 });
    }

    // result === { access_token, expires_in }
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error in authenticate route:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
