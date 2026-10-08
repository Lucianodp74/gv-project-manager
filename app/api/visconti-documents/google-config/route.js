export async function GET() {
  return Response.json({
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    apiKey: process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    appId: process.env.GOOGLE_CLOUD_PROJECT_NUMBER || process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER || "",
  });
}
