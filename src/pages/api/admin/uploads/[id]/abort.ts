import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { abortUpload } from "../../../../../lib/files/uploads";
import { jsonError } from "../../../../../lib/http";

export const POST: APIRoute = async ({ params }) => {
  const result = await abortUpload(env.DB, env.FILES, params.id ?? "");
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ ok: true });
};
