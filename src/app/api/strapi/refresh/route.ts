import { NextRequest } from "next/server";
import { refreshStrapiCache } from "@/lib/service/strapi";

export async function POST(req: NextRequest) {
  const secret = process.env.STRAPI_REFRESH_SECRET;
  const provided = req.headers.get("x-refresh-secret");

  if (!secret || !provided || provided !== secret) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const summary = await refreshStrapiCache();
    return new Response(JSON.stringify({ message: "ok", ...summary }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to refresh Strapi cache:", error);
    return new Response(JSON.stringify({ message: "Failed to refresh" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


