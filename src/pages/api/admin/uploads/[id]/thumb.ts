import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { uploadThumb } from "../../../../../lib/files/uploads";
import { jsonError } from "../../../../../lib/http";

export const PUT: APIRoute = async ({ params, request }) => {
  const result = await uploadThumb(env.DB, env.FILES, params.id ?? "", await request.arrayBuffer(), request.headers.get("Content-Type") ?? "");
  if (!result.ok) return jsonError(result.status, result.errors);
  return Response.json({ ok: true });
};
